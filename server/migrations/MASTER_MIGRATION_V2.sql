-- ========================================
-- MASTER MIGRATION V2 - Run this in Neon SQL Editor
-- ========================================
-- This version REMOVES foreign key constraints to avoid errors
-- We'll add them later after data is clean
-- ========================================

-- MIGRATION 1: Admin Analytics & Tracking
-- ========================================

-- Drop and recreate dailyMetrics with correct varchar types
DROP TABLE IF EXISTS "dailyMetrics" CASCADE;

CREATE TABLE "dailyMetrics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" varchar NOT NULL,
  "userId" varchar,
  "totalStudyTime" varchar DEFAULT '0',
  "focusSessions" varchar DEFAULT '0',
  "tasksCompleted" varchar DEFAULT '0',
  "tasksCreated" varchar DEFAULT '0',
  "notesCreated" varchar DEFAULT '0',
  "loginCount" varchar DEFAULT '0',
  "sessionDuration" varchar DEFAULT '0',
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Create activityLog table
CREATE TABLE IF NOT EXISTS "activityLog" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "action" varchar NOT NULL,
  "feature" varchar,
  "details" text,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "deviceType" varchar,
  "ipAddress" varchar
);

-- Create userSessions table
CREATE TABLE IF NOT EXISTS "userSessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "sessionStart" timestamp NOT NULL DEFAULT now(),
  "sessionEnd" timestamp,
  "deviceType" varchar,
  "userAgent" text,
  "ipAddress" varchar
);

-- Add tracking fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp,
  ADD COLUMN IF NOT EXISTS "lastLogoutAt" timestamp,
  ADD COLUMN IF NOT EXISTS "isOnline" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deviceType" varchar,
  ADD COLUMN IF NOT EXISTS "pushSubscription" text;

-- MIGRATION 2: Notification Columns
-- ========================================

-- Add notification tracking to tasks
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS "dueSoonNotificationSent" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastOverdueNotification" TIMESTAMP;

-- Add notification preferences to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "notificationPreferences" TEXT;

-- MIGRATION 3: Push Subscriptions
-- ========================================

-- Create pushSubscriptions table
CREATE TABLE IF NOT EXISTS "pushSubscriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "endpoint" text NOT NULL UNIQUE,
  "keys" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- CREATE ALL INDEXES (Performance)
-- ========================================

-- User sessions indexes
CREATE INDEX IF NOT EXISTS "userSessions_userId_idx" ON "userSessions"("userId");
CREATE INDEX IF NOT EXISTS "userSessions_sessionStart_idx" ON "userSessions"("sessionStart");

-- Activity log indexes
CREATE INDEX IF NOT EXISTS "activityLog_userId_idx" ON "activityLog"("userId");
CREATE INDEX IF NOT EXISTS "activityLog_timestamp_idx" ON "activityLog"("timestamp");
CREATE INDEX IF NOT EXISTS "activityLog_action_idx" ON "activityLog"("action");
CREATE INDEX IF NOT EXISTS "activityLog_userId_timestamp_idx" ON "activityLog"("userId", "timestamp");

-- Daily metrics indexes
CREATE INDEX IF NOT EXISTS "dailyMetrics_date_idx" ON "dailyMetrics"("date");
CREATE INDEX IF NOT EXISTS "dailyMetrics_userId_idx" ON "dailyMetrics"("userId");
CREATE INDEX IF NOT EXISTS "dailyMetrics_date_userId_idx" ON "dailyMetrics"("date", "userId");

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS "pushSubscriptions_userId_idx" ON "pushSubscriptions"("userId");
CREATE INDEX IF NOT EXISTS "pushSubscriptions_endpoint_idx" ON "pushSubscriptions"("endpoint");

-- User indexes (performance)
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");
CREATE INDEX IF NOT EXISTS "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- Task indexes (performance)
CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "tasks_completed_userId_idx" ON "tasks"("completed", "userId");
CREATE INDEX IF NOT EXISTS "tasks_category_idx" ON "tasks"("category");

-- Note indexes (performance)
CREATE INDEX IF NOT EXISTS "notes_createdAt_idx" ON "notes"("createdAt");
CREATE INDEX IF NOT EXISTS "notes_updatedAt_idx" ON "notes"("updatedAt");

-- Focus session indexes (performance)
CREATE INDEX IF NOT EXISTS "focusSessions_completedAt_idx" ON "focusSessions"("completedAt");
CREATE INDEX IF NOT EXISTS "focusSessions_userId_startedAt_idx" ON "focusSessions"("userId", "startedAt");

-- UserStats indexes (performance)
CREATE INDEX IF NOT EXISTS "userStats_userId_idx" ON "userStats"("userId");

-- Friendship indexes (performance)
CREATE INDEX IF NOT EXISTS "friendships_userId_status_idx" ON "friendships"("userId", "status");
CREATE INDEX IF NOT EXISTS "friendRequests_receiverId_status_idx" ON "friendRequests"("receiverId", "status");

-- ========================================
-- VERIFICATION (Check everything was created)
-- ========================================

-- Check all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('userSessions', 'activityLog', 'dailyMetrics', 'pushSubscriptions')
ORDER BY table_name;

-- Check all new columns exist on users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('lastLoginAt', 'lastLogoutAt', 'isOnline', 'deviceType', 'pushSubscription', 'notificationPreferences')
ORDER BY column_name;

-- Check all new columns exist on tasks table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('dueSoonNotificationSent', 'lastOverdueNotification')
ORDER BY column_name;

-- Count indexes created
SELECT 
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ========================================
-- SUCCESS!
-- ========================================
-- If you see results above with no errors, migration was successful!
-- Next step: Uncomment the schema columns and deploy
-- Note: Foreign keys are NOT added to avoid data conflicts
-- ========================================
