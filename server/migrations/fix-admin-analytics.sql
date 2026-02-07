-- Migration: Fix admin analytics tables to match schema
-- This ensures activityLog and dailyMetrics tables exist with correct column types

-- Drop and recreate dailyMetrics with correct varchar types to match schema.ts
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

-- Ensure activityLog table exists
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

-- Ensure userSessions table exists
CREATE TABLE IF NOT EXISTS "userSessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "sessionStart" timestamp NOT NULL DEFAULT now(),
  "sessionEnd" timestamp,
  "deviceType" varchar,
  "userAgent" text,
  "ipAddress" varchar
);

-- Add tracking fields to users table if they don't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp,
  ADD COLUMN IF NOT EXISTS "lastLogoutAt" timestamp,
  ADD COLUMN IF NOT EXISTS "isOnline" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deviceType" varchar,
  ADD COLUMN IF NOT EXISTS "pushSubscription" text;

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS "userSessions_userId_idx" ON "userSessions"("userId");
CREATE INDEX IF NOT EXISTS "userSessions_sessionStart_idx" ON "userSessions"("sessionStart");

CREATE INDEX IF NOT EXISTS "activityLog_userId_idx" ON "activityLog"("userId");
CREATE INDEX IF NOT EXISTS "activityLog_timestamp_idx" ON "activityLog"("timestamp");
CREATE INDEX IF NOT EXISTS "activityLog_action_idx" ON "activityLog"("action");

CREATE INDEX IF NOT EXISTS "dailyMetrics_date_idx" ON "dailyMetrics"("date");
CREATE INDEX IF NOT EXISTS "dailyMetrics_userId_idx" ON "dailyMetrics"("userId");
CREATE INDEX IF NOT EXISTS "dailyMetrics_date_userId_idx" ON "dailyMetrics"("date", "userId");

-- Verify tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('userSessions', 'activityLog', 'dailyMetrics')
ORDER BY table_name;
