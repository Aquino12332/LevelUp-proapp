import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { activityLog } from "@shared/schema";
import { sql } from "drizzle-orm";
import { getClientIp, detectDeviceType } from "./admin-middleware";

// Action type mappings for different endpoints
const actionMap: Record<string, { action: string; feature: string }> = {
  // Authentication
  "POST:/api/auth/login": { action: "login", feature: "auth" },
  "POST:/api/auth/logout": { action: "logout", feature: "auth" },
  "POST:/api/auth/register": { action: "register", feature: "auth" },
  
  // Tasks
  "POST:/api/tasks": { action: "task_created", feature: "planner" },
  "PUT:/api/tasks": { action: "task_updated", feature: "planner" },
  "DELETE:/api/tasks": { action: "task_deleted", feature: "planner" },
  "PATCH:/api/tasks/complete": { action: "task_completed", feature: "planner" },
  "PATCH:/api/tasks/uncomplete": { action: "task_uncompleted", feature: "planner" },
  
  // Focus Sessions
  "POST:/api/focus": { action: "focus_started", feature: "focus" },
  "PUT:/api/focus": { action: "focus_completed", feature: "focus" },
  "PATCH:/api/focus/pause": { action: "focus_paused", feature: "focus" },
  
  // Notes
  "POST:/api/notes": { action: "note_created", feature: "notes" },
  "PUT:/api/notes": { action: "note_updated", feature: "notes" },
  "DELETE:/api/notes": { action: "note_deleted", feature: "notes" },
  
  // Shop
  "POST:/api/shop/purchase": { action: "item_purchased", feature: "shop" },
  "POST:/api/shop/use": { action: "powerup_used", feature: "shop" },
  
  // Social
  "POST:/api/friends/request": { action: "friend_request_sent", feature: "social" },
  "POST:/api/friends/accept": { action: "friend_request_accepted", feature: "social" },
  "DELETE:/api/friends": { action: "friend_removed", feature: "social" },
  
  // Profile
  "PUT:/api/user/profile": { action: "profile_updated", feature: "profile" },
  "PUT:/api/user/avatar": { action: "avatar_changed", feature: "profile" },
  
  // Alarms
  "POST:/api/alarms": { action: "alarm_created", feature: "alarm" },
  "PUT:/api/alarms": { action: "alarm_updated", feature: "alarm" },
  "DELETE:/api/alarms": { action: "alarm_deleted", feature: "alarm" },
};

// Determine action and feature from request
function determineAction(method: string, path: string): { action: string; feature: string } | null {
  const key = `${method}:${path}`;
  
  // Try exact match
  if (actionMap[key]) {
    return actionMap[key];
  }
  
  // Try pattern matching for dynamic routes (e.g., /api/tasks/:id)
  for (const [pattern, mapping] of Object.entries(actionMap)) {
    const [patternMethod, patternPath] = pattern.split(':');
    if (method === patternMethod && matchPath(path, patternPath)) {
      return mapping;
    }
  }
  
  return null;
}

// Simple path matcher for dynamic routes
function matchPath(actualPath: string, patternPath: string): boolean {
  const actualParts = actualPath.split('/').filter(p => p);
  const patternParts = patternPath.split('/').filter(p => p);
  
  if (actualParts.length !== patternParts.length) {
    return false;
  }
  
  return patternParts.every((part, i) => {
    return part === actualParts[i] || part.startsWith(':');
  });
}

// Extract details from request for logging
function extractDetails(req: Request, action: string): string | null {
  try {
    const details: any = {};
    
    // Add relevant data based on action
    if (action.includes('task')) {
      if (req.body.title) details.taskTitle = req.body.title;
      if (req.body.priority) details.priority = req.body.priority;
    } else if (action.includes('focus')) {
      if (req.body.duration) details.duration = req.body.duration;
    } else if (action.includes('note')) {
      if (req.body.title) details.noteTitle = req.body.title;
    } else if (action.includes('item_purchased')) {
      if (req.body.itemId) details.itemId = req.body.itemId;
      if (req.body.cost) details.cost = req.body.cost;
    }
    
    return Object.keys(details).length > 0 ? JSON.stringify(details) : null;
  } catch {
    return null;
  }
}

// Middleware to track user activity
export async function trackActivity(req: Request, res: Response, next: NextFunction) {
  // Only track authenticated users
  if (!req.session?.userId) {
    return next();
  }
  
  // Skip tracking for admin and health check endpoints
  if (req.path.startsWith('/api/admin') || req.path === '/api/health') {
    return next();
  }
  
  // Track after response is sent
  res.on('finish', async () => {
    // Only track successful requests
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const actionInfo = determineAction(req.method, req.path);
      
      if (actionInfo) {
        try {
          await db.insert(activityLog).values({
            userId: req.session.userId!,
            action: actionInfo.action,
            feature: actionInfo.feature,
            details: extractDetails(req, actionInfo.action),
            timestamp: new Date(),
            deviceType: detectDeviceType(req.headers['user-agent']),
            ipAddress: getClientIp(req),
          });
          
          console.log(`[Activity] ${req.session.userId} - ${actionInfo.action}`);
        } catch (error) {
          // Log error but don't fail the request
          console.error('[Activity Tracker] Error logging activity:', error);
        }
      }
    }
  });
  
  next();
}

// Helper function to log custom activities (for use in route handlers)
export async function logActivity(data: {
  userId: string;
  action: string;
  feature: string;
  details?: string;
  deviceType?: string;
  ipAddress?: string;
}) {
  try {
    await db.insert(activityLog).values({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Activity Tracker] Error logging custom activity:', error);
  }
}

// Function to get activity count for a specific action (for metrics)
export async function getActivityCount(userId: string, action: string, fromDate: Date): Promise<number> {
  try {
    const result = await db
      .select()
      .from(activityLog)
      .where(sql`"userId" = ${userId} AND "action" = ${action} AND "timestamp" >= ${fromDate}`);
    
    return result.length;
  } catch (error) {
    console.error('[Activity Tracker] Error getting activity count:', error);
    return 0;
  }
}
