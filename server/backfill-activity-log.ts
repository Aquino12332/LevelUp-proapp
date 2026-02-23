import { db } from "../db";
import { users, tasks, focusSessions, notes, activityLog } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Backfill activity log from existing database tables
 * This reconstructs historical activity data from:
 * - User registrations
 * - Task creations and completions
 * - Focus sessions
 * - Note creations
 */
async function backfillActivityLog() {
  console.log("🔄 Starting activity log backfill...");
  
  try {
    // Clear existing activity log to avoid duplicates
    console.log("Clearing existing activity log...");
    await db.delete(activityLog);
    
    let totalActivities = 0;

    // 1. Backfill user registrations
    console.log("\n📝 Backfilling user registrations...");
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt
    }).from(users);
    
    for (const user of allUsers) {
      if (user.createdAt) {
        await db.insert(activityLog).values({
          userId: user.id,
          action: 'user_registered',
          timestamp: user.createdAt,
          metadata: JSON.stringify({ username: user.username })
        });
        totalActivities++;
      }
    }
    console.log(`✅ Added ${allUsers.length} user registration activities`);

    // 2. Backfill task creations and completions
    console.log("\n📝 Backfilling task activities...");
    const allTasks = await db.select({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      completed: tasks.completed,
      createdAt: tasks.createdAt
    }).from(tasks);
    
    let taskActivities = 0;
    for (const task of allTasks) {
      // Task creation
      if (task.createdAt) {
        await db.insert(activityLog).values({
          userId: task.userId,
          action: 'task_created',
          timestamp: task.createdAt,
          metadata: JSON.stringify({ 
            taskId: task.id,
            taskTitle: task.title 
          })
        });
        taskActivities++;
        
        // Task completion (if completed, estimate completion time as 1 hour after creation)
        if (task.completed) {
          const completionTime = new Date(task.createdAt);
          completionTime.setHours(completionTime.getHours() + 1);
          
          await db.insert(activityLog).values({
            userId: task.userId,
            action: 'task_completed',
            timestamp: completionTime,
            metadata: JSON.stringify({ 
              taskId: task.id,
              taskTitle: task.title 
            })
          });
          taskActivities++;
        }
      }
    }
    totalActivities += taskActivities;
    console.log(`✅ Added ${taskActivities} task activities`);

    // 3. Backfill focus sessions
    console.log("\n📝 Backfilling focus session activities...");
    const allSessions = await db.select({
      id: focusSessions.id,
      userId: focusSessions.userId,
      duration: focusSessions.duration,
      startedAt: focusSessions.startedAt,
      completedAt: focusSessions.completedAt
    }).from(focusSessions);
    
    let sessionActivities = 0;
    for (const session of allSessions) {
      // Session started
      if (session.startedAt) {
        await db.insert(activityLog).values({
          userId: session.userId,
          action: 'focus_session_started',
          timestamp: session.startedAt,
          metadata: JSON.stringify({ 
            sessionId: session.id,
            duration: session.duration 
          })
        });
        sessionActivities++;
        
        // Session completed
        if (session.completedAt) {
          await db.insert(activityLog).values({
            userId: session.userId,
            action: 'focus_session_completed',
            timestamp: session.completedAt,
            metadata: JSON.stringify({ 
              sessionId: session.id,
              duration: session.duration 
            })
          });
          sessionActivities++;
        }
      }
    }
    totalActivities += sessionActivities;
    console.log(`✅ Added ${sessionActivities} focus session activities`);

    // 4. Backfill note creations
    console.log("\n📝 Backfilling note activities...");
    const allNotes = await db.select({
      id: notes.id,
      userId: notes.userId,
      title: notes.title,
      createdAt: notes.createdAt
    }).from(notes);
    
    let noteActivities = 0;
    for (const note of allNotes) {
      if (note.createdAt) {
        await db.insert(activityLog).values({
          userId: note.userId,
          action: 'note_created',
          timestamp: note.createdAt,
          metadata: JSON.stringify({ 
            noteId: note.id,
            noteTitle: note.title 
          })
        });
        noteActivities++;
      }
    }
    totalActivities += noteActivities;
    console.log(`✅ Added ${noteActivities} note activities`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Backfill complete!`);
    console.log(`📊 Total activities created: ${totalActivities}`);
    console.log("=".repeat(50));
    
    // Show sample of what was created
    const sampleActivities = await db.select()
      .from(activityLog)
      .limit(10)
      .orderBy(sql`${activityLog.timestamp} DESC`);
    
    console.log("\n📋 Sample of recent activities:");
    sampleActivities.forEach(activity => {
      console.log(`  - ${activity.action} at ${activity.timestamp} (User: ${activity.userId})`);
    });

  } catch (error) {
    console.error("❌ Error during backfill:", error);
    throw error;
  }
}

// Run the backfill
backfillActivityLog()
  .then(() => {
    console.log("\n✅ Backfill script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Backfill script failed:", error);
    process.exit(1);
  });
