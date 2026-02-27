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
    const onlineUsers = allUsers.filter(u => u.isOnline).length || 0;
    
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
          gte(focusSessions.startedAt, fromDate),
          lte(focusSessions.startedAt, toDate)
        )
      );
    
    const totalStudyTime = focusData.reduce((sum, session) => sum + (parseInt(session.duration) || 0), 0);
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
          feature: activityLog.action,
          count: count(activityLog.id)
        })
        .from(activityLog)
        .where(
          and(
            gte(activityLog.createdAt, fromDate),
            lte(activityLog.createdAt, toDate)
          )
        )
        .groupBy(activityLog.action)
        .orderBy(desc(count(activityLog.id)))
        .limit(10);
    } catch (err) {
      console.log('[Analytics] Could not fetch feature usage:', err);
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
        percentage: activeToday > 0 ? Math.round((Number(f.count) / activeToday) * 100) : 0
      })),
      deviceBreakdown: Object.fromEntries(
        deviceBreakdown.map(d => [d.device || 'unknown', Number(d.count)])
      )
    };
  } catch (error) {
    console.error('Error getting overview metrics:', error);
    // Return default data instead of throwing
    return {
      totalUsers: 0,
      onlineUsers: 0,
      activeToday: 0,
      totalStudyTime: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      tasksCompleted: 0,
      featureUsage: [],
      deviceBreakdown: {}
    };
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
          gte(focusSessions.startedAt, fromDate),
          lte(focusSessions.startedAt, toDate)
        )
      )
      .orderBy(focusSessions.startedAt);
    
    // Group by date
    const grouped = sessions.reduce((acc, session) => {
      const date = formatDate(new Date(session.startedAt));
      if (!acc[date]) {
        acc[date] = { date, minutes: 0, sessions: 0 };
      }
      acc[date].minutes += parseInt(session.duration) || 0;
      acc[date].sessions += 1;
      return acc;
    }, {} as Record<string, { date: string; minutes: number; sessions: number }>);
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting study time trend:', error);
    return [];
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
    console.error('[Analytics] Error getting peak usage hours (activityLog table may not exist):', error);
    // Return empty data if table doesn't exist
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      label: `${hour}:00`
    }));
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
    console.error('[Analytics] Error getting daily active users (activityLog table may not exist):', error);
    return [];
  }
}

// Get student usage list with trends
export async function getStudentUsageList(fromDate: Date, toDate: Date) {
  try {
    const allUsers = await db.select().from(users);
    const allStats = await db.select().from(userStats);
    
    // Get focus sessions for each user
    const focusSessionsData = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          gte(focusSessions.startedAt, fromDate),
          lte(focusSessions.startedAt, toDate)
        )
      );
    
    // Group focus sessions by user
    const sessionsByUser = focusSessionsData.reduce((acc, session) => {
      if (!acc[session.userId]) {
        acc[session.userId] = [];
      }
      acc[session.userId].push(session);
      return acc;
    }, {} as Record<string, typeof focusSessionsData>);
    
    // Build student usage list
    // Consider users online if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = allUsers.map(user => {
      const stats = allStats.find(s => s.userId === user.id);
      const sessions = sessionsByUser[user.id] || [];
      const totalMinutes = sessions.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
      
      // Calculate online status based on recent activity
      const isOnline = user.lastLoginAt && new Date(user.lastLoginAt) > fiveMinutesAgo &&
                       (!user.lastLogoutAt || new Date(user.lastLoginAt) > new Date(user.lastLogoutAt));
      
      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        isOnline,
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
    return [];
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
    let activities: any[] = [];
    try {
      activities = await db
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
    } catch (err) {
      console.log('[Analytics] Could not fetch activity timeline (activityLog table may not exist)');
    }
    
    // Get focus sessions
    const sessions = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          gte(focusSessions.startedAt, fromDate),
          lte(focusSessions.startedAt, toDate)
        )
      );
    
    const totalStudyTime = sessions.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
    
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

// Update daily metrics (call this daily via cron job)
export async function updateDailyMetrics(date?: Date) {
  try {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0); // Start of day
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    console.log(`📊 Updating daily metrics for ${targetDate.toISOString().split('T')[0]}...`);
    
    // Count active users (users who had any activity that day)
    const activeUsersResult = await db
      .selectDistinct({ userId: activityLog.userId })
      .from(activityLog)
      .where(
        and(
          gte(activityLog.createdAt, targetDate),
          lte(activityLog.createdAt, endDate)
        )
      );
    
    const activeUsers = activeUsersResult.length.toString();
    
    // Count new users registered that day
    const newUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, targetDate),
          lte(users.createdAt, endDate)
        )
      );
    
    const newUsers = (newUsersResult[0]?.count || 0).toString();
    
    // Count tasks completed that day
    const tasksCompletedResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.completed, true),
          gte(tasks.completedAt, targetDate),
          lte(tasks.completedAt, endDate)
        )
      );
    
    const tasksCompleted = (tasksCompletedResult[0]?.count || 0).toString();
    
    // Count focus sessions that day
    const focusSessionsResult = await db
      .select({ 
        count: count(),
        totalMinutes: sql<string>`SUM(CAST(${focusSessions.duration} AS INTEGER))`
      })
      .from(focusSessions)
      .where(
        and(
          gte(focusSessions.createdAt, targetDate),
          lte(focusSessions.createdAt, endDate)
        )
      );
    
    const focusSessionsCount = (focusSessionsResult[0]?.count || 0).toString();
    const totalFocusMinutes = (focusSessionsResult[0]?.totalMinutes || '0').toString();
    
    // Insert or update daily metrics
    const existingMetric = await db
      .select()
      .from(dailyMetrics)
      .where(eq(dailyMetrics.date, targetDate))
      .limit(1);
    
    if (existingMetric.length > 0) {
      // Update existing
      await db
        .update(dailyMetrics)
        .set({
          activeUsers,
          newUsers,
          tasksCompleted,
          focusSessions: focusSessionsCount,
          totalFocusMinutes,
        })
        .where(eq(dailyMetrics.date, targetDate));
      
      console.log(`✅ Updated metrics for ${targetDate.toISOString().split('T')[0]}`);
    } else {
      // Insert new
      await db.insert(dailyMetrics).values({
        date: targetDate,
        activeUsers,
        newUsers,
        tasksCompleted,
        focusSessions: focusSessionsCount,
        totalFocusMinutes,
      });
      
      console.log(`✅ Created metrics for ${targetDate.toISOString().split('T')[0]}`);
    }
    
    return {
      date: targetDate.toISOString().split('T')[0],
      activeUsers,
      newUsers,
      tasksCompleted,
      focusSessions: focusSessionsCount,
      totalFocusMinutes
    };
  } catch (error) {
    console.error('❌ Error updating daily metrics:', error);
    throw error;
  }
}

// Get daily metrics for a date range
export async function getDailyMetrics(startDate: Date, endDate: Date) {
  try {
    const metrics = await db
      .select()
      .from(dailyMetrics)
      .where(
        and(
          gte(dailyMetrics.date, startDate),
          lte(dailyMetrics.date, endDate)
        )
      )
      .orderBy(desc(dailyMetrics.date));
    
    return metrics;
  } catch (error) {
    console.error('Error getting daily metrics:', error);
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
