import { db } from "../db";
import { eq, and, or, desc, like, ne } from "drizzle-orm";
import {
  users, alarms, notes, tasks, userStats, shopItems, userInventory,
  focusSessions, friendRequests, friendships,
  type User, type InsertUser,
  type Alarm, type InsertAlarm,
  type Note, type InsertNote,
  type Task, type InsertTask,
  type UserStats, type InsertUserStats,
  type ShopItem, type InsertShopItem,
  type UserInventory, type InsertUserInventory,
  type FocusSession, type InsertFocusSession,
  type FriendRequest, type InsertFriendRequest,
  type Friendship
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)))
      .limit(1);
    return result[0];
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  // Alarm methods
  async getAlarms(userId: string): Promise<Alarm[]> {
    return await db.select().from(alarms).where(eq(alarms.userId, userId));
  }

  async getUserAlarms(userId: string): Promise<Alarm[]> {
    return this.getAlarms(userId);
  }

  async getAlarm(id: string): Promise<Alarm | undefined> {
    const result = await db.select().from(alarms).where(eq(alarms.id, id)).limit(1);
    return result[0];
  }

  async createAlarm(userId: string, alarm: InsertAlarm): Promise<Alarm> {
    const result = await db.insert(alarms).values({ ...alarm, userId }).returning();
    return result[0];
  }

  async updateAlarm(id: string, alarm: Partial<InsertAlarm & { lastTriggered?: Date; snoozeUntil?: Date | null }>): Promise<Alarm | undefined> {
    const result = await db.update(alarms).set(alarm).where(eq(alarms.id, id)).returning();
    return result[0];
  }

  async deleteAlarm(id: string): Promise<boolean> {
    const result = await db.delete(alarms).where(eq(alarms.id, id)).returning();
    return result.length > 0;
  }

  // Note methods
  async getNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    return this.getNotes(userId);
  }

  async getNote(id: string): Promise<Note | undefined> {
    const result = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
    return result[0];
  }

  async createNote(userId: string, note: InsertNote): Promise<Note> {
    const result = await db.insert(notes).values({ ...note, userId }).returning();
    return result[0];
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const result = await db.update(notes).set(note).where(eq(notes.id, id)).returning();
    return result[0];
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();
    return result.length > 0;
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    return this.getTasks(userId);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values({ ...task, userId }).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  // UserStats methods
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
    return result[0];
  }

  async createUserStats(userId: string, stats: InsertUserStats): Promise<UserStats> {
    const result = await db.insert(userStats).values({ ...stats, userId }).returning();
    return result[0];
  }

  async updateUserStats(userId: string, stats: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const result = await db.update(userStats).set(stats).where(eq(userStats.userId, userId)).returning();
    return result[0];
  }

  async getGlobalLeaderboard(limit: number = 10): Promise<UserStats[]> {
    return await db.select().from(userStats)
      .orderBy(desc(userStats.xp))
      .limit(limit);
  }

  // ShopItem methods
  async getShopItems(): Promise<ShopItem[]> {
    return await db.select().from(shopItems);
  }

  async getShopItem(id: string): Promise<ShopItem | undefined> {
    const result = await db.select().from(shopItems).where(eq(shopItems.id, id)).limit(1);
    return result[0];
  }

  async createShopItem(item: InsertShopItem): Promise<ShopItem> {
    const result = await db.insert(shopItems).values(item).returning();
    return result[0];
  }

  // UserInventory methods
  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return await db.select().from(userInventory).where(eq(userInventory.userId, userId));
  }

  async getInventoryItem(id: string): Promise<UserInventory | undefined> {
    const result = await db.select().from(userInventory).where(eq(userInventory.id, id)).limit(1);
    return result[0];
  }

  async addToInventory(userId: string, item: InsertUserInventory): Promise<UserInventory> {
    const result = await db.insert(userInventory).values({ ...item, userId }).returning();
    return result[0];
  }

  async updateInventoryItem(id: string, updates: Partial<InsertUserInventory>): Promise<UserInventory | undefined> {
    const result = await db.update(userInventory).set(updates).where(eq(userInventory.id, id)).returning();
    return result[0];
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(userInventory).where(eq(userInventory.id, id)).returning();
    return result.length > 0;
  }

  // FocusSession methods
  async getFocusSessions(userId: string): Promise<FocusSession[]> {
    return await db.select().from(focusSessions).where(eq(focusSessions.userId, userId));
  }

  async getFocusSession(id: string): Promise<FocusSession | undefined> {
    const result = await db.select().from(focusSessions).where(eq(focusSessions.id, id)).limit(1);
    return result[0];
  }

  async createFocusSession(userId: string, session: InsertFocusSession): Promise<FocusSession> {
    const result = await db.insert(focusSessions).values({ ...session, userId }).returning();
    return result[0];
  }

  async updateFocusSession(id: string, session: Partial<InsertFocusSession>): Promise<FocusSession | undefined> {
    const result = await db.update(focusSessions).set(session).where(eq(focusSessions.id, id)).returning();
    return result[0];
  }

  // Friend methods
  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        ne(users.id, currentUserId),
        or(
          like(users.username, `%${query}%`),
          like(users.email, `%${query}%`)
        )
      ))
      .limit(20);
  }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    const result = await db.insert(friendRequests)
      .values({ senderId, receiverId, status: 'pending' })
      .returning();
    return result[0];
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    return await db.select().from(friendRequests)
      .where(and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, 'pending')
      ));
  }

  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    return await db.select().from(friendRequests)
      .where(and(
        eq(friendRequests.senderId, userId),
        eq(friendRequests.status, 'pending')
      ));
  }

  async getPendingFriendRequestsForUser(userId: string): Promise<FriendRequest[]> {
    return await db.select().from(friendRequests)
      .where(and(
        or(
          eq(friendRequests.senderId, userId),
          eq(friendRequests.receiverId, userId)
        ),
        eq(friendRequests.status, 'pending')
      ));
  }

  async getFriendRequest(id: string): Promise<FriendRequest | undefined> {
    const result = await db.select().from(friendRequests).where(eq(friendRequests.id, id)).limit(1);
    return result[0];
  }

  async acceptFriendRequest(requestId: string): Promise<Friendship | undefined> {
    const request = await this.getFriendRequest(requestId);
    if (!request) return undefined;

    // Update request status
    await db.update(friendRequests)
      .set({ status: 'accepted' })
      .where(eq(friendRequests.id, requestId));

    // Create friendship
    const result = await db.insert(friendships)
      .values({ userId: request.senderId, friendId: request.receiverId })
      .returning();
    
    return result[0];
  }

  async rejectFriendRequest(requestId: string): Promise<boolean> {
    const result = await db.update(friendRequests)
      .set({ status: 'rejected' })
      .where(eq(friendRequests.id, requestId))
      .returning();
    return result.length > 0;
  }

  async getFriends(userId: string): Promise<User[]> {
    // Get friendships where user is either userId or friendId
    const friendshipRecords = await db.select().from(friendships)
      .where(or(
        eq(friendships.userId, userId),
        eq(friendships.friendId, userId)
      ));

    // Get friend IDs
    const friendIds = friendshipRecords.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );

    if (friendIds.length === 0) return [];

    // Get user details for all friends
    return await db.select().from(users)
      .where(or(...friendIds.map(id => eq(users.id, id))));
  }

  async getUserFriends(userId: string): Promise<User[]> {
    return this.getFriends(userId);
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const result = await db.delete(friendships)
      .where(or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
      ))
      .returning();
    return result.length > 0;
  }
}
