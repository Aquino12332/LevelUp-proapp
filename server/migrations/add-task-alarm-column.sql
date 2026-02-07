-- Migration: Add alarmId column to tasks table
-- Created: 2026-02-07
-- Description: Adds alarmId column to tasks table to link tasks with alarms

-- Add alarmId column to tasks table if it doesn't exist
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS "alarmId" varchar;

-- Create index for faster alarm lookups
CREATE INDEX IF NOT EXISTS "tasks_alarmId_idx" ON "tasks"("alarmId");

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name = 'alarmId';
