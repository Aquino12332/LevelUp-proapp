import type { Express } from "express";
import { db } from "../db";
import { guestSessions, guestMonthlyStats } from "../shared/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";

export function initGuestTracking(app: Express) {
  // Track guest visitor activity
  app.post("/api/guest/track", async (req, res) => {
    try {
      const { sessionId, deviceType, pageVisited, timeSpent } = req.body;

      if (!sessionId || !pageVisited) {
        return res.status(400).json({ error: "sessionId and pageVisited are required" });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      await db.insert(guestSessions).values({
        sessionId,
        deviceType: deviceType || "unknown",
        pageVisited,
        visitTimestamp: now,
        timeSpent: timeSpent || 0,
        convertedToUser: false,
        expiresAt,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Guest tracking error:", error);
      res.status(500).json({ error: "Failed to track guest activity" });
    }
  });

  // Convert guest to registered user
  app.post("/api/guest/convert", async (req, res) => {
    try {
      const { sessionId, userId } = req.body;

      if (!sessionId || !userId) {
        return res.status(400).json({ error: "sessionId and userId are required" });
      }

      await db
        .update(guestSessions)
        .set({ convertedToUser: true, userId })
        .where(eq(guestSessions.sessionId, sessionId));

      res.json({ success: true });
    } catch (error) {
      console.error("Guest conversion error:", error);
      res.status(500).json({ error: "Failed to convert guest" });
    }
  });

  // Get guest analytics for admin
  app.get("/api/admin/guests", async (req, res) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get recent guest sessions
      const sessions = await db
        .select()
        .from(guestSessions)
        .where(gte(guestSessions.visitTimestamp, sevenDaysAgo))
        .orderBy(desc(guestSessions.visitTimestamp))
        .limit(100);

      // Calculate analytics
      const totalSessions = sessions.length;
      const uniqueGuests = new Set(sessions.map(s => s.sessionId)).size;
      const conversions = sessions.filter(s => s.convertedToUser).length;
      const conversionRate = totalSessions > 0 ? (conversions / uniqueGuests) * 100 : 0;

      const deviceBreakdown = sessions.reduce((acc, s) => {
        acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get monthly stats
      const monthlyStats = await db
        .select()
        .from(guestMonthlyStats)
        .orderBy(desc(guestMonthlyStats.month))
        .limit(12);

      res.json({
        recentSessions: sessions,
        analytics: {
          totalSessions,
          uniqueGuests,
          conversions,
          conversionRate: Math.round(conversionRate * 10) / 10,
          deviceBreakdown,
        },
        monthlyStats,
      });
    } catch (error) {
      console.error("Failed to get guest analytics:", error);
      res.status(500).json({ error: "Failed to get guest analytics" });
    }
  });
}
