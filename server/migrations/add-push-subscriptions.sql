-- Migration: Add push subscriptions table
-- Created: 2026-02-07
-- Description: Adds table for storing web push notification subscriptions

-- Create pushSubscriptions table
CREATE TABLE IF NOT EXISTS "pushSubscriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" varchar NOT NULL,
  "endpoint" text NOT NULL UNIQUE,
  "keys" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE "pushSubscriptions"
  ADD CONSTRAINT IF NOT EXISTS "fk_pushSubscriptions_userId"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS "pushSubscriptions_userId_idx" ON "pushSubscriptions"("userId");
CREATE INDEX IF NOT EXISTS "pushSubscriptions_endpoint_idx" ON "pushSubscriptions"("endpoint");

-- Add comments for documentation
COMMENT ON TABLE "pushSubscriptions" IS 'Stores web push notification subscriptions for users';
COMMENT ON COLUMN "pushSubscriptions"."endpoint" IS 'Push notification endpoint URL (unique per device)';
COMMENT ON COLUMN "pushSubscriptions"."keys" IS 'JSON string containing p256dh and auth keys';

-- Verify table was created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pushSubscriptions') as column_count
FROM information_schema.tables 
WHERE table_name = 'pushSubscriptions';
