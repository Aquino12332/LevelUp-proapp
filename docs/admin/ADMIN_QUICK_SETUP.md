# ⚡ Admin Dashboard - Quick Setup (5 Minutes)

## Step 1: Add Admin Secret to Environment

Add to your `.env` file:
```env
ADMIN_SECRET=admin_2024_secure_key
```

Or in Render dashboard:
- Go to Environment tab
- Add: `ADMIN_SECRET` = `your-secret-here`

## Step 2: Run Database Migration

**In Neon Dashboard SQL Editor**, paste and run:

```sql
-- Add tracking fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp,
  ADD COLUMN IF NOT EXISTS "lastLogoutAt" timestamp,
  ADD COLUMN IF NOT EXISTS "isOnline" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deviceType" varchar;

-- Create sessions table
CREATE TABLE IF NOT EXISTS "userSessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "sessionStart" timestamp NOT NULL DEFAULT now(),
  "sessionEnd" timestamp,
  "deviceType" varchar,
  "userAgent" text,
  "ipAddress" varchar
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "userSessions_userId_idx" ON "userSessions"("userId");
CREATE INDEX IF NOT EXISTS "userSessions_sessionStart_idx" ON "userSessions"("sessionStart");
```

## Step 3: Deploy & Access

1. **Deploy your app** (push to Render or run locally)
2. **Access admin at**: `https://your-app.com/admin/login`
3. **Enter your ADMIN_SECRET**
4. **View the dashboard!**

## What You Get

✅ **Track Students**: See who's online right now
✅ **Activity Monitoring**: Login/logout times, device types
✅ **Password Reset**: Manually reset any student's password
✅ **Statistics**: Total users, active today, device breakdown
✅ **Search**: Find students by username or email

## Demo for Validator

1. Show them: `https://your-app.com/admin/login`
2. Login with admin secret
3. Show the dashboard with:
   - Total users count
   - Online users (real-time)
   - User table with activity
   - Password reset feature

## Screenshots for Your Validator

**Admin Login Page:**
- Professional shield icon
- Secure password input
- Clean interface

**Admin Dashboard:**
- 4 stat cards (Total, Online, Active Today, New This Week)
- Device usage breakdown
- Complete user table with:
  - Online/Offline status badges
  - Device icons (mobile/desktop/tablet)
  - Last login times
  - Study time & level
  - Reset password button

---

**That's it!** Your admin dashboard is ready. 🎉

For detailed documentation, see `ADMIN_DASHBOARD_GUIDE.md`
