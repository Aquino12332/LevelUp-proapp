-- Migration: Add admin tracking fields to users table and create userSessions table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "userSessions_userId_idx" ON "userSessions"("userId");
CREATE INDEX IF NOT EXISTS "userSessions_sessionStart_idx" ON "userSessions"("sessionStart");

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('lastLoginAt', 'lastLogoutAt', 'isOnline', 'deviceType');

SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'userSessions';
