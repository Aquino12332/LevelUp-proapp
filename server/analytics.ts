import { db } from "../db";
import { activityLog, dailyMetrics, userStats, focusSessions, tasks, users } from "@shared/schema";
import { sql, desc, eq, and, gte, lte, count } from "drizzle-orm";

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to get date range
function getDateRange(range: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return { from: today, to: now };
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo, to: now };
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { from: monthAgo, to: now };
    case 'quarter':
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return { from: quarterAgo, to: now };
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return { from: yearAgo, to: now };
    default:
      return { from: today, to: now };
  }
}

// Get aggregate overview metrics
export async function getOverviewMetrics(fromDate: Date, toDate: Date) {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;
    const onlineUsers = allUsers.filter(u => u.isOnline).length;
    
    // Check if activityLog table exists, if not return basic data
    let activeUsers: any[] = [];
    try {
      activeUsers = await db
        .select({ userId: activityLog.userId })
        .from(activityLog)
        .where(
          and(
            gte(activityLog.timestamp, fromDate),
            lte(activityLog.timestamp, toDate),
            eq(activityLog.action, 'login')
          )
        )
        .groupBy(activityLog.userId);
    } catch (err) {
      console.log('[Analytics] activityLog table not yet created, using fallback');
    }
    
    const activeToday = activeUsers.length;
    
    // Get total study time from focus sessions
    const focusData = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          gte(focusSessions.startTime, fromDate),
          lte(focusSessions.startTime, toDate)
        )
      );
    
    const totalStudyTime = focusData.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalSessions = focusData.length;
    const averageSessionDuration = totalSessions > 0 ? Math.round(totalStudyTime / totalSessions) : 0;
    
    // Get tasks completed
    const tasksData = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.completed, true),
          gte(tasks.createdAt, fromDate),
          lte(tasks.createdAt, toDate)
        )
      );
    
    const tasksCompleted = tasksData.length;
    
    // Get feature usage
    let featureUsage: any[] = [];
    try {
      featureUsage = await db
        .select({
          feature: activityLog.feature,
          count: count(activityLog.id)
        })
        .from(activityLog)
        .where(
          and(
            gte(activityLog.timestamp, fromDate),
            lte(activityLog.timestamp, toDate)
          )
        )
        .groupBy(activityLog.feature);
    } catch (err) {
      console.log('[Analytics] Could not fetch feature usage');
    }
    
    // Get device breakdown
    const deviceBreakdown = await db
      .select({
        device: users.deviceType,
        count: count(users.id)
      })
      .from(users)
      .where(sql`${users.deviceType} IS NOT NULL`)
      .groupBy(users.deviceType);
    
    return {
      totalUsers,
      onlineUsers,
      activeToday,
      totalStudyTime,
      totalSessions,
      averageSessionDuration,
      tasksCompleted,
      featureUsage: featureUsage.map(f => ({
        feature: f.feature || 'unknown',
        count: Number(f.count),
        percentage: Math.round((Number(f.count) / activeToday) * 100)
      })),
      deviceBreakdown: Object.fromEntries(
        deviceBreakdown.map(d => [d.device || 'unknown', Number(d.count)])
      )
    };
  } catch (error) {
    console.error('Error getting overview metrics:', error);
    throw error;
  }
}

// Get study time trend data
export async function getStudyTimeTrend(fromDate: Date, toDate: Date) {
  try {
    const sessions = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          gte(focusSessions.startTime, fromDate),
          lte(focusSessions.startTime, toDate)
        )
      )
      .orderBy(focusSessions.startTime);
    
    // Group by date
    const grouped = sessions.reduce((acc, session) => {
      const date = formatDate(new Date(session.startTime));
      if (!acc[date]) {
        acc[date] = { date, minutes: 0, sessions: 0 };
      }
      acc[date].minutes += session.duration || 0;
      acc[date].sessions += 1;
      return acc;
    }, {} as Record<string, { date: string; minutes: number; sessions: number }>);
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting study time trend:', error);
    throw error;
  }
}

// Get peak usage hours
export async function getPeakUsageHours(fromDate: Date, toDate: Date) {
  try {
    const activities = await db
      .select()
      .from(activityLog)
      .where(
        and(
          gte(activityLog.timestamp, fromDate),
          lte(activityLog.timestamp, toDate)
        )
      );
    
    // Group by hour
    const hourlyData = activities.reduce((acc, activity) => {
      const hour = new Date(activity.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Fill in missing hours
    const result = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyData[hour] || 0,
      label: `${hour}:00`
    }));
    
    return result;
  } catch (error) {
    console.error('Error getting peak usage hours:', error);
    throw error;
  }
}

// Get daily active users
export async function getDailyActiveUsers(fromDate: Date, toDate: Date) {
  try {
    const logins = await db
      .select()
      .from(activityLog)
      .where(
        and(
          eq(activityLog.action, 'login'),
          gte(activityLog.timestamp, fromDate),
          lte(activityLog.timestamp, toDate)
        )
      );
    
    // Group by date and count unique users
    const grouped = logins.reduce((acc, login) => {
      const date = formatDate(new Date(login.timestamp));
      if (!acc[date]) {
        acc[date] = new Set();
      }
      acc[date].add(login.userId);
      return acc;
    }, {} as Record<string, Set<string>>);
    
    return Object.entries(grouped)
      .map(([date, userIds]) => ({
        date,
        uniqueUsers: userIds.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting daily active users:', error);
    throw error;
  }
}

// Get student usage list with trends
export async function getStudentUsageList(fromDate: Date, toDate: Date) {
  try {
    const allUsers = await db.select().from(users);
    const allStats = await db.select().from(userStats);
    
    // Get focus sessions for each user
    const focusSessions = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          gte(focusSessions.startTime, fromDate),
          lte(focusSessions.startTime, toDate)
        )
      );
    
    // Group focus sessions by user
    const sessionsByUser = focusSessions.reduce((acc, session) => {
      if (!acc[session.userId]) {
        acc[session.userId] = [];
      }
      acc[session.userId].push(session);
      return acc;
    }, {} as Record<string, typeof focusSessions>);
    
    // Build student usage list
    const result = allUsers.map(user => {
      const stats = allStats.find(s => s.userId === user.id);
      const sessions = sessionsByUser[user.id] || [];
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      
      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
        lastLoginAt: user.lastLoginAt,
        deviceType: user.deviceType,
        totalStudyTime: totalMinutes,
        sessionCount: sessions.length,
        level: stats?.level || 1,
        xp: stats?.xp || 0,
        tasksCompleted: stats?.tasksCompleted || 0,
      };
    });
    
    return result.sort((a, b) => b.totalStudyTime - a.totalStudyTime);
  } catch (error) {
    console.error('Error getting student usage list:', error);
    throw error;
  }
}

// Get individual student details
export async function getStudentDetail(userId: string, fromDate: Date, toDate: Date) {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      throw new Error('User not found');
    }
    
    const stats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
    
    // Get activity timeline
    const activities = await db
      .select()
      .from(activityLog)
      .where(
        and(
          eq(activityLog.userId, userId),
          gte(activityLog.timestamp, fromDate),
          lte(activityLog.timestamp, toDate)
        )
      )
      .orderBy(desc(activityLog.timestamp))
      .limit(100);
    
    // Get focus sessions
    const sessions = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          gte(focusSessions.startTime, fromDate),
          lte(focusSessions.startTime, toDate)
        )
      );
    
    const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // Get tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.createdAt, fromDate),
          lte(tasks.createdAt, toDate)
        )
      );
    
    const tasksCompleted = userTasks.filter(t => t.completed).length;
    const tasksCreated = userTasks.length;
    
    return {
      user: user[0],
      stats: stats[0] || null,
      timeline: activities.map(a => ({
        timestamp: a.timestamp,
        action: a.action,
        feature: a.feature,
        details: a.details,
        deviceType: a.deviceType
      })),
      metrics: {
        totalStudyTime,
        focusSessions: sessions.length,
        tasksCompleted,
        tasksCreated,
        loginCount: activities.filter(a => a.action === 'login').length
      }
    };
  } catch (error) {
    console.error('Error getting student detail:', error);
    throw error;
  }
}

// Export data to CSV format
export function exportToCSV(data: any[], filename: string): string {
  if (data.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}
