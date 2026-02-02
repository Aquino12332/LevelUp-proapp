import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Helper to detect device type from user agent
export function detectDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }
  
  return "desktop";
}

// Helper to get client IP address
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Middleware to track user activity
export async function trackUserActivity(req: Request, res: Response, next: NextFunction) {
  // Only track authenticated users
  if (!req.session?.userId) {
    return next();
  }

  try {
    const userId = req.session.userId;
    const deviceType = detectDeviceType(req.headers['user-agent']);
    
    // Update user's last activity and device info
    await storage.updateUserActivity(userId, {
      lastLoginAt: new Date(),
      deviceType,
      isOnline: true,
    });
  } catch (error) {
    console.error("Error tracking user activity:", error);
    // Don't fail the request if tracking fails
  }

  next();
}

// Middleware to verify admin access
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret || req.body.adminSecret;
  
  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({ error: "Admin secret not configured" });
  }
  
  if (adminSecret !== process.env.ADMIN_SECRET) {
    console.warn(`⚠️ Unauthorized admin access attempt from IP: ${getClientIp(req)}`);
    return res.status(403).json({ error: "Unauthorized - Invalid admin credentials" });
  }
  
  next();
}
