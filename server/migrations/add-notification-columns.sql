-- Migration: Add notification tracking columns
-- Created: 2026-02-07
-- Description: Adds columns needed for task notification features

-- Add notification tracking fields to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS "dueSoonNotificationSent" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastOverdueNotification" TIMESTAMP;

-- Add notification preferences to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "notificationPreferences" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tasks."dueSoonNotificationSent" IS 'Tracks if due soon notification has been sent for this task';
COMMENT ON COLUMN tasks."lastOverdueNotification" IS 'Timestamp of last overdue notification sent';
COMMENT ON COLUMN users."notificationPreferences" IS 'JSON: {dueReminderMinutes: 60, overdueEnabled: true, recurringEnabled: true}';

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('dueSoonNotificationSent', 'lastOverdueNotification')
ORDER BY column_name;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'notificationPreferences'
ORDER BY column_name;
