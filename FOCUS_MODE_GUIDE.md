# 🎯 Focus Mode - Notification Blocking Feature

## Overview

Your app now has a **Focus Mode** feature that blocks distracting notifications during focus sessions, similar to smartphone "Do Not Disturb" modes. Users can customize which types of notifications to block while always allowing important ones like calls and alarms.

## ✨ Features

### 🔕 Smart Notification Blocking
- Block notifications from specific categories (social media, email, messaging, etc.)
- Always allow phone calls (user configurable)
- Always allow alarms and timers (user configurable)
- Always allow priority notifications (user configurable)
- Automatic activation when focus session starts
- Automatic deactivation when session ends

### 🎛️ Customizable Settings
- Choose which notification categories to block
- Toggle individual categories on/off
- Block all or unblock all with one tap
- Settings persist across sessions
- Visual indicators for blocked categories

### 🔔 Notification Categories
1. **Social Media** 💬 - Messages, likes, comments
2. **Email** 📧 - New emails and newsletters
3. **Messaging Apps** 💭 - Chat and instant messages
4. **News & Updates** 📰 - Breaking news and updates
5. **Shopping** 🛍️ - Deals, deliveries, cart reminders
6. **Entertainment** 🎮 - Videos, music, games
7. **Productivity** 💼 - Other work and productivity tools
8. **System Notifications** ⚙️ - Updates and system alerts

## 📁 Files Created

```
client/src/lib/focusMode.ts              - Focus mode manager and logic
client/src/components/FocusModeSettings.tsx - Settings UI component
```

## 📝 Files Modified

```
client/src/pages/Focus.tsx - Integrated focus mode into focus session
```

## 🎯 How It Works

### When Focus Session Starts:
1. User clicks "Start" on focus timer
2. If notification blocking is enabled, Focus Mode activates
3. System shows notification: "Focus Mode Activated"
4. Notifications from blocked categories are silenced
5. Calls and alarms still come through (if enabled)

### During Focus Session:
- Blocked notifications don't disturb the user
- Calls and alarms still work normally
- User sees indicator showing which apps are blocked

### When Focus Session Ends:
1. Timer completes or user pauses
2. Focus Mode deactivates automatically
3. System shows notification: "Focus Mode Ended"
4. All notifications return to normal

## 🚀 Usage

### For Users:

#### Configure Focus Mode:
1. Go to **Focus** page
2. Expand timer settings (if not expanded)
3. Find "Block Notifications" section
4. Click **"Focus Settings"** button
5. Configure your preferences:
   - Toggle "Enable Notification Blocking"
   - Choose which categories to block
   - Configure exceptions (calls, alarms, priority)
6. Close settings (automatically saved)

#### Use Focus Mode:
1. Set your focus timer duration
2. Check that notification blocking is configured
3. Click **Play** to start session
4. Focus Mode activates automatically!
5. Work distraction-free
6. When done, timer ends and notifications restore

### For Developers:

#### Using Focus Mode Programmatically:

```typescript
import { focusModeManager } from '@/lib/focusMode';

// Activate focus mode
await focusModeManager.activate();

// Deactivate focus mode
focusModeManager.deactivate();

// Check if active
const isActive = focusModeManager.isActivated();

// Get current settings
const settings = focusModeManager.getSettings();

// Update settings
focusModeManager.updateSettings({
  blockNotifications: true,
  blockedSources: ['social', 'email'],
  allowCalls: true,
  allowAlarms: true,
});

// Block all sources
focusModeManager.blockAll();

// Unblock all sources
focusModeManager.unblockAll();

// Check if notification should be blocked
const shouldBlock = focusModeManager.shouldBlockNotification(
  'social',  // source
  false,     // isCall
  false,     // isAlarm
  false      // isPriority
);
```

#### Using the React Hook:

```typescript
import { useFocusMode } from '@/lib/focusMode';

function MyComponent() {
  const {
    settings,
    isActive,
    updateSettings,
    toggleSource,
    activate,
    deactivate,
    blockAll,
    unblockAll,
    blockedSummary,
  } = useFocusMode();

  return (
    <div>
      <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
      <p>{blockedSummary}</p>
      <button onClick={() => activate()}>Start Focus</button>
      <button onClick={() => deactivate()}>Stop Focus</button>
    </div>
  );
}
```

#### Using the Settings Component:

```typescript
import { FocusModeSettings } from '@/components/FocusModeSettings';

function MyPage() {
  return (
    <FocusModeSettings 
      onSettingsChange={() => {
        console.log('Settings updated!');
      }}
    />
  );
}
```

## 🧪 Testing Instructions

### Manual Testing:

1. **Test Settings UI:**
   - Go to Focus page
   - Click "Focus Settings" button
   - Toggle "Enable Notification Blocking" → should enable
   - Click on different notification categories → should toggle blocking
   - Click "Block All" → all should be blocked
   - Click "Unblock All" → all should be unblocked
   - Toggle "Phone Calls" → should enable/disable
   - Close dialog → settings should persist

2. **Test Focus Session Integration:**
   - Configure blocking for 2-3 categories
   - Enable "Allow Calls" and "Allow Alarms"
   - Start a focus session
   - Check browser console → should see "Focus Mode Activated"
   - Check notification appears (if permission granted)
   - Pause or let timer finish
   - Check console → should see "Focus Mode Deactivated"

3. **Test Persistence:**
   - Configure settings
   - Refresh page
   - Open settings again → should show saved settings

4. **Test Visual Indicators:**
   - Enable blocking with 3 categories
   - Check "Focus Settings" button → should show badge "3 blocked"
   - Check settings panel → blocked categories show red border
   - Check summary → shows accurate count

### Browser Console Testing:

```javascript
// Check if focus mode manager is available
import { focusModeManager } from '@/lib/focusMode';

// Get current settings
console.log(focusModeManager.getSettings());

// Test activation
await focusModeManager.activate();
console.log('Active:', focusModeManager.isActivated());

// Test blocking logic
console.log('Should block social:', 
  focusModeManager.shouldBlockNotification('social', false, false, false)
);

// Test deactivation
focusModeManager.deactivate();
console.log('Active:', focusModeManager.isActivated());
```

## 🎨 UI Components

### Focus Settings Button
- Shows "Focus Settings" with gear icon
- Badge shows number of blocked categories
- Opens settings dialog on click

### Settings Dialog
- **Master Toggle:** Enable/disable notification blocking
- **Always Allow Section:** Toggle for calls, alarms, priority
- **Block Categories Section:** List of all notification categories
- **Quick Actions:** Block All / Unblock All buttons
- **Summary Card:** Shows what will be blocked

### Visual Indicators
- Blocked categories: Red border + "Blocked" badge
- Allowed categories: Gray border + "Allowed" badge
- Category icons: Emoji for quick recognition
- Badge on main button: Shows count of blocked items

## ⚠️ Important Notes

### Browser Limitations
- This is a **web app**, not native mobile, so:
  - Can only control **web notifications** (from this app and websites)
  - Cannot block **native system notifications** from other apps
  - Cannot block **phone calls** (but can prioritize their notifications)
  
### Best Use Cases
- Block web notifications while using the app
- Manage notification preferences for focus sessions
- Create distraction-free environment for studying/work
- Similar to "Do Not Disturb" but for web notifications

### Notification Permission
- Browser notification permission required for full functionality
- Focus mode will request permission when activated
- User can deny but focus session still works normally

## 🔮 Future Enhancements (Optional)

- [ ] Integration with browser Focus Mode API (when available)
- [ ] Time-based auto-activation (e.g., 9am-5pm)
- [ ] Custom notification categories
- [ ] Notification history/log
- [ ] Sync settings across devices
- [ ] Desktop integration (Electron wrapper)
- [ ] Mobile app version with native blocking

## 💡 Tips for Users

1. **Start Simple:** Block just social media and email first
2. **Always Allow Calls:** Keep important contacts reachable
3. **Test Before Important Work:** Try it out to ensure it works for you
4. **Combine with Tools:** Use with website blockers for maximum focus
5. **Review Regularly:** Adjust blocked categories based on your needs

## 📊 Settings Storage

Settings are stored in **localStorage** with key: `proapp-focus-settings`

Default settings:
```json
{
  "blockNotifications": false,
  "blockedSources": [],
  "allowCalls": true,
  "allowAlarms": true,
  "allowPriority": true
}
```

## 🐛 Troubleshooting

**Settings not saving:**
- Check browser localStorage is enabled
- Check browser console for errors
- Try clearing localStorage and reconfiguring

**Notifications still showing:**
- Remember: Only web notifications are blocked
- Native system notifications cannot be blocked by web apps
- Check browser notification permission

**Focus mode not activating:**
- Check "Enable Notification Blocking" is ON
- Check browser console for errors
- Verify at least one category is blocked

**Badge not updating:**
- Refresh page after changing settings
- Check focusSettings state is updated

---

## 🎉 Enjoy Distraction-Free Focus!

Your users can now customize their focus experience and block distracting notifications while staying connected to important ones like calls and alarms!
