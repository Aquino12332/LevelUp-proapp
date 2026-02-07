-- ========================================
-- CLEANUP SCRIPT - Run this FIRST
-- ========================================
-- This removes orphaned data before adding foreign keys
-- ========================================

-- Find and delete orphaned tasks (tasks without valid users)
DELETE FROM tasks
WHERE "userId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned notes (notes without valid users)
DELETE FROM notes
WHERE "userId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned alarms (alarms without valid users)
DELETE FROM alarms
WHERE "userId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned userStats (stats without valid users)
DELETE FROM "userStats"
WHERE "userId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned focusSessions (sessions without valid users)
DELETE FROM "focusSessions"
WHERE "userId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned friendships (friendships with invalid users)
DELETE FROM friendships
WHERE "userId" NOT IN (SELECT id FROM users)
   OR "friendId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned friend requests
DELETE FROM "friendRequests"
WHERE "senderId" NOT IN (SELECT id FROM users)
   OR "receiverId" NOT IN (SELECT id FROM users);

-- Find and delete orphaned inventory items
DELETE FROM "userInventory"
WHERE "userId" NOT IN (SELECT id FROM users);

-- Show what was cleaned up
SELECT 
  'Cleanup complete! You can now run the MASTER_MIGRATION.sql' as message;

-- Verify no orphaned records remain
SELECT 
  'tasks' as table_name,
  COUNT(*) as orphaned_count
FROM tasks
WHERE "userId" NOT IN (SELECT id FROM users)
UNION ALL
SELECT 
  'notes' as table_name,
  COUNT(*) as orphaned_count
FROM notes
WHERE "userId" NOT IN (SELECT id FROM users)
UNION ALL
SELECT 
  'alarms' as table_name,
  COUNT(*) as orphaned_count
FROM alarms
WHERE "userId" NOT IN (SELECT id FROM users);
