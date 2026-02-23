/**
 * Recurring Tasks Handler
 * 
 * This service handles the creation of new instances for recurring tasks.
 * It runs daily to create tasks for users based on their recurrence settings.
 */

import type { IStorage } from "./storage";
import type { Task } from "@shared/schema";
import { sendTaskNotification } from "./task-notifications";

/**
 * Check if a recurring task should be created today
 */
export function shouldCreateTaskToday(task: Task): boolean {
  if (!task.isRecurring || !task.recurrenceType) {
    return false;
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  switch (task.recurrenceType) {
    case "daily":
      return true;

    case "weekdays":
      // Monday (1) to Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case "weekends":
      // Saturday (6) or Sunday (0)
      return dayOfWeek === 0 || dayOfWeek === 6;

    case "weekly":
    case "custom":
      // Check if today is in the recurrenceDays array
      try {
        if (!task.recurrenceDays) {
          console.warn(`Task ${task.id} has no recurrenceDays defined`);
          return false;
        }
        const days = JSON.parse(task.recurrenceDays);
        if (!Array.isArray(days)) {
          console.error(`Task ${task.id} recurrenceDays is not an array:`, task.recurrenceDays);
          return false;
        }
        return days.includes(dayOfWeek);
      } catch (e) {
        console.error(`Error parsing recurrenceDays for task ${task.id}:`, e, "Value:", task.recurrenceDays);
        return false;
      }

    default:
      return false;
  }
}

/**
 * Check if a task instance for today already exists
 */
export async function taskInstanceExistsForToday(
  storage: IStorage,
  recurringGroupId: string,
  userId: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await storage.getTasks(userId);
  
  return tasks.some(task => 
    task.recurringGroupId === recurringGroupId &&
    task.dueDate &&
    new Date(task.dueDate) >= today &&
    new Date(task.dueDate) < tomorrow
  );
}

/**
 * Create a new task instance from a recurring task
 */
export async function createRecurringTaskInstance(
  storage: IStorage,
  parentTask: Task,
  userId: string
): Promise<Task | null> {
  // Check if instance already exists for today
  const groupId = parentTask.recurringGroupId || parentTask.id;
  const exists = await taskInstanceExistsForToday(storage, groupId, userId);
  
  if (exists) {
    console.log(`Task instance already exists for today: ${parentTask.title} (task: ${parentTask.id}, user: ${userId})`);
    return null;
  }

  // Create new task instance for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newTask = await storage.createTask(userId, {
    title: parentTask.title,
    description: parentTask.description,
    priority: parentTask.priority,
    category: parentTask.category,
    dueDate: today,
    dueTime: parentTask.dueTime,
    tags: parentTask.tags,
    completed: false,
    isRecurring: false, // Instance is not recurring itself
    parentTaskId: parentTask.id,
    recurringGroupId: groupId,
  });

  console.log(`Created recurring task instance: ${newTask.title} for ${today.toDateString()} (task: ${newTask.id}, user: ${userId})`);
  
  // Send notification for recurring task creation (non-blocking)
  try {
    const user = await storage.getUser(userId);
    if (user) {
      let prefs = { dueReminderMinutes: 60, overdueEnabled: true, recurringEnabled: true };
      
      if (user.notificationPreferences) {
        try {
          const parsed = JSON.parse(user.notificationPreferences as string);
          if (parsed && typeof parsed === 'object') {
            prefs = { ...prefs, ...parsed };
          } else {
            console.error(`User ${userId} has invalid notificationPreferences (not an object):`, user.notificationPreferences);
          }
        } catch (parseError) {
          console.error(`Failed to parse notificationPreferences for user ${userId}:`, parseError, "Value:", user.notificationPreferences);
        }
      }
      
      if (prefs.recurringEnabled) {
        await sendTaskNotification(user, newTask, 'recurring');
      }
    }
  } catch (error) {
    console.error(`Error sending recurring task notification for user ${userId}, task ${newTask.id}:`, error);
    // Don't throw - notification failure shouldn't fail task creation
  }
  
  return newTask;
}

/**
 * Process all recurring tasks for a user
 */
export async function processUserRecurringTasks(
  storage: IStorage,
  userId: string
): Promise<{ created: number; errors: number }> {
  const tasks = await storage.getTasks(userId);
  
  // Filter to only recurring parent tasks
  const recurringTasks = tasks.filter(task => 
    task.isRecurring && 
    !task.parentTaskId && // Only parent tasks, not instances
    !task.completed
  );

  let createdCount = 0;
  let errorCount = 0;

  for (const task of recurringTasks) {
    try {
      if (shouldCreateTaskToday(task)) {
        const created = await createRecurringTaskInstance(storage, task, userId);
        if (created) {
          createdCount++;
        }
      }
    } catch (error) {
      errorCount++;
      console.error(`Error processing recurring task ${task.id} for user ${userId}:`, error);
      // Continue processing other tasks instead of failing completely
    }
  }

  if (errorCount > 0) {
    console.warn(`Completed processing for user ${userId}: ${createdCount} created, ${errorCount} errors`);
  }

  return { created: createdCount, errors: errorCount };
}

/**
 * Process recurring tasks for all users
 * This should be called once per day (e.g., at midnight)
 */
export async function processAllRecurringTasks(storage: IStorage): Promise<void> {
  const startTime = Date.now();
  console.log("Starting recurring tasks processing...");
  
  // Get all users (in a real implementation, you'd want to paginate this)
  // For now, we'll get tasks and extract unique user IDs
  const allTasks = await storage.getAllTasks?.() || [];
  const userIds = Array.from(new Set(allTasks.map(task => task.userId).filter(Boolean)));

  console.log(`Processing recurring tasks for ${userIds.length} users...`);

  let totalCreated = 0;
  let totalErrors = 0;
  let userErrors = 0;

  for (const userId of userIds) {
    try {
      const result = await processUserRecurringTasks(storage, userId);
      totalCreated += result.created;
      totalErrors += result.errors;
    } catch (error) {
      userErrors++;
      console.error(`Critical error processing user ${userId}:`, error);
      // Continue processing other users
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  if (totalErrors > 0 || userErrors > 0) {
    console.warn(
      `Recurring tasks processing completed with errors in ${duration}s: ` +
      `${totalCreated} tasks created, ${totalErrors} task errors, ${userErrors} user errors`
    );
  } else {
    console.log(
      `Recurring tasks processing completed successfully in ${duration}s: ` +
      `${totalCreated} task instances created for ${userIds.length} users`
    );
  }
}

/**
 * Start the recurring tasks scheduler
 * Runs every day at midnight
 */
export function startRecurringTasksScheduler(storage: IStorage): NodeJS.Timeout {
  // Calculate time until next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  console.log(`Recurring tasks scheduler will start in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);

  // Run at midnight, then every 24 hours
  const initialTimeout = setTimeout(() => {
    processAllRecurringTasks(storage);
    
    // Set up daily interval
    setInterval(() => {
      processAllRecurringTasks(storage);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntilMidnight);

  return initialTimeout;
}
