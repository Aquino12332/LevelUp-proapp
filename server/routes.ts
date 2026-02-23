import type { Express } from "express";
import { savePushSubscription, removePushSubscription, sendPushToUser } from "./push";
import { testAlarmTrigger } from "./alarm-checker";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { apiLimiter, authLimiter, adminLimiter, createLimiter } from "./rate-limiter";
import type { InsertAlarm, InsertNote, InsertTask, InsertUserStats, InsertFocusSession, InsertShopItem, InsertUserInventory } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { LIMITS, LIMIT_MESSAGES } from "@shared/limits";
import { generateNoteSummary } from "./ai";
import { trackUserActivity, requireAdmin, detectDeviceType, getClientIp } from "./admin-middleware";
import { trackActivity } from "./activity-tracker";
import { 
  getOverviewMetrics, 
  getStudyTimeTrend, 
  getPeakUsageHours, 
  getDailyActiveUsers,
  getStudentUsageList,
  getStudentDetail,
  exportToCSV 
} from "./analytics";
import {
  trackAPIMetric,
  getServerMetrics,
  getDatabaseHealth,
  getAPIPerformance,
  getLoadMetrics,
  getSystemAlerts
} from "./system-health";

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware (using default memory store)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'levelup-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      },
      proxy: process.env.NODE_ENV === 'production', // Trust proxy for Render
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Track API performance metrics
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      trackAPIMetric({
        path: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode,
        timestamp: new Date()
      });
    });
    
    next();
  });

  // Apply rate limiting to all API routes (except alarm checker which runs frequently)
  app.use("/api", (req, res, next) => {
    // Skip rate limiting for alarm endpoints to prevent blocking alarm checks
    if (req.path.startsWith('/alarms')) {
      return next();
    }
    return apiLimiter(req, res, next);
  });
  
  // Track user activity on all API requests
  app.use("/api", trackUserActivity);
  
  // Track detailed activity logs
  app.use("/api", trackActivity);

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });


  // Authentication routes
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const { username, password, email, name, age, gender } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({ 
        username, 
        password: hashedPassword,
        email: email,
        provider: "local"
      });

      // Create user stats
      await storage.createUserStats(user.id, {
        name: name || "Student",
        age: age || null,
        gender: gender || null,
        level: "1",
        xp: "0",
        coins: "0",
        streak: "0",
        totalStudyTime: "0",
        tasksCompleted: "0",
      });

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.status(201).json({ 
        success: true, 
        user: { id: user.id, username: user.username } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password || "");
      if (!isValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      // Track login activity
      const deviceType = detectDeviceType(req.headers['user-agent']);
      const ipAddress = getClientIp(req);
      await storage.updateUserActivity(user.id, {
        lastLoginAt: new Date(),
        isOnline: true,
        deviceType,
      });
      await storage.createUserSession(user.id, {
        deviceType,
        userAgent: req.headers['user-agent'],
        ipAddress,
      });

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Track logout activity
      if (userId) {
        await storage.updateUserActivity(userId, {
          lastLogoutAt: new Date(),
          isOnline: false,
        });
      }

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });




  // Alarm routes
  app.get("/api/alarms", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const alarms = await storage.getAlarms(userId);
      res.json(alarms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alarms" });
    }
  });

  app.get("/api/alarms/:id", async (req, res) => {
    try {
      const alarm = await storage.getAlarm(req.params.id);
      if (!alarm) {
        return res.status(404).json({ error: "Alarm not found" });
      }
      res.json(alarm);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alarm" });
    }
  });

  app.post("/api/alarms", async (req, res) => {
    try {
      const { userId, ...alarmData } = req.body as { userId: string } & InsertAlarm;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Validate required fields
      if (!alarmData.label || alarmData.label.trim() === "") {
        return res.status(400).json({ error: "Alarm label is required" });
      }
      
      if (!alarmData.time) {
        return res.status(400).json({ error: "Alarm time is required" });
      }
      
      // Check alarm limit
      const existingAlarms = await storage.getUserAlarms(userId);
      if (existingAlarms.length >= LIMITS.MAX_ALARMS_PER_USER) {
        return res.status(400).json({ error: LIMIT_MESSAGES.ALARMS });
      }
      
      // Validate label length
      if (alarmData.label && alarmData.label.length > LIMITS.MAX_ALARM_LABEL_LENGTH) {
        return res.status(400).json({ error: `Alarm label must be ${LIMITS.MAX_ALARM_LABEL_LENGTH} characters or less` });
      }
      
      // Ensure repeatDays defaults to empty array if not provided
      if (!alarmData.repeatDays) {
        alarmData.repeatDays = "[]";
      }
      
      // Ensure enabled defaults to true if not provided
      if (alarmData.enabled === undefined) {
        alarmData.enabled = true;
      }
      
      // Ensure sound defaults to bell if not provided
      if (!alarmData.sound) {
        alarmData.sound = "bell";
      }
      
      // Ensure time has seconds (database expects HH:MM:SS format)
      if (alarmData.time && alarmData.time.length === 5) {
        alarmData.time = `${alarmData.time}:00`;
      }
      
      const alarm = await storage.createAlarm(userId, alarmData);
      res.status(201).json(alarm);
    } catch (error: any) {
      console.error("Error creating alarm:", error);
      res.status(500).json({ error: error.message || "Failed to create alarm" });
    }
  });

  app.put("/api/alarms/:id", async (req, res) => {
    try {
      const updateData = req.body;
      
      // Ensure time has seconds (database expects HH:MM:SS format)
      if (updateData.time && updateData.time.length === 5) {
        updateData.time = `${updateData.time}:00`;
      }
      
      const alarm = await storage.updateAlarm(req.params.id, updateData);
      if (!alarm) {
        return res.status(404).json({ error: "Alarm not found" });
      }
      res.json(alarm);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alarm" });
    }
  });

  app.delete("/api/alarms/:id", async (req, res) => {
    try {
      const success = await storage.deleteAlarm(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Alarm not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete alarm" });
    }
  });

  app.post("/api/alarms/:id/trigger", async (req, res) => {
    try {
      // Use the alarm checker to process the alarm (includes push notification)
      await testAlarmTrigger(req.params.id);
      
      // Get the updated alarm
      const alarm = await storage.getAlarm(req.params.id);
      if (!alarm) {
        return res.status(404).json({ error: "Alarm not found" });
      }
      
      res.json(alarm);
    } catch (error) {
      console.error("Failed to trigger alarm:", error);
      res.status(500).json({ error: "Failed to trigger alarm" });
    }
  });

  app.post("/api/alarms/:id/snooze", async (req, res) => {
    try {
      const { minutes } = req.body as { minutes: number };
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      const alarm = await storage.updateAlarm(req.params.id, {
        snoozeUntil,
      });
      if (!alarm) {
        return res.status(404).json({ error: "Alarm not found" });
      }
      res.json(alarm);
    } catch (error) {
      res.status(500).json({ error: "Failed to snooze alarm" });
    }
  });

  app.post("/api/alarms/:id/dismiss", async (req, res) => {
    try {
      const alarm = await storage.updateAlarm(req.params.id, {
        snoozeUntil: null,
      });
      if (!alarm) {
        return res.status(404).json({ error: "Alarm not found" });
      }
      res.json(alarm);
    } catch (error) {
      res.status(500).json({ error: "Failed to dismiss alarm" });
    }
  });

  // Note routes
  app.get("/api/notes", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const notes = await storage.getNotes(userId || "demo-user");
      // Sort notes by createdAt descending to show newest first
      const sortedNotes = notes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(sortedNotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", createLimiter, async (req, res) => {
    try {
      const { userId, ...noteData } = req.body as { userId: string } & InsertNote;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Check note limit
      const existingNotes = await storage.getUserNotes(userId);
      if (existingNotes.length >= LIMITS.MAX_NOTES_PER_USER) {
        return res.status(400).json({ error: LIMIT_MESSAGES.NOTES });
      }
      
      // Validate content length
      if (noteData.title && noteData.title.length > LIMITS.MAX_NOTE_TITLE_LENGTH) {
        return res.status(400).json({ error: `Note title must be ${LIMITS.MAX_NOTE_TITLE_LENGTH} characters or less` });
      }
      if (noteData.body && noteData.body.length > LIMITS.MAX_NOTE_BODY_LENGTH) {
        return res.status(400).json({ error: LIMIT_MESSAGES.NOTE_TOO_LONG });
      }
      
      const note = await storage.createNote(userId, noteData);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const success = await storage.deleteNote(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.post("/api/notes/:id/summarize", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Generate AI summary
      const summary = await generateNoteSummary(note.title, note.body);

      // Update note with the summary
      const updatedNote = await storage.updateNote(req.params.id, { aiSummary: summary });
      
      res.json({ summary, note: updatedNote });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const tasks = await storage.getTasks(userId);
      // Sort tasks: incomplete first, then by due date, then by priority
      const sortedTasks = tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      });
      res.json(sortedTasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const { userId, ...taskData } = req.body as { userId: string } & InsertTask;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Check task limit (only count active tasks, not completed)
      const existingTasks = await storage.getUserTasks(userId);
      const activeTasks = existingTasks.filter(t => !t.completed);
      if (activeTasks.length >= LIMITS.MAX_TASKS_PER_USER) {
        return res.status(400).json({ error: LIMIT_MESSAGES.TASKS });
      }
      
      // Validate content length
      if (taskData.title && taskData.title.length > LIMITS.MAX_TASK_TITLE_LENGTH) {
        return res.status(400).json({ error: `Task title must be ${LIMITS.MAX_TASK_TITLE_LENGTH} characters or less` });
      }
      if (taskData.description && taskData.description.length > LIMITS.MAX_TASK_DESCRIPTION_LENGTH) {
        return res.status(400).json({ error: `Task description must be ${LIMITS.MAX_TASK_DESCRIPTION_LENGTH} characters or less` });
      }
      
      // Convert dueDate string to Date object if present
      if (taskData.dueDate && typeof taskData.dueDate === 'string') {
        taskData.dueDate = new Date(taskData.dueDate) as any;
      }
      
      const task = await storage.createTask(userId, taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task", details: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const oldTask = await storage.getTask(req.params.id);
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Send push notification when task is completed
      if (req.body.completed && task.completed && oldTask && !oldTask.completed) {
        try {
          let icon = "/favicon.png";
          let emoji = "✅";
          
          // Different icons based on priority
          if (task.priority === "high") {
            emoji = "🎯";
          } else if (task.priority === "medium") {
            emoji = "✅";
          } else {
            emoji = "☑️";
          }
          
          await sendPushToUser(task.userId, {
            title: `${emoji} Task Completed!`,
            body: task.title,
            icon: icon,
            badge: "/favicon.png",
            tag: `task-complete-${task.id}`,
            data: {
              type: "task-complete",
              taskId: task.id,
              taskTitle: task.title,
              priority: task.priority,
              url: "/planner"
            }
          });
        } catch (pushError) {
          console.error("Failed to send task completion notification:", pushError);
        }
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // UserStats routes
  app.get("/api/user-stats/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      let stats = await storage.getUserStats(userId);
      
      // Create default stats if none exist
      if (!stats) {
        stats = await storage.createUserStats(userId, {
          name: "Student",
          level: "1",
          xp: "0",
          coins: "0",
          streak: "0",
          totalStudyTime: "0",
          tasksCompleted: "0",
        });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  app.get("/api/leaderboard/global", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getGlobalLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch global leaderboard" });
    }
  });

  app.patch("/api/user-stats/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const updates = req.body as Partial<InsertUserStats>;
      
      let stats = await storage.getUserStats(userId);
      const oldLevel = stats ? parseInt(stats.level) : 1;
      const oldStreak = stats ? parseInt(stats.streak) : 0;
      
      // Create if doesn't exist
      if (!stats) {
        stats = await storage.createUserStats(userId, {
          name: "Student",
          level: "1",
          xp: "0",
          coins: "0",
          streak: "0",
          totalStudyTime: "0",
          tasksCompleted: "0",
          ...updates,
        });
      } else {
        stats = await storage.updateUserStats(userId, updates);
      }
      
      if (stats) {
        const newLevel = parseInt(stats.level);
        const newStreak = parseInt(stats.streak);
        
        // Send level up notification
        if (newLevel > oldLevel) {
          try {
            await sendPushToUser(userId, {
              title: "⭐ Level Up!",
              body: `Congratulations! You've reached level ${newLevel}! Keep up the great work!`,
              icon: "/generated_images/3d_gold_coin_icon.png",
              badge: "/favicon.png",
              tag: `level-up-${newLevel}`,
              data: {
                type: "level-up",
                level: newLevel,
                url: "/profile"
              }
            });
          } catch (pushError) {
            console.error("Failed to send level up notification:", pushError);
          }
        }
        
        // Send streak milestone notifications (every 5 days)
        if (newStreak > oldStreak && newStreak % 5 === 0) {
          try {
            await sendPushToUser(userId, {
              title: "🔥 Streak Milestone!",
              body: `Amazing! You've maintained a ${newStreak}-day streak! Keep it going!`,
              icon: "/generated_images/3d_fire_flame_icon.png",
              badge: "/favicon.png",
              tag: `streak-${newStreak}`,
              data: {
                type: "streak-milestone",
                streak: newStreak,
                url: "/profile"
              }
            });
          } catch (pushError) {
            console.error("Failed to send streak notification:", pushError);
          }
        }
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user stats" });
    }
  });

  // FocusSession routes
  app.get("/api/focus-sessions", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const sessions = await storage.getFocusSessions(userId);
      // Sort by most recent first
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      res.json(sortedSessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch focus sessions" });
    }
  });

  app.get("/api/focus-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getFocusSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Focus session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch focus session" });
    }
  });

  app.post("/api/focus-sessions", async (req, res) => {
    try {
      const { userId, ...sessionData } = req.body as { userId: string } & InsertFocusSession;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const session = await storage.createFocusSession(userId, sessionData);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create focus session" });
    }
  });

  app.patch("/api/focus-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateFocusSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Focus session not found" });
      }
      
      // Send push notification when focus session is completed
      if (req.body.isCompleted && session.isCompleted) {
        try {
          const xpEarned = parseInt(session.xpEarned) || 0;
          const coinsEarned = parseInt(session.coinsEarned) || 0;
          const duration = parseInt(session.completedDuration) || 0;
          
          await sendPushToUser(session.userId, {
            title: "🔥 Focus Session Complete!",
            body: `Great job! You earned ${xpEarned} XP and ${coinsEarned} coins for ${duration} minutes of focus time.`,
            icon: "/generated_images/3d_fire_flame_icon.png",
            badge: "/favicon.png",
            tag: `focus-complete-${session.id}`,
            data: {
              sessionId: session.id,
              type: "focus-complete",
              url: "/focus",
              xpEarned,
              coinsEarned
            }
          });
        } catch (pushError) {
          console.error("Failed to send focus completion notification:", pushError);
        }
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update focus session" });
    }
  });

  // Shop routes
  app.get("/api/shop/items", async (req, res) => {
    try {
      const items = await storage.getShopItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shop items" });
    }
  });

  app.post("/api/shop/items", async (req, res) => {
    try {
      const item = await storage.createShopItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create shop item" });
    }
  });

  // Inventory routes
  app.get("/api/inventory/:userId", async (req, res) => {
    try {
      const inventory = await storage.getUserInventory(req.params.userId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory/purchase", async (req, res) => {
    try {
      const { userId, itemId } = req.body as { userId: string; itemId: string };
      
      // Get the item and user stats
      const item = await storage.getShopItem(itemId);
      const stats = await storage.getUserStats(userId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (!stats) {
        return res.status(404).json({ error: "User stats not found" });
      }
      
      const userCoins = parseInt(stats.coins);
      const itemPrice = parseInt(item.price);
      
      if (userCoins < itemPrice) {
        return res.status(400).json({ error: "Insufficient coins" });
      }
      
      // Deduct coins
      await storage.updateUserStats(userId, {
        coins: (userCoins - itemPrice).toString(),
      });
      
      // Add to inventory
      const inventoryItem = await storage.addToInventory(userId, {
        itemId,
        quantity: "1",
        isActive: false,
      });
      
      res.status(201).json({ success: true, inventoryItem });
    } catch (error) {
      res.status(500).json({ error: "Failed to purchase item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  // In-memory push subscription storage (minimal scaffold)
  const pushSubscriptions = new Map<string, any>();

  app.post('/api/push/subscribe', async (req, res) => {
    try {
      const { subscription, userId } = req.body as { subscription: any; userId?: string };
      if (!subscription) return res.status(400).json({ error: 'subscription is required' });
      
      // Use authenticated user or demo user
      const actualUserId = userId || req.user?.id || 'demo-user';
      
      await savePushSubscription(actualUserId, subscription);
      res.status(201).json({ success: true, userId: actualUserId });
    } catch (err) {
      console.error('Failed to save subscription:', err);
      res.status(500).json({ error: 'Failed to save subscription' });
    }
  });

  app.post('/api/push/unsubscribe', async (req, res) => {
    try {
      const { subscription } = req.body as { subscription: any };
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'subscription with endpoint is required' });
      }
      
      await removePushSubscription(subscription.endpoint);
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  });

  // Send push notification to a user
  app.post('/api/push/send', async (req, res) => {
    try {
      const { userId, title, body, icon, data } = req.body as { 
        userId: string; 
        title: string; 
        body: string; 
        icon?: string;
        data?: any;
      };
      
      if (!userId || !title || !body) {
        return res.status(400).json({ error: 'userId, title, and body are required' });
      }
      
      const result = await sendPushToUser(userId, { title, body, icon, data });
      res.json({ 
        success: result.success > 0, 
        sent: result.success, 
        failed: result.failed 
      });
    } catch (err) {
      console.error('Failed to send push:', err);
      res.status(500).json({ error: 'Failed to send push' });
    }
  });

  // Friend routes
  app.get("/api/friends/search", async (req, res) => {
    try {
      const { query, userId } = req.query as { query: string; userId: string };
      if (!query || !userId) {
        return res.status(400).json({ error: "query and userId are required" });
      }
      const users = await storage.searchUsers(query, userId);
      // Return users without passwords
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.post("/api/friends/request", async (req, res) => {
    try {
      const { senderId, receiverId } = req.body as { senderId: string; receiverId: string };
      if (!senderId || !receiverId) {
        return res.status(400).json({ error: "senderId and receiverId are required" });
      }
      
      // Check friend limit
      const senderFriends = await storage.getUserFriends(senderId);
      if (senderFriends.length >= LIMITS.MAX_FRIENDS_PER_USER) {
        return res.status(400).json({ error: LIMIT_MESSAGES.FRIENDS });
      }
      
      // Check pending request limit
      const pendingRequests = await storage.getPendingFriendRequestsForUser(senderId);
      if (pendingRequests.length >= LIMITS.MAX_PENDING_FRIEND_REQUESTS) {
        return res.status(400).json({ error: LIMIT_MESSAGES.FRIEND_REQUESTS });
      }
      
      const request = await storage.sendFriendRequest(senderId, receiverId);
      
      // Send push notification to receiver
      try {
        const sender = await storage.getUser(senderId);
        if (sender) {
          await sendPushToUser(receiverId, {
            title: "👥 New Friend Request",
            body: `${sender.username} wants to connect with you!`,
            icon: sender.avatar || "/generated_images/3d_student_avatar.png",
            badge: "/favicon.png",
            tag: `friend-request-${request.id}`,
            data: {
              type: "friend-request",
              requestId: request.id,
              senderId: sender.id,
              senderName: sender.username,
              url: "/social"
            }
          });
        }
      } catch (pushError) {
        console.error("Failed to send friend request notification:", pushError);
      }
      
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to send friend request" });
    }
  });

  app.get("/api/friends/requests", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const requests = await storage.getFriendRequests(userId);
      
      // Get sender info for each request
      const requestsWithSender = await Promise.all(
        requests.map(async (request) => {
          const sender = await storage.getUser(request.senderId);
          return {
            ...request,
            sender: sender ? { id: sender.id, username: sender.username } : null,
          };
        })
      );
      
      res.json(requestsWithSender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });

  app.get("/api/friends/requests/sent", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const requests = await storage.getSentFriendRequests(userId);
      
      // Get receiver info for each request
      const requestsWithReceiver = await Promise.all(
        requests.map(async (request) => {
          const receiver = await storage.getUser(request.receiverId);
          return {
            ...request,
            receiver: receiver ? { id: receiver.id, username: receiver.username } : null,
          };
        })
      );
      
      res.json(requestsWithReceiver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sent friend requests" });
    }
  });

  app.post("/api/friends/request/:id/accept", async (req, res) => {
    try {
      const requestData = await storage.getFriendRequest(req.params.id);
      const friendship = await storage.acceptFriendRequest(req.params.id);
      if (!friendship) {
        return res.status(404).json({ error: "Friend request not found or already processed" });
      }
      
      // Send push notification to sender that request was accepted
      if (requestData) {
        try {
          const accepter = await storage.getUser(requestData.receiverId);
          if (accepter) {
            await sendPushToUser(requestData.senderId, {
              title: "✅ Friend Request Accepted!",
              body: `${accepter.username} accepted your friend request!`,
              icon: accepter.avatar || "/generated_images/3d_student_avatar.png",
              badge: "/favicon.png",
              tag: `friend-accepted-${friendship.id}`,
              data: {
                type: "friend-accepted",
                friendshipId: friendship.id,
                friendId: accepter.id,
                friendName: accepter.username,
                url: "/social"
              }
            });
          }
        } catch (pushError) {
          console.error("Failed to send friend accepted notification:", pushError);
        }
      }
      
      res.json(friendship);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  app.post("/api/friends/request/:id/reject", async (req, res) => {
    try {
      const success = await storage.rejectFriendRequest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Friend request not found or already processed" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject friend request" });
    }
  });

  app.get("/api/friends", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const friends = await storage.getFriends(userId);
      
      // Get stats for each friend to show their activity
      const friendsWithStats = await Promise.all(
        friends.map(async (friend) => {
          const stats = await storage.getUserStats(friend.id);
          return {
            id: friend.id,
            username: friend.username,
            stats: stats || null,
          };
        })
      );
      
      res.json(friendsWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  app.delete("/api/friends/:friendId", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const friendId = req.params.friendId;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const success = await storage.removeFriend(userId, friendId);
      if (!success) {
        return res.status(404).json({ error: "Friendship not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // Admin routes - protected by requireAdmin middleware
  // Admin login route - validates admin secret and returns success
  app.post("/api/admin/login", adminLimiter, async (req, res) => {
    try {
      const adminSecret = req.headers['x-admin-secret'] as string;
      
      if (!process.env.ADMIN_SECRET) {
        return res.status(500).json({ error: "Admin secret not configured" });
      }
      
      if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        console.warn(`⚠️ Unauthorized admin login attempt from IP: ${getClientIp(req)}`);
        return res.status(403).json({ error: "Invalid admin credentials" });
      }
      
      console.log(`✅ Admin login successful from IP: ${getClientIp(req)}`);
      res.json({ success: true, message: "Admin authenticated successfully" });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Failed to authenticate admin" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const usersWithStats = await storage.getAllUsersWithStats();
      
      // Consider users online if they were active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Remove sensitive data and calculate online status
      const sanitizedUsers = usersWithStats.map(({ password, ...user }) => ({
        ...user,
        stats: user.stats,
        // Safe access to optional fields that may not exist yet
        isOnline: user.lastLoginAt ? (
          new Date(user.lastLoginAt) > fiveMinutesAgo &&
          (!user.lastLogoutAt || new Date(user.lastLoginAt) > new Date(user.lastLogoutAt))
        ) : false,
        lastLoginAt: user.lastLoginAt || null,
        lastLogoutAt: user.lastLogoutAt || null,
        deviceType: user.deviceType || null,
      }));
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("[Admin] Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users", details: (error as Error).message });
    }
  });

  app.get("/api/admin/users/:userId/sessions", requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      console.error("Failed to fetch user sessions:", error);
      res.status(500).json({ error: "Failed to fetch user sessions" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsersWithStats();
      
      const totalUsers = allUsers.length;
      
      // Consider users online if they were active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineUsers = allUsers.filter(u => 
        u.lastLoginAt && new Date(u.lastLoginAt) > fiveMinutesAgo &&
        (!u.lastLogoutAt || new Date(u.lastLoginAt) > new Date(u.lastLogoutAt))
      ).length;
      
      // Users active in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeToday = allUsers.filter(u => 
        u.lastLoginAt && new Date(u.lastLoginAt) > oneDayAgo
      ).length;
      
      // Device breakdown - safe access to deviceType
      const deviceBreakdown = allUsers.reduce((acc, user) => {
        const device = user.deviceType || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Recent registrations (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentRegistrations = allUsers.filter(u => 
        new Date(u.createdAt) > sevenDaysAgo
      ).length;
      
      res.json({
        totalUsers,
        onlineUsers,
        activeToday,
        recentRegistrations,
        deviceBreakdown,
      });
    } catch (error) {
      console.error("[Admin] Failed to fetch admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats", details: (error as Error).message });
    }
  });


  // Analytics endpoints
  app.get("/api/admin/analytics/overview", requireAdmin, async (req, res) => {
    try {
      const { from, to, range } = req.query;
      
      let fromDate: Date, toDate: Date;
      
      if (range && typeof range === 'string') {
        // Use preset range
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (range) {
          case 'today':
            fromDate = today;
            toDate = now;
            break;
          case 'week':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - 7);
            toDate = now;
            break;
          case 'month':
            fromDate = new Date(today);
            fromDate.setMonth(fromDate.getMonth() - 1);
            toDate = now;
            break;
          default:
            fromDate = today;
            toDate = now;
        }
      } else if (from && to) {
        // Use custom range
        fromDate = new Date(from as string);
        toDate = new Date(to as string);
      } else {
        // Default to today
        const now = new Date();
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        toDate = now;
      }
      
      const metrics = await getOverviewMetrics(fromDate, toDate);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to get overview metrics:", error);
      res.status(500).json({ error: "Failed to get overview metrics" });
    }
  });

  app.get("/api/admin/analytics/study-time-trend", requireAdmin, async (req, res) => {
    try {
      const { from, to, range } = req.query;
      
      let fromDate: Date, toDate: Date;
      
      if (range && typeof range === 'string') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (range) {
          case 'today':
            fromDate = today;
            toDate = now;
            break;
          case 'week':
            fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            toDate = now;
            break;
          case 'month':
            fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            toDate = now;
            break;
          default:
            fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            toDate = now;
        }
      } else {
        fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        toDate = to ? new Date(to as string) : new Date();
      }
      
      const trend = await getStudyTimeTrend(fromDate, toDate);
      res.json(trend);
    } catch (error) {
      console.error("Failed to get study time trend:", error);
      res.status(500).json({ error: "Failed to get study time trend" });
    }
  });

  app.get("/api/admin/analytics/peak-hours", requireAdmin, async (req, res) => {
    try {
      const { from, to, range } = req.query;
      
      let fromDate: Date, toDate: Date;
      
      if (range && typeof range === 'string') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (range) {
          case 'today':
            fromDate = today;
            toDate = now;
            break;
          case 'week':
            fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            toDate = now;
            break;
          case 'month':
            fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            toDate = now;
            break;
          default:
            fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            toDate = now;
        }
      } else {
        fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        toDate = to ? new Date(to as string) : new Date();
      }
      
      const hours = await getPeakUsageHours(fromDate, toDate);
      res.json(hours);
    } catch (error) {
      console.error("Failed to get peak usage hours:", error);
      res.status(500).json({ error: "Failed to get peak usage hours" });
    }
  });

  app.get("/api/admin/analytics/daily-active-users", requireAdmin, async (req, res) => {
    try {
      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();
      
      const dau = await getDailyActiveUsers(fromDate, toDate);
      res.json(dau);
    } catch (error) {
      console.error("Failed to get daily active users:", error);
      res.status(500).json({ error: "Failed to get daily active users" });
    }
  });

  app.get("/api/admin/analytics/student-usage", requireAdmin, async (req, res) => {
    try {
      const { from, to, range } = req.query;
      
      let fromDate: Date, toDate: Date;
      
      if (range && typeof range === 'string') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (range) {
          case 'today':
            fromDate = today;
            toDate = now;
            break;
          case 'week':
            fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            toDate = now;
            break;
          case 'month':
            fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            toDate = now;
            break;
          default:
            fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            toDate = now;
        }
      } else {
        fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        toDate = to ? new Date(to as string) : new Date();
      }
      
      const students = await getStudentUsageList(fromDate, toDate);
      res.json(students);
    } catch (error) {
      console.error("Failed to get student usage:", error);
      res.status(500).json({ error: "Failed to get student usage" });
    }
  });

  app.get("/api/admin/analytics/student/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();
      
      const detail = await getStudentDetail(userId, fromDate, toDate);
      res.json(detail);
    } catch (error) {
      console.error("Failed to get student detail:", error);
      res.status(500).json({ error: "Failed to get student detail" });
    }
  });

  app.get("/api/admin/analytics/export", requireAdmin, async (req, res) => {
    try {
      const { type, from, to } = req.query;
      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();
      
      let data: any[] = [];
      let filename = 'export.csv';
      
      if (type === 'students') {
        data = await getStudentUsageList(fromDate, toDate);
        filename = 'student-usage.csv';
      } else if (type === 'study-time') {
        data = await getStudyTimeTrend(fromDate, toDate);
        filename = 'study-time-trend.csv';
      } else if (type === 'dau') {
        data = await getDailyActiveUsers(fromDate, toDate);
        filename = 'daily-active-users.csv';
      }
      
      const csv = exportToCSV(data, filename);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      console.error("Failed to export data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // System Health endpoints
  app.get("/api/admin/health", requireAdmin, async (req, res) => {
    try {
      const server = getServerMetrics();
      const database = await getDatabaseHealth();
      const api = getAPIPerformance();
      const load = await getLoadMetrics();
      const alerts = getSystemAlerts();
      
      res.json({
        server,
        database,
        api,
        load,
        alerts
      });
    } catch (error) {
      console.error("Failed to get system health:", error);
      res.status(500).json({ error: "Failed to get system health" });
    }
  });

  app.get("/api/admin/health/server", requireAdmin, async (req, res) => {
    try {
      const metrics = getServerMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Failed to get server metrics:", error);
      res.status(500).json({ error: "Failed to get server metrics" });
    }
  });

  app.get("/api/admin/health/database", requireAdmin, async (req, res) => {
    try {
      const health = await getDatabaseHealth();
      res.json(health);
    } catch (error) {
      console.error("Failed to get database health:", error);
      res.status(500).json({ error: "Failed to get database health" });
    }
  });

  app.get("/api/admin/health/api-performance", requireAdmin, async (req, res) => {
    try {
      const performance = getAPIPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Failed to get API performance:", error);
      res.status(500).json({ error: "Failed to get API performance" });
    }
  });

  app.get("/api/admin/health/load", requireAdmin, async (req, res) => {
    try {
      const load = await getLoadMetrics();
      res.json(load);
    } catch (error) {
      console.error("Failed to get load metrics:", error);
      res.status(500).json({ error: "Failed to get load metrics" });
    }
  });

  app.get("/api/admin/health/alerts", requireAdmin, async (req, res) => {
    try {
      const alerts = getSystemAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Failed to get system alerts:", error);
      res.status(500).json({ error: "Failed to get system alerts" });
    }
  });

  return httpServer;
}
