/**
 * Recurring Tasks Handler
 * 
 * This service handles the creation of new instances for recurring tasks.
 * It runs daily to create tasks for users based on their recurrence settings.
 */

import type { IStorage } from "./storage";
import type { Task } from "@shared/schema";

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
        const days = JSON.parse(task.recurrenceDays || "[]");
        return Array.isArray(days) && days.includes(dayOfWeek);
      } catch (e) {
        console.error("Error parsing recurrenceDays:", e);
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
  try {
    // Check if instance already exists for today
    const groupId = parentTask.recurringGroupId || parentTask.id;
    const exists = await taskInstanceExistsForToday(storage, groupId, userId);
    
    if (exists) {
      console.log(`Task instance already exists for today: ${parentTask.title}`);
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

    console.log(`Created recurring task instance: ${newTask.title} for ${today.toDateString()}`);
    return newTask;
  } catch (error) {
    console.error("Error creating recurring task instance:", error);
    return null;
  }
}

/**
 * Process all recurring tasks for a user
 */
export async function processUserRecurringTasks(
  storage: IStorage,
  userId: string
): Promise<number> {
  try {
    const tasks = await storage.getTasks(userId);
    
    // Filter to only recurring parent tasks
    const recurringTasks = tasks.filter(task => 
      task.isRecurring && 
      !task.parentTaskId && // Only parent tasks, not instances
      !task.completed
    );

    let createdCount = 0;

    for (const task of recurringTasks) {
      if (shouldCreateTaskToday(task)) {
        const created = await createRecurringTaskInstance(storage, task, userId);
        if (created) {
          createdCount++;
        }
      }
    }

    return createdCount;
  } catch (error) {
    console.error(`Error processing recurring tasks for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Process recurring tasks for all users
 * This should be called once per day (e.g., at midnight)
 */
export async function processAllRecurringTasks(storage: IStorage): Promise<void> {
  console.log("Starting recurring tasks processing...");
  
  try {
    // Get all users (in a real implementation, you'd want to paginate this)
    // For now, we'll get tasks and extract unique user IDs
    const allTasks = await storage.getAllTasks?.() || [];
    const userIds = [...new Set(allTasks.map(task => task.userId))];

    let totalCreated = 0;

    for (const userId of userIds) {
      const created = await processUserRecurringTasks(storage, userId);
      totalCreated += created;
    }

    console.log(`Recurring tasks processing complete. Created ${totalCreated} task instances.`);
  } catch (error) {
    console.error("Error in recurring tasks processing:", error);
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
