/**
 * Application-wide limits to ensure database stays within free tier constraints
 * 
 * For 200 users with Neon PostgreSQL free tier:
 * - Storage: 0.5 GB (500 MB)
 * - Data transfer: 10 GB/month
 * 
 * Estimated storage per user with limits: ~2-2.5 MB
 * Total for 200 users: ~400-500 MB (within free tier!)
 */

export const LIMITS = {
  // Per-user content limits
  MAX_TASKS_PER_USER: 100,           // ~50 KB per user (avg 500 bytes/task)
  MAX_NOTES_PER_USER: 50,            // ~500 KB per user (avg 10 KB/note with content)
  MAX_ALARMS_PER_USER: 20,           // ~10 KB per user (avg 500 bytes/alarm)
  MAX_FOCUS_SESSIONS_PER_USER: 200,  // ~100 KB per user (avg 500 bytes/session)
  MAX_FRIENDS_PER_USER: 50,          // ~5 KB per user (avg 100 bytes/friendship)
  MAX_INVENTORY_ITEMS_PER_USER: 100, // ~10 KB per user (avg 100 bytes/item)
  MAX_PUSH_SUBSCRIPTIONS_PER_USER: 5, // ~5 KB per user (avg 1 KB/subscription)
  
  // Content size limits
  MAX_NOTE_TITLE_LENGTH: 200,        // characters
  MAX_NOTE_BODY_LENGTH: 50000,       // ~50 KB max (generous for notes)
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_TASK_DESCRIPTION_LENGTH: 2000,
  MAX_ALARM_LABEL_LENGTH: 100,
  MAX_TAGS_PER_ITEM: 10,
  MAX_TAG_LENGTH: 50,
  
  // Social limits
  MAX_PENDING_FRIEND_REQUESTS: 20,   // per user
  MAX_USERNAME_LENGTH: 30,
  MAX_NAME_LENGTH: 50,
  
  // Global limits (across all users)
  MAX_SHOP_ITEMS: 200,               // ~100 KB total for shop items
  
  // Cleanup policies (to prevent unlimited growth)
  AUTO_DELETE_COMPLETED_TASKS_DAYS: 90,     // delete completed tasks after 90 days
  AUTO_DELETE_OLD_SESSIONS_DAYS: 180,       // delete focus sessions after 6 months
  AUTO_DELETE_REJECTED_REQUESTS_DAYS: 30,   // delete rejected friend requests after 30 days
} as const;

export const LIMIT_MESSAGES = {
  TASKS: `You've reached the maximum of ${LIMITS.MAX_TASKS_PER_USER} tasks. Please complete or delete some tasks to add more.`,
  NOTES: `You've reached the maximum of ${LIMITS.MAX_NOTES_PER_USER} notes. Please delete some notes to add more.`,
  ALARMS: `You've reached the maximum of ${LIMITS.MAX_ALARMS_PER_USER} alarms. Please delete some alarms to add more.`,
  FRIENDS: `You've reached the maximum of ${LIMITS.MAX_FRIENDS_PER_USER} friends.`,
  FRIEND_REQUESTS: `You've reached the maximum of ${LIMITS.MAX_PENDING_FRIEND_REQUESTS} pending friend requests.`,
  NOTE_TOO_LONG: `Note content is too long. Maximum ${LIMITS.MAX_NOTE_BODY_LENGTH} characters.`,
  PUSH_SUBSCRIPTIONS: `You've reached the maximum of ${LIMITS.MAX_PUSH_SUBSCRIPTIONS_PER_USER} devices for notifications.`,
} as const;

// Helper function to check if a limit has been reached
export function isLimitReached(current: number, limit: number): boolean {
  return current >= limit;
}

// Calculate approximate storage usage for a user
export function estimateUserStorageBytes(counts: {
  tasks: number;
  notes: number;
  alarms: number;
  sessions: number;
  friends: number;
  inventory: number;
  subscriptions: number;
}): number {
  return (
    counts.tasks * 500 +
    counts.notes * 10000 +
    counts.alarms * 500 +
    counts.sessions * 500 +
    counts.friends * 100 +
    counts.inventory * 100 +
    counts.subscriptions * 1000 +
    5000 // base user data (account, stats, etc.)
  );
}

// Convert bytes to human-readable format
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
