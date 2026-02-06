import { db } from "../db";
import { tasks, users } from "@shared/schema";
import { and, eq, lt, lte, gte, isNull, or } from "drizzle-orm";
import webPush from "web-push";

// Check for tasks that are due soon and send notifications
export async function checkDueSoonTasks() {
  try {
    const now = new Date();
    
    // Get all users with their notification preferences
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      // notificationPreferences field doesn't exist yet - use defaults
      const prefs = { dueReminderMinutes: 60, overdueEnabled: true, recurringEnabled: true };
      
      if (!prefs.dueReminderMinutes) continue;
      
      // Calculate the time window for due soon notifications
      const reminderTime = new Date(now.getTime() + prefs.dueReminderMinutes * 60 * 1000);
      const windowEnd = new Date(reminderTime.getTime() + 5 * 60 * 1000); // 5 min window
      
      // Find tasks that are due within the notification window
      const dueSoonTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, user.id),
            eq(tasks.completed, false),
            gte(tasks.dueDate, reminderTime),
            lt(tasks.dueDate, windowEnd),
            // Skip notification tracking until columns exist
            // or(
            //   isNull(tasks.dueSoonNotificationSent),
            //   eq(tasks.dueSoonNotificationSent, false)
            // )
          )
        );
      
      // Send notifications for each task
      for (const task of dueSoonTasks) {
        await sendTaskNotification(user, task, 'due-soon', prefs.dueReminderMinutes);
        
        // Mark notification as sent - DISABLED until column exists
        // await db
        //   .update(tasks)
        //   .set({ dueSoonNotificationSent: true })
        //   .where(eq(tasks.id, task.id));
      }
    }
  } catch (error) {
    console.error('Error checking due soon tasks:', error);
  }
}

// Check for overdue tasks and send daily reminders
export async function checkOverdueTasks() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get all users with notification preferences
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      // notificationPreferences field doesn't exist yet - use defaults
      const prefs = { dueReminderMinutes: 60, overdueEnabled: true, recurringEnabled: true };
      
      if (!prefs.overdueEnabled) continue;
      
      // Find overdue tasks
      const overdueTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, user.id),
            eq(tasks.completed, false),
            lt(tasks.dueDate, now),
            // Skip notification tracking until columns exist
            // or(
            //   isNull(tasks.lastOverdueNotification),
            //   lt(tasks.lastOverdueNotification, oneDayAgo)
            // )
          )
        );
      
      // Send notifications for each overdue task
      for (const task of overdueTasks) {
        await sendTaskNotification(user, task, 'overdue');
        
        // Update last notification time - DISABLED until column exists
        // await db
        //   .update(tasks)
        //   .set({ lastOverdueNotification: now.toISOString() })
        //   .where(eq(tasks.id, task.id));
      }
    }
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
}

// Send notification for a specific task
async function sendTaskNotification(
  user: any, 
  task: any, 
  type: 'due-soon' | 'overdue' | 'recurring',
  reminderMinutes?: number
) {
  if (!user.pushSubscription) return;
  
  try {
    const subscription = JSON.parse(user.pushSubscription as string);
    
    let title = '';
    let body = '';
    let icon = '';
    
    switch (type) {
      case 'due-soon':
        const timeText = reminderMinutes === 60 ? '1 hour' :
                        reminderMinutes === 30 ? '30 minutes' :
                        reminderMinutes === 15 ? '15 minutes' :
                        reminderMinutes === 1440 ? '1 day' :
                        `${reminderMinutes} minutes`;
        title = '⏰ Task Reminder';
        body = `Due in ${timeText}: ${task.title}`;
        icon = '⏰';
        break;
      
      case 'overdue':
        title = '⚠️ Overdue Task';
        body = `Overdue: ${task.title}`;
        icon = '⚠️';
        break;
      
      case 'recurring':
        title = '🔄 New Task Ready';
        body = `Your recurring task is ready: ${task.title}`;
        icon = '🔄';
        break;
    }
    
    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon,
        badge: '/favicon.png',
        data: {
          url: '/planner',
          taskId: task.id
        }
      })
    );
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    
    // If push subscription is invalid, remove it
    if (error.statusCode === 410) {
      await db
        .update(users)
        .set({ pushSubscription: null })
        .where(eq(users.id, user.id));
    }
  }
}

// Export for use in recurring tasks
export { sendTaskNotification };
