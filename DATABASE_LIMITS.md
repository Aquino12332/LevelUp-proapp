# Database Usage Limits

This document explains the usage limits implemented to ensure the app stays within Neon PostgreSQL's free tier for 200+ users.

## 🎯 Why Limits?

**Neon PostgreSQL Free Tier:**
- Storage: 0.5 GB (500 MB)
- Data Transfer: 10 GB/month
- Perfect for 200 users with smart limits!

## 📊 Per-User Limits

| Feature | Limit | Estimated Storage |
|---------|-------|-------------------|
| **Tasks (active)** | 100 tasks | ~50 KB |
| **Notes** | 50 notes | ~500 KB |
| **Alarms** | 20 alarms | ~10 KB |
| **Focus Sessions** | 200 sessions | ~100 KB |
| **Friends** | 50 friends | ~5 KB |
| **Inventory Items** | 100 items | ~10 KB |
| **Push Subscriptions** | 5 devices | ~5 KB |

**Average per user: ~2-2.5 MB**
**200 users: ~400-500 MB** ✅ Within free tier!

## 📝 Content Limits

| Content Type | Limit |
|--------------|-------|
| Note Title | 200 characters |
| Note Body | 50,000 characters (~50 KB) |
| Task Title | 200 characters |
| Task Description | 2,000 characters |
| Alarm Label | 100 characters |
| Username | 30 characters |
| Name | 50 characters |
| Tags per Item | 10 tags |
| Tag Length | 50 characters |

## 🔄 Auto-Cleanup Policies

To prevent unlimited database growth:

- **Completed Tasks**: Auto-deleted after 90 days
- **Focus Sessions**: Auto-deleted after 180 days (6 months)
- **Rejected Friend Requests**: Auto-deleted after 30 days

## 📈 What Happens at Limits?

When a user reaches a limit:

1. **Clear error message** displayed
2. **Suggested actions** (e.g., "Delete some tasks to add more")
3. **No data loss** - existing data is preserved
4. **Can still use other features**

### Example Messages:

- ✅ Tasks: "You've reached the maximum of 100 tasks. Please complete or delete some tasks to add more."
- ✅ Notes: "You've reached the maximum of 50 notes. Please delete some notes to add more."
- ✅ Alarms: "You've reached the maximum of 20 alarms. Please delete some alarms to add more."

## 🛠️ Implementation Details

### Server-Side Validation (`server/routes.ts`)
- Checks limits before creating new items
- Returns 400 error with helpful message
- Validates content length

### Schema Validation (`shared/schema.ts`)
- Zod schemas validate content length
- Prevents oversized content from being submitted

### Limits Configuration (`shared/limits.ts`)
- Centralized configuration
- Easy to adjust limits if needed
- Helper functions for storage estimation

## 💡 Best Practices for Users

1. **Tasks**: Mark tasks as complete when done (they don't count toward limit)
2. **Notes**: Delete old/unused notes periodically
3. **Alarms**: Remove alarms you no longer need
4. **Focus Sessions**: Old sessions are auto-deleted after 6 months
5. **Friends**: Quality over quantity!

## 🚀 Scaling Beyond Free Tier

If you grow beyond 200 users or need more storage:

### Neon Paid Plans:
- **Launch**: $19/month - 10 GB storage
- **Scale**: $69/month - 50 GB storage

### Alternative Solutions:
1. **Increase limits** slightly (still safe for 200 users)
2. **Add user tiers** (free vs premium)
3. **Implement aggressive auto-cleanup**
4. **Migrate to larger free tier** (Supabase: 500 MB)

## 📊 Monitoring Storage

To check your current usage:

1. **Neon Dashboard**: Shows total database size
2. **Storage Estimation**: Use `estimateUserStorageBytes()` helper
3. **Per-User Stats**: Track in admin panel (future feature)

## ✅ Summary

With these limits:
- ✅ 200 users fit comfortably in free tier
- ✅ Each user has generous limits for daily use
- ✅ Auto-cleanup prevents runaway growth
- ✅ Clear messaging when limits reached
- ✅ Easy to adjust limits if needed

**Your app is production-ready for 200 users!** 🎉
