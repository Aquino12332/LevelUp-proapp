# Daily/Recurring Tasks Feature Guide

## 🎯 Overview

The Daily Tasks feature allows users to create recurring tasks that automatically generate new instances based on their schedule. Perfect for study routines, daily exercises, or any recurring activities!

---

## ✨ Features

### Recurrence Types
1. **Daily** - Task created every day
2. **Weekdays** - Monday through Friday only
3. **Weekends** - Saturday and Sunday only  
4. **Custom Days** - Select specific days of the week

### Key Capabilities
- ✅ Automatic task generation at midnight
- ✅ Visual indicators for recurring tasks (🔄 icon)
- ✅ Parent task tracking with group IDs
- ✅ Flexible scheduling options
- ✅ Maintains streaks when completed daily

---

## 🏗️ Implementation Details

### Database Schema Changes (`shared/schema.ts`)

Added new fields to the `tasks` table:

```typescript
isRecurring: boolean           // Marks if task is recurring
recurrenceType: varchar        // "daily", "weekdays", "weekends", "custom"
recurrenceDays: text          // JSON array of days [0-6] for custom scheduling
parentTaskId: varchar         // Reference to original recurring task
recurringGroupId: varchar     // Group ID for all instances
```

**Index Added:**
- `tasks_recurringGroup_idx` - Fast lookups by recurring group

### Backend Components

#### 1. **Recurring Tasks Service** (`server/recurring-tasks.ts`)

Main functions:
- `shouldCreateTaskToday(task)` - Checks if task should be created today
- `taskInstanceExistsForToday(...)` - Prevents duplicate creation
- `createRecurringTaskInstance(...)` - Creates daily task instance
- `processUserRecurringTasks(...)` - Processes all recurring tasks for a user
- `processAllRecurringTasks(...)` - Batch processes for all users
- `startRecurringTasksScheduler(...)` - Runs daily at midnight

#### 2. **Storage Updates** (`server/storage.ts`)

Added method:
```typescript
getAllTasks(): Promise<Task[]>  // Get all tasks across users
```

#### 3. **Server Integration** (`server/index.ts`)

The recurring tasks scheduler automatically starts on server launch:

```typescript
startRecurringTasksScheduler(storage);
```

Runs at midnight every day to create new task instances.

### Frontend Components

#### 1. **Task Creation UI** (`client/src/pages/Planner.tsx`)

**New States:**
```typescript
isRecurring: boolean
recurrenceType: "daily" | "weekdays" | "weekends" | "custom"
selectedDays: number[]
```

**UI Features:**
- Toggle button to enable/disable recurring
- Dropdown to select recurrence type
- Day selector for custom schedules (7-day grid)
- Info banner explaining daily tasks
- Visual indicator (Repeat icon) on recurring tasks in list

#### 2. **Task Creation Logic**

When creating a recurring task:
1. Sets `isRecurring = true`
2. Generates unique `recurringGroupId`
3. Configures `recurrenceDays` based on type
4. Creates parent task (not an instance)

---

## 📖 User Guide

### Creating a Recurring Task

1. **Open Planner** → Click "Add Task"
2. **Fill in task details** (title, description, priority, etc.)
3. **Enable Recurring** → Toggle "Make this a recurring task"
4. **Select Schedule:**
   - **Every Day** - Appears daily
   - **Weekdays** - Monday-Friday only
   - **Weekends** - Saturday-Sunday only
   - **Custom Days** - Choose specific days
5. **Click "Create Recurring Task"**

### How It Works

- **Parent Task Created** - Your recurring task template is saved
- **Automatic Generation** - At midnight, new task instances are created for applicable days
- **Complete Daily** - Mark each day's task as complete to maintain streaks
- **Visual Indicator** - Recurring tasks show a 🔄 icon

### Example Use Cases

**📚 Study Routine**
- Task: "Study Math for 30 minutes"
- Schedule: Weekdays
- Result: Task appears Mon-Fri automatically

**💪 Daily Exercise**
- Task: "Morning workout"
- Schedule: Every Day
- Result: Task appears every single day

**📝 Weekend Review**
- Task: "Weekly review and planning"
- Schedule: Weekends
- Result: Task appears Sat-Sun only

**🎯 Custom Schedule**
- Task: "Piano practice"
- Schedule: Mon, Wed, Fri
- Result: Task appears only on selected days

---

## 🔧 Technical Flow

### Daily Task Generation Process

```
1. Scheduler triggers at midnight
   ↓
2. Get all recurring tasks (parent tasks)
   ↓
3. For each recurring task:
   - Check if today matches schedule
   - Check if instance already exists
   - Create new task instance if needed
   ↓
4. New tasks appear in user's Planner
```

### Task Relationships

```
Parent Task (isRecurring=true)
   └─ Instance 1 (parentTaskId set, isRecurring=false)
   └─ Instance 2 (parentTaskId set, isRecurring=false)
   └─ Instance 3 (parentTaskId set, isRecurring=false)
```

All instances share the same `recurringGroupId` for easy tracking.

---

## 🎨 Visual Indicators

- **🔄 Repeat Icon** - Shows next to recurring task titles
- **Blue color** - Recurring icon is blue to distinguish from alarms
- **Dialog Button** - Changes text to "Create Recurring Task" when enabled

---

## 🧪 Testing

### Manual Testing Steps

1. **Create Recurring Task:**
   ```
   Title: "Test Daily Task"
   Schedule: Every Day
   ```

2. **Verify Creation:**
   - Task appears in Planner with 🔄 icon
   - Check `isRecurring = true` in database

3. **Test Scheduler (Manual Trigger):**
   ```typescript
   // In server console or test script
   import { processAllRecurringTasks } from './server/recurring-tasks';
   await processAllRecurringTasks(storage);
   ```

4. **Verify Instance:**
   - New task instance appears
   - Has `parentTaskId` set
   - Has same `recurringGroupId`
   - `isRecurring = false`

5. **Test Different Schedules:**
   - Create weekdays-only task
   - Create custom schedule task
   - Verify correct day filtering

### Automated Testing

Add to your test suite:

```typescript
describe('Recurring Tasks', () => {
  it('should create daily task instance', async () => {
    // Create recurring task
    const task = await createTask({
      title: 'Test',
      isRecurring: true,
      recurrenceType: 'daily',
      recurringGroupId: 'test-group'
    });
    
    // Run scheduler
    await processUserRecurringTasks(storage, userId);
    
    // Verify instance created
    const tasks = await getTasks(userId);
    const instance = tasks.find(t => t.recurringGroupId === 'test-group' && t.parentTaskId === task.id);
    expect(instance).toBeDefined();
  });
});
```

---

## 📊 Database Impact

### Storage Estimates (per user)

| Item | Count | Size per | Total |
|------|-------|----------|-------|
| Recurring tasks (parent) | ~10 | 500 bytes | 5 KB |
| Daily instances | ~200 | 500 bytes | 100 KB |
| **Total** | | | **~105 KB** |

**Note:** Old completed tasks are auto-deleted after 90 days (see `DATABASE_LIMITS.md`)

### Performance Considerations

- **Midnight Spike:** All task instances created at once
- **Indexing:** `recurringGroupId` indexed for fast lookups
- **Batch Processing:** Processes users sequentially to avoid overload

---

## 🚀 Production Deployment

### Checklist

- [x] Database schema updated with new fields
- [x] Migrations run: `npm run db:push`
- [x] Recurring tasks scheduler started on server
- [x] UI updated with recurring controls
- [x] Visual indicators added
- [x] User guide created

### Monitoring

Check server logs for:
```
Recurring tasks scheduler started
Starting recurring tasks processing...
Created recurring task instance: [task title] for [date]
Recurring tasks processing complete. Created X task instances.
```

### Troubleshooting

**Problem:** Tasks not appearing
- Check server logs for errors
- Verify scheduler is running
- Manually trigger: `processUserRecurringTasks(storage, userId)`

**Problem:** Duplicate tasks
- Check `taskInstanceExistsForToday` logic
- Verify date comparison is working correctly

**Problem:** Wrong days
- Check `recurrenceDays` JSON parsing
- Verify day-of-week calculation (0=Sunday)

---

## 🔮 Future Enhancements

Potential additions:
- [ ] Edit recurring task settings
- [ ] Skip specific dates
- [ ] End date for recurring tasks
- [ ] Recurring task templates
- [ ] Batch delete all instances
- [ ] Analytics on recurring task completion rates

---

## 📝 Code Examples

### Creating a Recurring Task (Frontend)

```typescript
createTask({
  title: "Daily Standup",
  description: "Team sync meeting",
  priority: "high",
  category: "work",
  isRecurring: true,
  recurrenceType: "weekdays",
  recurrenceDays: JSON.stringify([1, 2, 3, 4, 5]), // Mon-Fri
  recurringGroupId: crypto.randomUUID()
});
```

### Checking if Task Should Recur (Backend)

```typescript
function shouldCreateTaskToday(task: Task): boolean {
  if (!task.isRecurring) return false;
  
  const dayOfWeek = new Date().getDay();
  
  if (task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (task.recurrenceType === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
  
  const days = JSON.parse(task.recurrenceDays || "[]");
  return days.includes(dayOfWeek);
}
```

---

## ✅ Summary

The Daily Tasks feature is now **fully implemented** and ready for use!

**What Users Get:**
- ✅ Automatic daily task creation
- ✅ Flexible scheduling (daily, weekdays, weekends, custom)
- ✅ Visual indicators for recurring tasks
- ✅ Streak maintenance through daily completion
- ✅ No manual task recreation needed

**Technical Implementation:**
- ✅ Database schema extended
- ✅ Backend scheduler running at midnight
- ✅ Frontend UI with full controls
- ✅ Proper indexing for performance
- ✅ Auto-cleanup to manage storage

🎉 **Ready to help users build consistent study habits!**
