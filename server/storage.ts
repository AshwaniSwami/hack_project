import {
  users,
  themes,
  projects,
  episodes,
  scripts,
  topics,
  scriptTopics,
  radioStations,
  freeProjectAccess,
  files,
  fileFolders,
  notifications,
  type User,
  type InsertUser,
  type UpsertUser,
  type Theme,
  type InsertTheme,
  type Project,
  type InsertProject,
  type Episode,
  type InsertEpisode,
  type Script,
  type InsertScript,
  type Topic,
  type InsertTopic,
  type RadioStation,
  type InsertRadioStation,
  type FreeProjectAccess,
  type InsertFreeProjectAccess,
  type File,
  type InsertFile,
  type FileFolder,
  type InsertFileFolder,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db as getDb, isDatabaseAvailable, requireDatabase } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: New schema doesn't have username field, this method may not be needed
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    const dbInstance = requireDatabase();
    let query = dbInstance.select().from(users).orderBy(desc(users.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }
    return await query;
  }
}

export class FallbackStorage implements IStorage {
  private throwDatabaseError(): never {
    throw new Error("Database is not available. Please provision a PostgreSQL database to use this feature.");
  }

  async getUser(id: string): Promise<User | undefined> {
    this.throwDatabaseError();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    this.throwDatabaseError();
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    this.throwDatabaseError();
  }

  async createUser(user: InsertUser): Promise<User> {
    this.throwDatabaseError();
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    this.throwDatabaseError();
  }

  async deleteUser(id: string): Promise<void> {
    this.throwDatabaseError();
  }

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    this.throwDatabaseError();
  }
}

// Storage will be initialized after database check
let storage: DatabaseStorage | FallbackStorage;

export async function initializeStorage() {
  try {
    console.log("🔄 Initializing storage...");

    // Create tables if they don't exist
    await createTables();
    console.log("✅ Tables created/verified");

    // Verify database connection
    const testUser = await db.select().from(users).limit(1);
    console.log("✅ Database connection verified");

    // Initialize temp data if needed
    await initializeTempData();
    console.log("✅ Storage initialization complete");

  } catch (error) {
    console.error("❌ Failed to initialize storage:", error);
    console.error("Error details:", error);
    throw error;
  }
}

export { storage };