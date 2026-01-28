import { db } from '../db';
import { alarms } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendPushToUser } from './push';

/**
 * Check if an alarm should trigger based on current time
 */
function shouldAlarmTrigger(alarm: any): boolean {
  if (!alarm.enabled) return false;
  
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Check if time matches (within current minute)
  if (currentHours !== hours || currentMinutes !== minutes) {
    return false;
  }
  
  // Check if already triggered in the last 2 minutes (prevent duplicates)
  if (alarm.lastTriggered) {
    const lastTriggered = new Date(alarm.lastTriggered);
    const timeSinceLastTrigger = now.getTime() - lastTriggered.getTime();
    const twoMinutesInMs = 2 * 60 * 1000;
    
    if (timeSinceLastTrigger < twoMinutesInMs) {
      return false; // Already triggered recently
    }
  }
  
  // If no repeat days, it's a one-time alarm
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    return true; // Trigger once
  }
  
  // Check if today is in the repeat days
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  
  return alarm.repeatDays.includes(currentDay);
}

/**
 * Process a triggered alarm
 */
async function processTriggeredAlarm(alarm: any): Promise<void> {
  try {
    console.log(`Processing alarm: ${alarm.id} - ${alarm.label || 'Alarm'}`);
    
    // Update lastTriggered timestamp
    await db
      .update(alarms)
      .set({ lastTriggered: new Date() })
      .where(eq(alarms.id, alarm.id));
    
    // Send push notification
    await sendPushToUser(alarm.userId, {
      title: "⏰ Alarm Ringing!",
      body: alarm.label || "Time's up!",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: `alarm-${alarm.id}`,
      requireInteraction: true,
      data: {
        alarmId: alarm.id,
        type: "alarm",
        url: "/alarm",
        time: alarm.time,
        sound: alarm.sound,
        label: alarm.label
      }
    });
    
    // If it's a one-time alarm (no repeat days), disable it after triggering
    if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
      await db
        .update(alarms)
        .set({ enabled: false })
        .where(eq(alarms.id, alarm.id));
      
      console.log(`One-time alarm ${alarm.id} disabled after triggering`);
    }
    
    console.log(`Successfully processed alarm ${alarm.id}`);
  } catch (error) {
    console.error(`Error processing alarm ${alarm.id}:`, error);
  }
}

/**
 * Check all alarms and trigger any that should fire
 * @param retryCount - Internal retry counter for exponential backoff
 */
export async function checkAlarms(retryCount: number = 0): Promise<void> {
  try {
    console.log(`🔔 Checking alarms... (attempt ${retryCount + 1})`);
    
    // Get all enabled alarms
    const enabledAlarms = await db
      .select()
      .from(alarms)
      .where(eq(alarms.enabled, true));
    
    if (enabledAlarms.length === 0) {
      console.log('✓ No enabled alarms to check');
      return;
    }
    
    console.log(`✓ Found ${enabledAlarms.length} enabled alarm(s)`);
    
    // Check each alarm
    for (const alarm of enabledAlarms) {
      if (shouldAlarmTrigger(alarm)) {
        console.log(`Alarm should trigger: ${alarm.id} at ${alarm.time}`);
        await processTriggeredAlarm(alarm);
      }
    }
  } catch (error: any) {
    // Check if it's a connection error (database might be waking up)
    const isConnectionError = error && (
      error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('Connection terminated') ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout') ||
      error.message?.includes('ETIMEDOUT')
    );
    
    if (isConnectionError && retryCount < 5) {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const retryDelay = Math.pow(2, retryCount + 1) * 1000;
      console.log(`⚠️ Database waking up... Retrying in ${retryDelay / 1000}s (attempt ${retryCount + 1}/5)`);
      console.log(`   Error: ${error.message || error.code || 'Unknown error'}`);
      
      setTimeout(() => {
        checkAlarms(retryCount + 1);
      }, retryDelay);
    } else if (isConnectionError) {
      console.log('⚠️ Database connection issue. Will retry on next scheduled check.');
      console.log(`   Error: ${error.message || error.code || 'Unknown error'}`);
    } else {
      console.error('Error checking alarms:', error);
    }
  }
}

/**
 * Start the alarm checker service (runs every 30 seconds for better accuracy)
 */
export function startAlarmChecker(): NodeJS.Timeout {
  console.log('🔔 Alarm checker service started - checking every 30 seconds');
  
  // Add a 3-second delay before first check to allow database pool to initialize
  setTimeout(() => {
    console.log('🔔 Running initial alarm check...');
    checkAlarms();
  }, 3000);
  
  // Then run every 30 seconds for better accuracy
  const interval = setInterval(() => {
    checkAlarms();
  }, 30 * 1000); // 30 seconds
  
  return interval;
}

/**
 * Stop the alarm checker service
 */
export function stopAlarmChecker(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log('🔕 Alarm checker service stopped');
}

/**
 * Test alarm trigger (manual trigger for testing)
 */
export async function testAlarmTrigger(alarmId: string): Promise<void> {
  try {
    const alarm = await db
      .select()
      .from(alarms)
      .where(eq(alarms.id, alarmId))
      .limit(1);
    
    if (!alarm || alarm.length === 0) {
      throw new Error('Alarm not found');
    }
    
    await processTriggeredAlarm(alarm[0]);
  } catch (error) {
    console.error('Error testing alarm:', error);
    throw error;
  }
}
