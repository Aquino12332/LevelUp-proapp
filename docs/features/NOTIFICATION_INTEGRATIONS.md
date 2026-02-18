# 🔔 Notification Integrations Guide

## Overview

Your app now has **real-time push notifications** integrated across all major features! Users will receive instant notifications even when the app is closed.

---

## 📱 Notification Types

### 1. ⏰ Alarm Notifications
**Trigger:** When an alarm time is reached
**Route:** `POST /api/alarms/:id/trigger`

```javascript
{
  title: "⏰ Alarm Ringing!",
  body: "Wake up! Time to study",
  icon: "/favicon.png",
  url: "/alarm"
}
```

**Features:**
- Shows alarm label as notification body
- Clicking opens the alarm page
- Works even when app is completely closed
- Persistent notification until dismissed

---

### 2. 🔥 Focus Session Completion
**Trigger:** When a focus session is marked complete
**Route:** `PATCH /api/focus-sessions/:id`

```javascript
{
  title: "🔥 Focus Session Complete!",
  body: "Great job! You earned 50 XP and 10 coins for 25 minutes of focus time.",
  icon: "/generated_images/3d_fire_flame_icon.png",
  url: "/focus"
}
```

**Features:**
- Shows XP and coins earned
- Displays focus duration
- Motivational message
- Opens focus page on click

---

### 3. ⭐ Level Up Notifications
**Trigger:** When user's level increases
**Route:** `PATCH /api/user-stats/:userId`

```javascript
{
  title: "⭐ Level Up!",
  body: "Congratulations! You've reached level 5! Keep up the great work!",
  icon: "/generated_images/3d_gold_coin_icon.png",
  url: "/profile"
}
```

**Features:**
- Celebrates achievement
- Shows new level number
- Opens profile page to view stats
- Encourages continued progress

---

### 4. 🔥 Streak Milestones
**Trigger:** Every 5 days of streak maintenance
**Route:** `PATCH /api/user-stats/:userId`

```javascript
{
  title: "🔥 Streak Milestone!",
  body: "Amazing! You've maintained a 15-day streak! Keep it going!",
  icon: "/generated_images/3d_fire_flame_icon.png",
  url: "/profile"
}
```

**Features:**
- Milestone notifications at 5, 10, 15, 20, etc. days
- Motivational encouragement
- Fire icon to represent the streak
- Opens profile to view streak stats

---

### 5. ✅ Task Completion
**Trigger:** When a task is marked as completed
**Route:** `PATCH /api/tasks/:id`

```javascript
{
  title: "✅ Task Completed!",
  body: "Finish math homework",
  icon: "/favicon.png",
  url: "/planner"
}
```

**Features:**
- Different emojis based on priority:
  - High: 🎯
  - Medium: ✅
  - Low: ☑️
- Shows task title
- Opens planner page

---

### 6. 👥 Friend Request Received
**Trigger:** When someone sends a friend request
**Route:** `POST /api/friends/request`

```javascript
{
  title: "👥 New Friend Request",
  body: "Alice wants to connect with you!",
  icon: "/generated_images/3d_student_avatar.png",
  url: "/social"
}
```

**Features:**
- Shows sender's username
- Displays sender's avatar if available
- Opens social page to accept/reject
- Immediate notification delivery

---

### 7. ✅ Friend Request Accepted
**Trigger:** When someone accepts your friend request
**Route:** `POST /api/friends/request/:id/accept`

```javascript
{
  title: "✅ Friend Request Accepted!",
  body: "Bob accepted your friend request!",
  icon: "/generated_images/3d_student_avatar.png",
  url: "/social"
}
```

**Features:**
- Notifies original sender
- Shows who accepted the request
- Opens social page to view new friend
- Displays accepter's avatar

---

## 🎨 Notification Icons

All notifications use custom icons for better visual appeal:

- **Alarms:** `/favicon.png`
- **Focus Sessions:** `/generated_images/3d_fire_flame_icon.png`
- **Level Up:** `/generated_images/3d_gold_coin_icon.png`
- **Streaks:** `/generated_images/3d_fire_flame_icon.png`
- **Tasks:** `/favicon.png`
- **Friends:** User avatar or `/generated_images/3d_student_avatar.png`

---

## 🔧 Technical Implementation

### Backend Integration

All notifications follow this pattern:

```typescript
try {
  await sendPushToUser(userId, {
    title: "Notification Title",
    body: "Notification body text",
    icon: "/path/to/icon.png",
    badge: "/favicon.png",
    tag: "unique-tag",
    data: {
      type: "notification-type",
      url: "/target-page",
      // additional metadata
    }
  });
} catch (pushError) {
  console.error("Failed to send notification:", pushError);
  // Don't fail the main request
}
```

### Key Features:
- **Non-blocking:** Push failures don't affect main functionality
- **Tagged:** Notifications can replace previous ones with same tag
- **Clickable:** All notifications navigate to relevant pages
- **Data payload:** Custom metadata for client-side handling

---

## 📊 Notification Flow

```
User Action
    ↓
Backend API Endpoint
    ↓
Business Logic (update DB, etc.)
    ↓
Send Push Notification
    ↓
Service Worker receives push
    ↓
Shows system notification
    ↓
User clicks notification
    ↓
Opens app to specific page
```

---

## 🎯 Use Cases

### Study Session Flow
1. User starts focus session
2. Completes 25 minutes
3. **Notification:** "🔥 Focus Session Complete! Earned 50 XP"
4. XP triggers level up
5. **Notification:** "⭐ Level Up! You've reached level 5!"
6. User maintains streak
7. **Notification:** "🔥 Streak Milestone! 15-day streak!"

### Social Interaction Flow
1. Alice sends friend request to Bob
2. **Bob receives:** "👥 New Friend Request from Alice"
3. Bob accepts request
4. **Alice receives:** "✅ Friend Request Accepted by Bob!"

### Task Management Flow
1. User creates high-priority task
2. User completes task
3. **Notification:** "🎯 Task Completed! Finish math homework"
4. Task completion adds XP
5. May trigger level up notification

---

## 🔒 Privacy & Permissions

- Users must grant notification permission in browser
- Notifications only sent to subscribed devices
- No sensitive data in notification bodies
- All notifications respect user's system settings
- Users can disable notifications in browser settings

---

## 📈 Analytics & Tracking

Each notification includes metadata for tracking:

```javascript
data: {
  type: "notification-type",
  [entity]Id: "unique-id",
  url: "/target-page",
  // type-specific metadata
}
```

This allows for:
- Click-through rate tracking
- User engagement analysis
- Feature usage insights
- A/B testing notification content

---

## 🚀 Future Enhancements

Potential notification additions:

1. **Achievement Unlocked** - Special accomplishments
2. **Daily Goals Reminder** - Morning motivation
3. **Study Reminder** - Based on schedule
4. **Leaderboard Updates** - Friend surpassed your score
5. **Shop Sales** - New items or discounts
6. **Challenge Invites** - Friends challenge you
7. **Inactivity Reminder** - "We miss you!" after 3 days
8. **Weekly Summary** - Stats digest notification

---

## 🧪 Testing Notifications

### Test Individual Features:

**Test Alarm:**
```bash
curl -X POST http://localhost:5000/api/alarms/:id/trigger
```

**Test Custom Notification:**
```bash
curl -X POST http://localhost:5000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "title": "Test Notification",
    "body": "Testing the notification system!",
    "icon": "/favicon.png"
  }'
```

**Test Focus Complete:**
1. Start a focus session
2. Mark it as completed with XP/coins
3. Should receive completion notification

**Test Level Up:**
1. Update user stats with increased level
2. Should receive level up notification

**Test Friend Request:**
1. Send friend request to another user
2. Receiver gets notification
3. Accept request
4. Sender gets acceptance notification

---

## 📝 Notification Best Practices

### DO:
✅ Keep titles short and clear (< 50 characters)
✅ Include specific details in body (earned XP, sender name, etc.)
✅ Use relevant emojis for visual appeal
✅ Provide clear call-to-action
✅ Handle notification failures gracefully
✅ Use appropriate icons for each type

### DON'T:
❌ Send too many notifications (notification fatigue)
❌ Include sensitive personal information
❌ Send notifications for minor events
❌ Use generic titles like "Update" or "Notification"
❌ Fail main operations if push fails
❌ Spam users with duplicate notifications

---

## 🎨 Customization

### Change Notification Text:

Edit in `server/routes.ts`:

```typescript
await sendPushToUser(userId, {
  title: "Your Custom Title",
  body: "Your custom message with ${variables}",
  icon: "/your/icon/path.png"
});
```

### Add New Notification Type:

1. Identify the trigger point (API endpoint)
2. Get user ID
3. Call `sendPushToUser()` with payload
4. Add error handling
5. Test thoroughly

### Example - New Note Created:

```typescript
app.post("/api/notes", async (req, res) => {
  // ... create note logic
  
  await sendPushToUser(userId, {
    title: "📝 Note Saved!",
    body: note.title,
    icon: "/favicon.png",
    data: { type: "note-created", noteId: note.id, url: "/notes" }
  });
});
```

---

## 🎉 Summary

Your app now has **7 types of real-time notifications** covering:
- ⏰ Alarms
- 🔥 Focus sessions
- ⭐ Level ups
- 🔥 Streak milestones
- ✅ Task completions
- 👥 Friend requests
- ✅ Friend acceptances

All notifications work even when the app is closed, provide contextual information, and navigate users to relevant pages. The system is robust, scalable, and ready for production!

**Next Steps:**
1. Set up your `.env` with VAPID keys
2. Run database migrations
3. Test each notification type
4. Monitor user engagement
5. Add more notification types as needed

Happy coding! 🚀
