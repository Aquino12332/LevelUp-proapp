import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seedShop } from "./seed-shop";
import { startAlarmChecker } from "./alarm-checker";
import { startRecurringTasksScheduler } from "./recurring-tasks";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      log(`Error: ${message}`, "error");
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      log("Starting Vite dev server...", "vite");
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      log("Vite dev server ready", "vite");
    }
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    log(`Attempting to listen on port ${port}...`, "server");
    
    httpServer.on('error', (error: any) => {
      log(`Server error: ${error.message}`, "error");
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`, "error");
      }
    });
    
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      
      // Start background services AFTER a delay (allows database to wake up)
      setTimeout(() => {
        seedShop().catch(err => log(`Shop seed will retry later`, "seed-shop"));
        startAlarmChecker();
        startRecurringTasksScheduler(storage);
        log("Background services started", "services");
      }, 5000); // 5 second delay to allow Neon database to wake up
    });
  } catch (error) {
    log(`Fatal error during startup: ${error}`, "error");
    console.error(error);
    process.exit(1);
  }
})();
