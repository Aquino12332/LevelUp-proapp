# 🔔 Real-Time Push Notifications Setup Guide

## ✅ What Has Been Implemented

Your app now has a **complete real-time push notification system** that works even when the app is closed! Here's what was set up:

### 1. **Web Push Infrastructure** ✅
- Installed `web-push` npm package
- Generated VAPID keys for secure push notifications
- Configured service worker to handle push events

### 2. **Backend Push Service** ✅
- Created `server/push.ts` with full push notification functionality
- Implemented functions to send notifications to users
- Added automatic cleanup of invalid subscriptions
- Integrated with alarm system for real-time alerts

### 3. **Database Schema** ✅
- Added `pushSubscriptions` table to store user device subscriptions
- Supports multiple devices per user
- Stores endpoint and encryption keys

### 4. **API Endpoints** ✅
- `POST /api/push/subscribe` - Register device for notifications
- `POST /api/push/unsubscribe` - Remove device subscription
- `POST /api/push/send` - Send notification to a user
- Alarm triggers automatically send push notifications

### 5. **Client Integration** ✅
- Updated VAPID public key in `client/src/lib/push.ts`
- Service worker automatically registers on app load
- Push subscriptions sent to backend with userId

---

## 🚀 How to Enable Real-Time Notifications

### Step 1: Set Up Environment Variables

Add these to your `.env` file (already added to `.env.example`):

```env
# Push Notifications (Web Push VAPID Keys)
VAPID_PUBLIC_KEY=BMngnidkuzQ0yhhRpL4uEqasMT0AJO0enKGN7TGl2UBFyzr1cLmyaSXBorwVxEhpKih7N7zhQwvA3aVeD6MN9ps
VAPID_PRIVATE_KEY=dVvCOViissFkrNW9uITe6nOu1R1th4Uyq7VXhB4eJFw
VAPID_SUBJECT=mailto:your-email@example.com
```

**⚠️ Important:** Change `VAPID_SUBJECT` to your actual email address.

### Step 2: Set Up Database

If you're using Neon PostgreSQL (or any PostgreSQL database):

1. Make sure your `DATABASE_URL` is set in `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

2. Push the schema to your database:
   ```bash
   npm run db:push
   ```

### Step 3: Grant Notification Permission

When you run the app, the browser will ask for notification permission. Click **Allow** to enable push notifications.

---

## 📱 How It Works

### When App is Open:
1. **Browser Notifications** - Direct notification API shows alerts
2. **Push Notifications** - Web Push sends notifications via service worker

### When App is Closed:
1. **Background Service Worker** - Receives push notifications
2. **System Notifications** - Shows native OS notifications
3. **Click Action** - Opens app to relevant page

### Alarm Flow:
```
Alarm Time Reached
    ↓
Backend triggers: POST /api/alarms/:id/trigger
    ↓
Push notification sent to user's devices
    ↓
Service worker shows notification
    ↓
User clicks → Opens app to /alarm page
```

---

## 🧪 Testing Push Notifications

### Test 1: Browser Notification (App Open)
1. Create an alarm
2. Wait for it to trigger
3. Should see browser notification even if tab is not focused

### Test 2: Push Notification (App Closed)
1. Make sure notifications are enabled
2. Close the browser completely
3. Manually trigger a test notification using the API:

```bash
curl -X POST http://localhost:5000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "title": "Test Notification",
    "body": "This is a test push notification!",
    "icon": "/favicon.png"
  }'
```

### Test 3: Alarm Push Notification
1. Create an alarm for 1 minute from now
2. Close the app
3. Wait for alarm time
4. Should receive push notification even with app closed

---

## 🔧 API Usage

### Send Custom Push Notification

```javascript
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'demo-user',
    title: '🎉 Achievement Unlocked!',
    body: 'You completed 10 focus sessions!',
    icon: '/favicon.png',
    data: {
      type: 'achievement',
      url: '/profile'
    }
  })
});
```

### Use in Your Code

```typescript
import { sendPushToUser } from './server/push';

// Send notification when user completes a task
await sendPushToUser(userId, {
  title: '✅ Task Completed!',
  body: taskTitle,
  icon: '/favicon.png',
  data: { taskId, url: '/planner' }
});
```

---

## 📋 Features

✅ **Real-time notifications** - Instant delivery via Web Push
✅ **Works when app is closed** - Background service worker
✅ **Multi-device support** - Notifications on all user's devices
✅ **Automatic cleanup** - Removes invalid subscriptions
✅ **Click actions** - Opens app to specific page
✅ **Custom icons and badges** - Branded notifications
✅ **Alarm integration** - Auto-sends on alarm trigger
✅ **Secure** - Uses VAPID keys for authentication

---

## 🛠️ Integration Points

### Add Notifications to Other Features:

**Focus Session Complete:**
```typescript
await sendPushToUser(userId, {
  title: '🔥 Focus Session Complete!',
  body: `Great job! You earned ${xp} XP`,
  icon: '/generated_images/3d_fire_flame_icon.png'
});
```

**Friend Request:**
```typescript
await sendPushToUser(receiverId, {
  title: '👥 New Friend Request',
  body: `${senderName} wants to connect!`,
  data: { url: '/social' }
});
```

**Level Up:**
```typescript
await sendPushToUser(userId, {
  title: '⭐ Level Up!',
  body: `You're now level ${newLevel}!`,
  icon: '/generated_images/3d_gold_coin_icon.png'
});
```

---

## 🔐 Security Notes

1. **VAPID Keys** - Keep private key secret, never expose to client
2. **User Permissions** - Always respect browser notification permissions
3. **Rate Limiting** - Consider adding rate limits to prevent spam
4. **User Preferences** - Allow users to control notification settings

---

## 🌐 Browser Support

✅ Chrome/Edge (Desktop & Mobile)
✅ Firefox (Desktop & Mobile)
✅ Safari 16+ (Desktop & Mobile)
✅ Opera
❌ iOS Safari < 16.4 (limited support)

---

## 📝 Next Steps

1. **Add User Preferences** - Let users customize notification types
2. **Notification History** - Store and display past notifications
3. **Rich Notifications** - Add action buttons to notifications
4. **Scheduled Notifications** - Queue notifications for future delivery
5. **Analytics** - Track notification delivery and engagement

---

## 🐛 Troubleshooting

**Problem:** Notifications not showing
- Check browser notification permissions
- Verify VAPID keys are set correctly
- Check browser console for errors
- Ensure DATABASE_URL is configured

**Problem:** Push fails with 401/403
- Regenerate VAPID keys
- Update both client and server keys

**Problem:** Service worker not registering
- Check that `public/sw.js` exists
- Verify HTTPS (required for push notifications)
- Clear browser cache and re-register

---

## 📚 Additional Resources

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push library](https://github.com/web-push-libs/web-push)

---

**🎉 Your app now has enterprise-grade real-time push notifications!**
