import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Helper to detect device type from user agent (enhanced)
export function detectDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  
  const ua = userAgent; // Keep original case for case-sensitive tests
  
  // Check for tablets first (iPad, Android tablets, etc.)
  if (/(iPad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return "tablet";
  }
  
  // Check for mobile devices (phones)
  // Enhanced to catch more mobile devices including Redmi and other Android phones
  if (/(mobile|android.*mobile|iphone|ipod|blackberry|windows phone|opera mini|iemobile|kindle|webos)/i.test(ua)) {
    return "mobile";
  }
  
  // Check for specific mobile brands that might not have "mobile" in UA
  if (/(xiaomi|redmi|huawei|oppo|vivo|samsung.*sm-|oneplus)/i.test(ua)) {
    return "mobile";
  }
  
  // Default to desktop
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
    const ip = getClientIp(req);
    const timestamp = new Date().toISOString();
    const userAgent = req.headers['user-agent'] || 'unknown';
    const endpoint = req.path;
    
    // Enhanced logging
    console.warn(`🚨 SECURITY ALERT - Unauthorized admin access attempt`);
    console.warn(`   ├─ Time: ${timestamp}`);
    console.warn(`   ├─ IP: ${ip}`);
    console.warn(`   ├─ Endpoint: ${endpoint}`);
    console.warn(`   ├─ User-Agent: ${userAgent}`);
    console.warn(`   └─ Secret provided: ${adminSecret ? '[REDACTED]' : '[NONE]'}`);
    
    return res.status(403).json({ error: "Unauthorized - Invalid admin credentials" });
  }
  
  next();
}
