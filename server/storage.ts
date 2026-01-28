import { 
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
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updatePassword(userId: string, hashedPassword: string): Promise<boolean>;
  
  // Alarm methods
  getAlarms(userId: string): Promise<Alarm[]>;
  getUserAlarms(userId: string): Promise<Alarm[]>; // Alias for getAlarms
  getAlarm(id: string): Promise<Alarm | undefined>;
  createAlarm(userId: string, alarm: InsertAlarm): Promise<Alarm>;
  updateAlarm(id: string, alarm: Partial<InsertAlarm & { lastTriggered?: Date; snoozeUntil?: Date | null }>): Promise<Alarm | undefined>;
  deleteAlarm(id: string): Promise<boolean>;

  // Note methods
  getNotes(userId: string): Promise<Note[]>;
  getUserNotes(userId: string): Promise<Note[]>; // Alias for getNotes
  getNote(id: string): Promise<Note | undefined>;
  createNote(userId: string, note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Task methods
  getTasks(userId: string): Promise<Task[]>;
  getUserTasks(userId: string): Promise<Task[]>; // Alias for getTasks
  getTask(id: string): Promise<Task | undefined>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getAllTasks?(): Promise<Task[]>; // Optional for recurring tasks processing

  // UserStats methods
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(userId: string, stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: string, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  getGlobalLeaderboard(limit?: number): Promise<UserStats[]>;

  // ShopItem methods
  getShopItems(): Promise<ShopItem[]>;
  getShopItem(id: string): Promise<ShopItem | undefined>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;

  // UserInventory methods
  getUserInventory(userId: string): Promise<UserInventory[]>;
  getInventoryItem(id: string): Promise<UserInventory | undefined>;
  addToInventory(userId: string, item: InsertUserInventory): Promise<UserInventory>;
  updateInventoryItem(id: string, updates: Partial<InsertUserInventory>): Promise<UserInventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // FocusSession methods
  getFocusSessions(userId: string): Promise<FocusSession[]>;
  getFocusSession(id: string): Promise<FocusSession | undefined>;
  createFocusSession(userId: string, session: InsertFocusSession): Promise<FocusSession>;
  updateFocusSession(id: string, session: Partial<InsertFocusSession>): Promise<FocusSession | undefined>;

  // Friend methods
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
  sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest>;
  getFriendRequests(userId: string): Promise<FriendRequest[]>;
  getSentFriendRequests(userId: string): Promise<FriendRequest[]>;
  getPendingFriendRequestsForUser(userId: string): Promise<FriendRequest[]>;
  acceptFriendRequest(requestId: string): Promise<Friendship | undefined>;
  rejectFriendRequest(requestId: string): Promise<boolean>;
  getFriends(userId: string): Promise<User[]>;
  getUserFriends(userId: string): Promise<User[]>; // Alias for getFriends
  removeFriend(userId: string, friendId: string): Promise<boolean>;
  getFriendRequest(id: string): Promise<FriendRequest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private alarms: Map<string, Alarm>;
  private notes: Map<string, Note>;
  private tasks: Map<string, Task>;
  private userStats: Map<string, UserStats>;
  private shopItems: Map<string, ShopItem>;
  private userInventory: Map<string, UserInventory>;
  private focusSessions: Map<string, FocusSession>;
  private friendRequests: Map<string, FriendRequest>;
  private friendships: Map<string, Friendship>;

  constructor() {
    this.users = new Map();
    this.alarms = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.userStats = new Map();
    this.shopItems = new Map();
    this.userInventory = new Map();
    this.focusSessions = new Map();
    this.friendRequests = new Map();
    this.friendships = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.provider === provider && user.providerId === providerId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email ?? null,
      provider: insertUser.provider ?? "local",
      providerId: insertUser.providerId ?? null,
      avatar: insertUser.avatar ?? null,
      createdAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token && 
                user.resetTokenExpiry && 
                user.resetTokenExpiry > new Date(),
    );
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated: User = {
      ...user,
      ...updates,
    };
    this.users.set(id, updated);
    return updated;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updated: User = {
      ...user,
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    };
    this.users.set(userId, updated);
    return true;
  }

  // Alarm methods
  async getAlarms(userId: string): Promise<Alarm[]> {
    return Array.from(this.alarms.values()).filter(
      (alarm) => alarm.userId === userId,
    );
  }

  async getUserAlarms(userId: string): Promise<Alarm[]> {
    return this.getAlarms(userId);
  }

  async getAlarm(id: string): Promise<Alarm | undefined> {
    return this.alarms.get(id);
  }

  async createAlarm(userId: string, insertAlarm: InsertAlarm): Promise<Alarm> {
    const id = randomUUID();
    const now = new Date();
    const alarm: Alarm = {
      ...insertAlarm,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    } as Alarm;
    this.alarms.set(id, alarm);
    return alarm;
  }

  async updateAlarm(
    id: string,
    updates: Partial<InsertAlarm & { lastTriggered?: Date; snoozeUntil?: Date | null }>
  ): Promise<Alarm | undefined> {
    const alarm = this.alarms.get(id);
    if (!alarm) return undefined;
    const updated: Alarm = {
      ...alarm,
      ...updates,
      updatedAt: new Date(),
    };
    this.alarms.set(id, updated);
    return updated;
  }

  async deleteAlarm(id: string): Promise<boolean> {
    return this.alarms.delete(id);
  }

  // Note methods
  async getNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId,
    );
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    return this.getNotes(userId);
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(userId: string, insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const note: Note = {
      ...insertNote,
      id,
      userId,
      tags: insertNote.tags ?? "[]",
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<InsertNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    const updated: Note = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };
    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    return this.getTasks(userId);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(userId: string, insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      userId,
      completed: insertTask.completed ?? false,
      priority: insertTask.priority ?? "medium",
      category: insertTask.category ?? "general",
      tags: insertTask.tags ?? "[]",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated: Task = {
      ...task,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.completed && !task.completed ? new Date() : task.completedAt,
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  // UserStats methods
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(
      (stats) => stats.userId === userId,
    );
  }

  async createUserStats(userId: string, insertStats: InsertUserStats): Promise<UserStats> {
    const id = randomUUID();
    const now = new Date();
    const stats: UserStats = {
      ...insertStats,
      id,
      userId,
      name: insertStats.name ?? "Student",
      level: insertStats.level ?? "1",
      xp: insertStats.xp ?? "0",
      coins: insertStats.coins ?? "0",
      streak: insertStats.streak ?? "0",
      totalStudyTime: insertStats.totalStudyTime ?? "0",
      tasksCompleted: insertStats.tasksCompleted ?? "0",
      lastActiveDate: insertStats.lastActiveDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.userStats.set(userId, stats);
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const stats = await this.getUserStats(userId);
    if (!stats) return undefined;
    const updated: UserStats = {
      ...stats,
      ...updates,
      updatedAt: new Date(),
    };
    this.userStats.set(userId, updated);
    return updated;
  }

  async getGlobalLeaderboard(limit: number = 100): Promise<UserStats[]> {
    const allStats = Array.from(this.userStats.values());
    // Sort by XP in descending order
    return allStats
      .sort((a, b) => parseInt(b.xp) - parseInt(a.xp))
      .slice(0, limit);
  }

  // ShopItem methods
  async getShopItems(): Promise<ShopItem[]> {
    return Array.from(this.shopItems.values());
  }

  async getShopItem(id: string): Promise<ShopItem | undefined> {
    return this.shopItems.get(id);
  }

  async createShopItem(insertItem: InsertShopItem): Promise<ShopItem> {
    const id = randomUUID();
    const now = new Date();
    const item: ShopItem = {
      ...insertItem,
      id,
      effectType: insertItem.effectType ?? null,
      effectValue: insertItem.effectValue ?? null,
      createdAt: now,
    };
    this.shopItems.set(id, item);
    return item;
  }

  // UserInventory methods
  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return Array.from(this.userInventory.values()).filter(
      (item) => item.userId === userId,
    );
  }

  async getInventoryItem(id: string): Promise<UserInventory | undefined> {
    return this.userInventory.get(id);
  }

  async addToInventory(userId: string, insertItem: InsertUserInventory): Promise<UserInventory> {
    const id = randomUUID();
    const now = new Date();
    const item: UserInventory = {
      ...insertItem,
      id,
      userId,
      quantity: insertItem.quantity ?? "1",
      isActive: insertItem.isActive ?? false,
      purchasedAt: now,
      expiresAt: insertItem.expiresAt ?? null,
    };
    this.userInventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertUserInventory>): Promise<UserInventory | undefined> {
    const item = this.userInventory.get(id);
    if (!item) return undefined;
    const updated: UserInventory = {
      ...item,
      ...updates,
    };
    this.userInventory.set(id, updated);
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.userInventory.delete(id);
  }

  // FocusSession methods
  async getFocusSessions(userId: string): Promise<FocusSession[]> {
    return Array.from(this.focusSessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async getFocusSession(id: string): Promise<FocusSession | undefined> {
    return this.focusSessions.get(id);
  }

  async createFocusSession(userId: string, insertSession: InsertFocusSession): Promise<FocusSession> {
    const id = randomUUID();
    const now = new Date();
    const session: FocusSession = {
      ...insertSession,
      id,
      userId,
      isCompleted: insertSession.isCompleted ?? false,
      taskId: insertSession.taskId ?? null,
      xpEarned: insertSession.xpEarned ?? "0",
      coinsEarned: insertSession.coinsEarned ?? "0",
      startedAt: insertSession.startedAt ?? now,
      completedAt: insertSession.completedAt ?? null,
    };
    this.focusSessions.set(id, session);
    return session;
  }

  async updateFocusSession(id: string, updates: Partial<InsertFocusSession>): Promise<FocusSession | undefined> {
    const session = this.focusSessions.get(id);
    if (!session) return undefined;
    const updated: FocusSession = {
      ...session,
      ...updates,
    };
    this.focusSessions.set(id, updated);
    return updated;
  }

  // Friend methods
  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.id !== currentUserId && 
        user.username.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10); // Limit to 10 results
  }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    // Check if request already exists
    const existingRequest = Array.from(this.friendRequests.values()).find(
      req => (req.senderId === senderId && req.receiverId === receiverId && req.status === "pending") ||
             (req.senderId === receiverId && req.receiverId === senderId && req.status === "pending")
    );
    
    if (existingRequest) {
      throw new Error("Friend request already exists");
    }

    // Check if already friends
    const existingFriendship = Array.from(this.friendships.values()).find(
      f => (f.userId === senderId && f.friendId === receiverId) ||
           (f.userId === receiverId && f.friendId === senderId)
    );
    
    if (existingFriendship) {
      throw new Error("Already friends");
    }

    const id = randomUUID();
    const now = new Date();
    const request: FriendRequest = {
      id,
      senderId,
      receiverId,
      status: "pending",
      createdAt: now,
      respondedAt: null,
    };
    this.friendRequests.set(id, request);
    return request;
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    return Array.from(this.friendRequests.values()).filter(
      req => req.receiverId === userId && req.status === "pending"
    );
  }

  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    return Array.from(this.friendRequests.values()).filter(
      req => req.senderId === userId && req.status === "pending"
    );
  }

  async getPendingFriendRequestsForUser(userId: string): Promise<FriendRequest[]> {
    return Array.from(this.friendRequests.values()).filter(
      req => (req.senderId === userId || req.receiverId === userId) && req.status === "pending"
    );
  }

  async getFriendRequest(id: string): Promise<FriendRequest | undefined> {
    return this.friendRequests.get(id);
  }

  async acceptFriendRequest(requestId: string): Promise<Friendship | undefined> {
    const request = this.friendRequests.get(requestId);
    if (!request || request.status !== "pending") return undefined;

    // Update request status
    const now = new Date();
    request.status = "accepted";
    request.respondedAt = now;
    this.friendRequests.set(requestId, request);

    // Create friendship (bidirectional - create one entry)
    const friendshipId = randomUUID();
    const friendship: Friendship = {
      id: friendshipId,
      userId: request.receiverId,
      friendId: request.senderId,
      status: "accepted",
      createdAt: now,
      acceptedAt: now,
    };
    this.friendships.set(friendshipId, friendship);

    return friendship;
  }

  async rejectFriendRequest(requestId: string): Promise<boolean> {
    const request = this.friendRequests.get(requestId);
    if (!request || request.status !== "pending") return false;

    request.status = "rejected";
    request.respondedAt = new Date();
    this.friendRequests.set(requestId, request);
    return true;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendIds = new Set<string>();
    
    // Get all friendships where user is involved
    Array.from(this.friendships.values()).forEach(friendship => {
      if (friendship.status === "accepted") {
        if (friendship.userId === userId) {
          friendIds.add(friendship.friendId);
        } else if (friendship.friendId === userId) {
          friendIds.add(friendship.userId);
        }
      }
    });

    // Get user objects for all friends
    const friends: User[] = [];
    for (const friendId of friendIds) {
      const user = await this.getUser(friendId);
      if (user) friends.push(user);
    }
    return friends;
  }

  async getUserFriends(userId: string): Promise<User[]> {
    return this.getFriends(userId);
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const friendship = Array.from(this.friendships.values()).find(
      f => (f.userId === userId && f.friendId === friendId) ||
           (f.userId === friendId && f.friendId === userId)
    );
    
    if (!friendship) return false;
    return this.friendships.delete(friendship.id);
  }
}

// Switch between MemStorage and DbStorage based on environment
// Use DATABASE_URL environment variable to determine if database is available
import { DbStorage } from "./db-storage";

export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();

// Log which storage is being used
console.log(`🗄️  Using ${process.env.DATABASE_URL ? 'Database' : 'In-Memory'} storage`);
