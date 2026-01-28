import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, time, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password"), // nullable for OAuth users
  email: text("email").unique(), // for OAuth and email login
  provider: varchar("provider").default("local"), // 'local', 'google', etc.
  providerId: text("providerId"), // OAuth provider's user ID
  avatar: text("avatar"), // profile picture URL
  resetToken: text("resetToken"), // password reset token
  resetTokenExpiry: timestamp("resetTokenExpiry"), // token expiration time
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const alarms = pgTable("alarms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  label: text("label").notNull(),
  time: time("time").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sound: varchar("sound").notNull().default("bell"),
  repeatDays: text("repeatDays").default("[]"),
  snoozeUntil: timestamp("snoozeUntil"),
  lastTriggered: timestamp("lastTriggered"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("alarms_userId_idx").on(table.userId),
}));

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tags: text("tags").notNull().default("[]"),
  isFavorite: boolean("isFavorite").notNull().default(false),
  aiSummary: text("aiSummary"), // AI-generated summary of the note
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("notes_userId_idx").on(table.userId),
}));

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high
  category: varchar("category").notNull().default("general"), // general, study, work, personal
  dueDate: timestamp("dueDate"),
  dueTime: time("dueTime"),
  alarmId: varchar("alarmId"), // optional link to alarm
  tags: text("tags").notNull().default("[]"),
  // Recurring task fields
  isRecurring: boolean("isRecurring").notNull().default(false),
  recurrenceType: varchar("recurrenceType"), // "daily", "weekly", "weekdays", "weekends", "custom"
  recurrenceDays: text("recurrenceDays").default("[]"), // JSON array of days [0-6] for weekly/custom
  parentTaskId: varchar("parentTaskId"), // Reference to original recurring task
  recurringGroupId: varchar("recurringGroupId"), // Group ID for all instances of a recurring task
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("tasks_userId_idx").on(table.userId),
  completedIdx: index("tasks_completed_idx").on(table.completed),
  recurringGroupIdx: index("tasks_recurringGroup_idx").on(table.recurringGroupId),
}));

export const userStats = pgTable("userStats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull().unique(),
  name: text("name").notNull().default("Student"),
  age: text("age"), // optional age field
  gender: text("gender"), // optional gender field (e.g., "male", "female", "other", "prefer not to say")
  level: text("level").notNull().default("1"), // stored as text for compatibility
  xp: text("xp").notNull().default("0"),
  coins: text("coins").notNull().default("0"),
  streak: text("streak").notNull().default("0"),
  lastActiveDate: timestamp("lastActiveDate"),
  totalStudyTime: text("totalStudyTime").notNull().default("0"), // in minutes
  tasksCompleted: text("tasksCompleted").notNull().default("0"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const shopItems = pgTable("shopItems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(), // stored as text for large numbers
  category: varchar("category").notNull(), // powerups, themes, cosmetics, music
  icon: text("icon").notNull(),
  effectType: varchar("effectType"), // streak_freeze, double_xp, theme, avatar_frame
  effectValue: text("effectValue"), // JSON string for effect parameters
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const userInventory = pgTable("userInventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  itemId: varchar("itemId").notNull(),
  quantity: text("quantity").notNull().default("1"),
  isActive: boolean("isActive").notNull().default(false), // for themes, cosmetics
  purchasedAt: timestamp("purchasedAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"), // for temporary items like double XP
}, (table) => ({
  userIdIdx: index("userInventory_userId_idx").on(table.userId),
}));

export const focusSessions = pgTable("focusSessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  duration: text("duration").notNull(), // in minutes
  completedDuration: text("completedDuration").notNull(), // actual time completed
  isCompleted: boolean("isCompleted").notNull().default(false),
  taskId: varchar("taskId"), // optional link to task
  xpEarned: text("xpEarned").notNull().default("0"),
  coinsEarned: text("coinsEarned").notNull().default("0"),
  startedAt: timestamp("startedAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("focusSessions_userId_idx").on(table.userId),
  startedAtIdx: index("focusSessions_startedAt_idx").on(table.startedAt),
}));

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(), // the user who initiated or accepted
  friendId: varchar("friendId").notNull(), // the friend
  status: varchar("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  acceptedAt: timestamp("acceptedAt"),
}, (table) => ({
  userIdIdx: index("friendships_userId_idx").on(table.userId),
  friendIdIdx: index("friendships_friendId_idx").on(table.friendId),
}));

export const friendRequests = pgTable("friendRequests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("senderId").notNull(), // who sent the request
  receiverId: varchar("receiverId").notNull(), // who receives the request
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  respondedAt: timestamp("respondedAt"),
}, (table) => ({
  senderIdIdx: index("friendRequests_senderId_idx").on(table.senderId),
  receiverIdIdx: index("friendRequests_receiverId_idx").on(table.receiverId),
}));

export const pushSubscriptions = pgTable("pushSubscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: text("keys").notNull(), // JSON string with p256dh and auth keys
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("pushSubscriptions_userId_idx").on(table.userId),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  provider: true,
  providerId: true,
  avatar: true,
}).refine(
  (data) => !data.username || data.username.length <= 30,
  { message: "Username must be 30 characters or less" }
);

export const insertAlarmSchema = createInsertSchema(alarms).pick({
  label: true,
  time: true,
  enabled: true,
  sound: true,
  repeatDays: true,
}).refine(
  (data) => !data.label || data.label.length <= 100,
  { message: "Alarm label must be 100 characters or less" }
);

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  body: true,
  tags: true,
}).refine(
  (data) => !data.title || data.title.length <= 200,
  { message: "Note title must be 200 characters or less" }
).refine(
  (data) => !data.body || data.body.length <= 50000,
  { message: "Note content must be 50,000 characters or less" }
);

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  completed: true,
  priority: true,
  category: true,
  dueDate: true,
  dueTime: true,
  alarmId: true,
  tags: true,
  isRecurring: true,
  recurrenceType: true,
  recurrenceDays: true,
  parentTaskId: true,
  recurringGroupId: true,
}).refine(
  (data) => !data.title || data.title.length <= 200,
  { message: "Task title must be 200 characters or less" }
).refine(
  (data) => !data.description || data.description.length <= 2000,
  { message: "Task description must be 2,000 characters or less" }
);

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  name: true,
  age: true,
  gender: true,
  level: true,
  xp: true,
  coins: true,
  streak: true,
  lastActiveDate: true,
  totalStudyTime: true,
  tasksCompleted: true,
});

export const insertShopItemSchema = createInsertSchema(shopItems).pick({
  name: true,
  description: true,
  price: true,
  category: true,
  icon: true,
  effectType: true,
  effectValue: true,
});

export const insertUserInventorySchema = createInsertSchema(userInventory).pick({
  itemId: true,
  quantity: true,
  isActive: true,
  expiresAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).pick({
  duration: true,
  completedDuration: true,
  isCompleted: true,
  taskId: true,
  xpEarned: true,
  coinsEarned: true,
  startedAt: true,
  completedAt: true,
});

export const insertFriendRequestSchema = createInsertSchema(friendRequests).pick({
  receiverId: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  userId: true,
  endpoint: true,
  keys: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarms.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItems.$inferSelect;
export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type UserInventory = typeof userInventory.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
