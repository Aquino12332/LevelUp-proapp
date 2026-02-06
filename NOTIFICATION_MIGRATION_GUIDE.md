# Notification Features Database Migration Guide

## Overview
This guide will help you add the database columns needed for task notification features.

## What This Migration Does
Adds 3 columns to your PostgreSQL database:
- `tasks.dueSoonNotificationSent` (boolean) - Tracks if notification sent
- `tasks.lastOverdueNotification` (timestamp) - Last overdue notification time
- `users.notificationPreferences` (text/json) - User notification settings

## Step-by-Step Instructions

### Step 1: Connect to Your Render Database

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your PostgreSQL database (not the web service)
3. Click the "Connect" button
4. Copy the "External Database URL" or use the "Shell" option

### Step 2: Run the Migration

**Option A: Using Render Shell (Easiest)**
1. In your database page on Render, click "Shell"
2. Copy the entire contents of `server/migrations/add-notification-columns.sql`
3. Paste into the shell and press Enter
4. You should see "ALTER TABLE" success messages

**Option B: Using psql locally**
1. Open terminal/command prompt
2. Copy your External Database URL from Render
3. Run: `psql "YOUR_DATABASE_URL"`
4. Run: `\i server/migrations/add-notification-columns.sql`
5. Or copy/paste the SQL contents directly

**Option C: Using a Database GUI**
1. Use tool like pgAdmin, DBeaver, or TablePlus
2. Connect using your Render database credentials
3. Open and execute `server/migrations/add-notification-columns.sql`

### Step 3: Verify Migration Succeeded

After running the migration, you should see output like:
```
ALTER TABLE
ALTER TABLE
COMMENT
COMMENT
COMMENT

 column_name              | data_type | column_default | is_nullable
--------------------------+-----------+----------------+-------------
 dueSoonNotificationSent  | boolean   | false          | YES
 lastOverdueNotification  | timestamp | NULL           | YES
```

### Step 4: Notify Me

Once you've successfully run the migration, let me know and I will:
1. Uncomment the notification fields in the schema
2. Re-enable the notification tracking code
3. Deploy the updated code
4. Test that notifications work

## Rollback (If Needed)

If something goes wrong, you can rollback with:
```sql
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS "dueSoonNotificationSent",
  DROP COLUMN IF EXISTS "lastOverdueNotification";

ALTER TABLE users
  DROP COLUMN IF EXISTS "notificationPreferences";
```

## Common Issues

**Issue: Permission denied**
- Make sure you're using the database owner credentials from Render

**Issue: Table doesn't exist**
- Verify you're connected to the correct database
- Check table names are lowercase: `tasks`, `users`

**Issue: Column already exists**
- This is fine! The migration uses `IF NOT EXISTS`
- It means the column was added previously

## Need Help?

Let me know if you encounter any issues and I'll help troubleshoot!
