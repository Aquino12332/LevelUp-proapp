import { db } from "../db";
import { users } from "@shared/schema";
import os from "os";

// Track API performance
interface APIMetric {
  path: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

const apiMetrics: APIMetric[] = [];
const MAX_METRICS = 1000; // Keep last 1000 requests

// Add metric to tracking
export function trackAPIMetric(metric: APIMetric) {
  apiMetrics.push(metric);
  
  // Keep only last MAX_METRICS
  if (apiMetrics.length > MAX_METRICS) {
    apiMetrics.shift();
  }
}

// Get server metrics
export function getServerMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = Math.round((usedMem / totalMem) * 100);
  
  // Get Node.js process memory
  const processMemory = process.memoryUsage();
  const processMemMB = Math.round(processMemory.heapUsed / 1024 / 1024);
  
  // Calculate uptime
  const uptime = process.uptime();
  
  // Get CPU usage (approximate)
  const cpuUsage = process.cpuUsage();
  const cpuPercent = Math.min(Math.round((cpuUsage.user + cpuUsage.system) / 1000000), 100);
  
  return {
    status: memPercentage > 80 ? 'warning' : cpuPercent > 70 ? 'warning' : 'healthy',
    uptime: Math.round(uptime),
    uptimeFormatted: formatUptime(uptime),
    cpu: {
      usage: Math.min(cpuPercent, 100),
      status: cpuPercent > 85 ? 'critical' : cpuPercent > 70 ? 'high' : 'normal'
    },
    memory: {
      used: processMemMB,
      total: 512, // Render free tier
      percentage: Math.round((processMemMB / 512) * 100),
      status: processMemMB > 480 ? 'critical' : processMemMB > 400 ? 'high' : 'normal'
    }
  };
}

// Get database health
export async function getDatabaseHealth() {
  try {
    const startTime = Date.now();
    
    // Simple ping query
    await db.select().from(users).limit(1);
    
    const ping = Date.now() - startTime;
    
    // Get connection pool info (approximate)
    const connections = {
      active: 5, // Approximate, would need actual pool stats
      max: 20,
      percentage: 25,
      idle: 15
    };
    
    return {
      status: ping > 100 ? 'warning' : 'healthy',
      ping,
      connections,
      performance: {
        averageQueryTime: getAverageQueryTime(),
        slowQueries: getSlowQueries()
      }
    };
  } catch (error) {
    return {
      status: 'critical',
      ping: 0,
      connections: { active: 0, max: 20, percentage: 0, idle: 0 },
      performance: { averageQueryTime: 0, slowQueries: [] },
      error: 'Database connection failed'
    };
  }
}

// Get API performance metrics
export function getAPIPerformance() {
  if (apiMetrics.length === 0) {
    return {
      endpoints: [],
      recentRequests: []
    };
  }
  
  // Group by endpoint
  const endpointMap = new Map<string, APIMetric[]>();
  
  apiMetrics.forEach(metric => {
    const key = `${metric.method}:${metric.path}`;
    if (!endpointMap.has(key)) {
      endpointMap.set(key, []);
    }
    endpointMap.get(key)!.push(metric);
  });
  
  // Calculate stats for each endpoint
  const endpoints = Array.from(endpointMap.entries()).map(([key, metrics]) => {
    const [method, path] = key.split(':');
    const durations = metrics.map(m => m.duration);
    // Only count server errors (5xx), not client/auth errors (4xx)
    const errors = metrics.filter(m => m.statusCode >= 500).length;
    
    const avgTime = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const maxTime = Math.max(...durations);
    const minTime = Math.min(...durations);
    
    return {
      path,
      method,
      count: metrics.length,
      averageTime: avgTime,
      minTime,
      maxTime,
      errors,
      errorRate: Math.round((errors / metrics.length) * 100),
      status: avgTime > 1000 ? 'critical' : avgTime > 500 ? 'slow' : avgTime > 200 ? 'normal' : 'fast'
    };
  });
  
  // Sort by count (most used endpoints first)
  endpoints.sort((a, b) => b.count - a.count);
  
  // Get recent requests (last 20)
  const recentRequests = apiMetrics
    .slice(-20)
    .reverse()
    .map(m => ({
      timestamp: m.timestamp,
      path: m.path,
      method: m.method,
      duration: m.duration,
      statusCode: m.statusCode
    }));
  
  return {
    endpoints: endpoints.slice(0, 10), // Top 10 endpoints
    recentRequests
  };
}

// Get load metrics
export async function getLoadMetrics() {
  try {
    // Get online users
    // Consider users online if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const allUsers = await db.select().from(users);
    const onlineUsers = allUsers.filter(user => 
      user.lastLoginAt && new Date(user.lastLoginAt) > fiveMinutesAgo &&
      (!user.lastLogoutAt || new Date(user.lastLoginAt) > new Date(user.lastLogoutAt))
    );
    
    return {
      currentLoad: {
        concurrentUsers: onlineUsers.length,
        activeRequests: 0, // Would need middleware to track
        queuedRequests: 0
      },
      capacity: {
        estimated: 80,
        current: onlineUsers.length,
        percentage: Math.round((onlineUsers.length / 80) * 100),
        recommendation: onlineUsers.length > 60 ? 'Consider upgrading to handle more users' : 'System running within capacity'
      }
    };
  } catch (error) {
    return {
      currentLoad: { concurrentUsers: 0, activeRequests: 0, queuedRequests: 0 },
      capacity: { estimated: 80, current: 0, percentage: 0, recommendation: 'Unable to determine capacity' }
    };
  }
}

// Get system alerts
export function getSystemAlerts() {
  const alerts: any[] = [];
  const serverMetrics = getServerMetrics();
  
  // Check CPU
  if (serverMetrics.cpu.usage > 85) {
    alerts.push({
      id: `cpu-${Date.now()}`,
      timestamp: new Date(),
      severity: 'critical',
      type: 'cpu',
      message: 'Critical CPU usage',
      details: `CPU usage at ${serverMetrics.cpu.usage}%`,
      recommendations: [
        'Consider upgrading to Render Starter plan',
        'Optimize heavy computations',
        'Check for infinite loops or heavy processes'
      ]
    });
  } else if (serverMetrics.cpu.usage > 70) {
    alerts.push({
      id: `cpu-${Date.now()}`,
      timestamp: new Date(),
      severity: 'warning',
      type: 'cpu',
      message: 'High CPU usage',
      details: `CPU usage at ${serverMetrics.cpu.usage}%`,
      recommendations: [
        'Monitor for continued high usage',
        'Consider optimization if persistent'
      ]
    });
  }
  
  // Check Memory
  if (serverMetrics.memory.percentage > 90) {
    alerts.push({
      id: `memory-${Date.now()}`,
      timestamp: new Date(),
      severity: 'critical',
      type: 'memory',
      message: 'Critical memory usage',
      details: `Memory at ${serverMetrics.memory.percentage}% (${serverMetrics.memory.used}/${serverMetrics.memory.total} MB)`,
      recommendations: [
        'Upgrade to Render Starter plan (2 GB RAM)',
        'Check for memory leaks',
        'Clear unused cache or data'
      ]
    });
  } else if (serverMetrics.memory.percentage > 80) {
    alerts.push({
      id: `memory-${Date.now()}`,
      timestamp: new Date(),
      severity: 'warning',
      type: 'memory',
      message: 'High memory usage',
      details: `Memory at ${serverMetrics.memory.percentage}% (${serverMetrics.memory.used}/${serverMetrics.memory.total} MB)`,
      recommendations: [
        'Monitor memory usage',
        'Consider upgrading if usage continues to grow'
      ]
    });
  }
  
  // Check slow queries
  const slowQueries = getSlowQueries();
  if (slowQueries.length > 0) {
    alerts.push({
      id: `slow-query-${Date.now()}`,
      timestamp: new Date(),
      severity: 'warning',
      type: 'database',
      message: 'Slow queries detected',
      details: `${slowQueries.length} queries taking >500ms`,
      recommendations: [
        'Add database indexes',
        'Optimize query logic',
        'Consider caching frequently accessed data'
      ]
    });
  }
  
  return alerts;
}

// Helper functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
}

function getAverageQueryTime(): number {
  // Get database-related API metrics
  const dbMetrics = apiMetrics.filter(m => m.path.startsWith('/api/'));
  if (dbMetrics.length === 0) return 0;
  
  const total = dbMetrics.reduce((sum, m) => sum + m.duration, 0);
  return Math.round(total / dbMetrics.length);
}

function getSlowQueries(): Array<{ query: string; time: number; count: number }> {
  // Get slow endpoints (>500ms)
  const slowEndpoints = apiMetrics
    .filter(m => m.duration > 500)
    .reduce((acc, m) => {
      const key = `${m.method}:${m.path}`;
      if (!acc[key]) {
        acc[key] = { query: key, time: m.duration, count: 1 };
      } else {
        acc[key].count++;
        acc[key].time = Math.max(acc[key].time, m.duration);
      }
      return acc;
    }, {} as Record<string, { query: string; time: number; count: number }>);
  
  return Object.values(slowEndpoints).slice(0, 5);
}

// Import eq for database queries
import { eq } from "drizzle-orm";
