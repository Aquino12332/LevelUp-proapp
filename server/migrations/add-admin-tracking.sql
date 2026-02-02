-- Migration: Add admin tracking fields to users table and create analytics tables
-- Run this SQL in your Neon/PostgreSQL database console

-- Add tracking fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp,
  ADD COLUMN IF NOT EXISTS "lastLogoutAt" timestamp,
  ADD COLUMN IF NOT EXISTS "isOnline" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deviceType" varchar;

-- Create userSessions table for tracking app open/close events
CREATE TABLE IF NOT EXISTS "userSessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "sessionStart" timestamp NOT NULL DEFAULT now(),
  "sessionEnd" timestamp,
  "deviceType" varchar,
  "userAgent" text,
  "ipAddress" varchar
);

-- Create activityLog table for detailed user action tracking
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

-- Create dailyMetrics table for pre-aggregated analytics (performance optimization)
CREATE TABLE IF NOT EXISTS "dailyMetrics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" varchar NOT NULL,
  "userId" varchar,
  "totalStudyTime" integer DEFAULT 0,
  "focusSessions" integer DEFAULT 0,
  "tasksCompleted" integer DEFAULT 0,
  "tasksCreated" integer DEFAULT 0,
  "notesCreated" integer DEFAULT 0,
  "loginCount" integer DEFAULT 0,
  "sessionDuration" integer DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "userSessions_userId_idx" ON "userSessions"("userId");
CREATE INDEX IF NOT EXISTS "userSessions_sessionStart_idx" ON "userSessions"("sessionStart");

CREATE INDEX IF NOT EXISTS "activityLog_userId_idx" ON "activityLog"("userId");
CREATE INDEX IF NOT EXISTS "activityLog_timestamp_idx" ON "activityLog"("timestamp");
CREATE INDEX IF NOT EXISTS "activityLog_action_idx" ON "activityLog"("action");

CREATE INDEX IF NOT EXISTS "dailyMetrics_date_idx" ON "dailyMetrics"("date");
CREATE INDEX IF NOT EXISTS "dailyMetrics_userId_idx" ON "dailyMetrics"("userId");
CREATE INDEX IF NOT EXISTS "dailyMetrics_date_userId_idx" ON "dailyMetrics"("date", "userId");

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('lastLoginAt', 'lastLogoutAt', 'isOnline', 'deviceType');

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('userSessions', 'activityLog', 'dailyMetrics');
