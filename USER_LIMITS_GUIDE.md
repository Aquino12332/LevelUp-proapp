# 📊 LevelUp App - Feature Limits Per User

This guide explains the limits for each feature to ensure fair usage and optimal performance for all users.

---

## 🎯 Per-User Feature Limits

### ✅ Tasks
- **Maximum tasks per user:** 100 tasks
- **Task title:** 200 characters max
- **Task description:** 2,000 characters max
- **Auto-cleanup:** Completed tasks deleted after 90 days
- **Storage per user:** ~50 KB (at max capacity)

**Why this limit?**
- 100 active tasks is plenty for productivity
- Old completed tasks are auto-archived
- Keeps your task list manageable

---

### 📝 Notes
- **Maximum notes per user:** 50 notes
- **Note title:** 200 characters max
- **Note content:** 50,000 characters max (~50 KB per note)
- **Storage per user:** ~500 KB (at max capacity)

**Why this limit?**
- 50 notes is generous for a productivity app
- Each note can hold ~35 pages of text
- Prevents database bloat

---

### ⏰ Alarms
- **Maximum alarms per user:** 20 alarms
- **Alarm label:** 100 characters max
- **Custom sounds:** 1 per alarm (auto-compressed to ~1.5MB)
- **Storage per user:** ~10 KB + custom sounds

**Why this limit?**
- 20 alarms covers every use case (morning, work, breaks, evening, etc.)
- Prevents alarm spam
- Custom sounds are optimized to save storage

---

### 🧠 Focus Sessions
- **Maximum sessions per user:** 200 sessions
- **Auto-cleanup:** Sessions older than 180 days (6 months) are deleted
- **Storage per user:** ~100 KB (at max capacity)

**Why this limit?**
- 200 sessions = 6+ months of daily focus tracking
- Old sessions are archived for statistics
- Keeps recent history accessible

---

### 👥 Friends & Social
- **Maximum friends per user:** 50 friends
- **Pending friend requests:** 20 max
- **Auto-cleanup:** Rejected requests deleted after 30 days
- **Storage per user:** ~5 KB

**Why this limit?**
- 50 friends is sufficient for meaningful connections
- Prevents friend spam
- Quality over quantity

---

### 🏪 Shop & Inventory
- **Maximum inventory items per user:** 100 items
- **Total shop items (global):** 200 items
- **Storage per user:** ~10 KB

**Why this limit?**
- 100 items is plenty for power-ups and customization
- Shop items are shared across all users
- Prevents inventory hoarding

---

### 🔔 Push Notifications
- **Maximum devices per user:** 5 devices
- **Storage per user:** ~5 KB

**Why this limit?**
- 5 devices covers phone, tablet, laptop, work computer, etc.
- Prevents notification subscription bloat
- Most users have 1-3 devices

---

## 📏 Content Size Limits

### Text Limits
| Field | Maximum Length |
|-------|----------------|
| Username | 30 characters |
| Name | 50 characters |
| Task title | 200 characters |
| Task description | 2,000 characters |
| Note title | 200 characters |
| Note content | 50,000 characters |
| Alarm label | 100 characters |
| Tag | 50 characters |

### File Limits
| Type | Maximum Size | Notes |
|------|-------------|-------|
| Custom alarm sound | 5MB (before compression) | Auto-compressed to ~1-1.5MB |
| Avatar image | Coming soon | Not yet implemented |

---

## 🗄️ Storage Breakdown Per User

### At Maximum Capacity:

| Feature | Storage Used | % of User Quota |
|---------|--------------|-----------------|
| **Tasks** (100) | 50 KB | 2% |
| **Notes** (50) | 500 KB | 20% |
| **Alarms** (20) | 10 KB | 0.4% |
| **Focus Sessions** (200) | 100 KB | 4% |
| **Friends** (50) | 5 KB | 0.2% |
| **Inventory** (100) | 10 KB | 0.4% |
| **Push Subscriptions** (5) | 5 KB | 0.2% |
| **Base User Data** | 5 KB | 0.2% |
| **Custom Sounds** (5 alarms) | 7.5 MB | 300% |
| **TOTAL (no custom sounds)** | **~685 KB** | **~27%** |
| **TOTAL (with custom sounds)** | **~8 MB** | **~320%** |

### Realistic Usage (Average User):

| Feature | Typical Usage | Storage Used |
|---------|--------------|--------------|
| **Tasks** (30 active) | 30% of limit | 15 KB |
| **Notes** (10) | 20% of limit | 100 KB |
| **Alarms** (5) | 25% of limit | 2.5 KB |
| **Focus Sessions** (50) | 25% of limit | 25 KB |
| **Friends** (10) | 20% of limit | 1 KB |
| **Inventory** (20) | 20% of limit | 2 KB |
| **Push Subscriptions** (2) | 40% of limit | 2 KB |
| **Custom Sounds** (1-2) | | 1.5-3 MB |
| **TOTAL** | | **~150 KB - 3 MB** |

---

## 🎯 Capacity for 200 Users

### Conservative Estimate (Most users at 50% capacity):
```
200 users × ~2 MB average = 400 MB
✅ Within 500MB free tier limit (80% used)
```

### Worst Case (All users maxed out, no custom sounds):
```
200 users × 685 KB = 137 MB
✅ Within 500MB free tier limit (27% used)
```

### Mixed Case (50 users with custom sounds, 150 without):
```
50 users × 8 MB = 400 MB
150 users × 685 KB = 103 MB
Total: 503 MB
⚠️ Slightly over free tier (upgrade needed)
```

---

## 🚦 What Happens When Limits Are Reached?

### User Experience:
1. **Friendly warning:** Users see a clear message explaining the limit
2. **Suggested action:** Delete old items to make room
3. **No data loss:** Existing data is preserved
4. **No app crash:** App continues to work normally

### Example Messages:
- ❌ "You've reached the maximum of 100 tasks. Please complete or delete some tasks to add more."
- ❌ "You've reached the maximum of 50 notes. Please delete some notes to add more."
- ❌ "You've reached the maximum of 20 alarms. Please delete some alarms to add more."

---

## 🔧 Automatic Cleanup (Data Retention)

To prevent unlimited database growth, old data is automatically cleaned up:

| Data Type | Retention Period | Action |
|-----------|------------------|--------|
| Completed tasks | 90 days | Auto-deleted |
| Focus sessions | 180 days (6 months) | Auto-deleted |
| Rejected friend requests | 30 days | Auto-deleted |
| Active alarms | Indefinite | Kept until user deletes |
| Notes | Indefinite | Kept until user deletes |
| User accounts | Indefinite | Kept (never auto-deleted) |

**Note:** Statistics and achievements are preserved even after cleanup!

---

## 💡 Tips to Stay Within Limits

### 1. **Regular Cleanup**
- Delete completed tasks monthly
- Archive old notes you don't need
- Remove unused alarms

### 2. **Use Built-in Sounds**
- Built-in alarm sounds use NO storage
- Custom sounds use 1-1.5 MB each
- Only upload custom sounds if really needed

### 3. **Focus on Quality**
- Keep task descriptions concise
- One note per topic (don't duplicate)
- Merge similar alarms

### 4. **Let Auto-Cleanup Work**
- System automatically removes old completed tasks
- Old focus sessions are archived
- Don't worry about manual cleanup too much!

---

## 🆙 What If I Need More?

### Option 1: Optimize Usage (Free)
- Delete unused content
- Use built-in sounds instead of custom
- Complete and archive old tasks

### Option 2: Upgrade Database ($19/month)
When you upgrade to Neon's Launch plan:
- **Storage:** 0.5GB → 10GB (20x increase!)
- **New limits could be:**
  - Tasks: 100 → 500 per user
  - Notes: 50 → 200 per user
  - Alarms: 20 → 50 per user
  - Custom sounds: Unlimited

### Option 3: Premium Features (Future)
Potential paid tier benefits:
- Higher limits across all features
- Unlimited custom sounds
- Priority support
- Advanced analytics
- Team/family sharing

---

## 📊 Monitoring Your Usage

### Check Your Current Usage:
1. Go to **Profile** page
2. View **Storage Info** widget
3. See usage for each feature
4. Get warnings at 80% capacity

### Example Display:
```
📊 Your Usage:
Tasks: 45/100 (45%) ✅
Notes: 12/50 (24%) ✅
Alarms: 8/20 (40%) ✅
Friends: 15/50 (30%) ✅
Storage: 150 KB / 2.5 MB (6%) ✅
```

---

## 🎉 Summary

### Free Tier Limits (Per User):
- ✅ **100 tasks** (generous for productivity)
- ✅ **50 notes** (enough for most users)
- ✅ **20 alarms** (covers all use cases)
- ✅ **200 focus sessions** (6 months of tracking)
- ✅ **50 friends** (quality connections)
- ✅ **100 shop items** (plenty of power-ups)
- ✅ **5 devices** (phone, tablet, laptop, etc.)

### Storage Per User:
- **Typical usage:** 150 KB - 3 MB
- **Maximum (no custom sounds):** 685 KB
- **Maximum (with custom sounds):** ~8 MB

### For 200 Users:
- **Total storage needed:** 30-600 MB
- **Free tier capacity:** 500 MB
- ✅ **Plenty of room to grow!**

---

**These limits ensure fair usage for all users while staying within the free tier. Most users will never hit these limits in normal usage!** 🚀

