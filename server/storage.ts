import {
  users,
  projects,
  episodes,
  scripts,
  topics,
  scriptTopics,
  radioStations,
  freeProjectAccess,
  files,
  type User,
  type InsertUser,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getAllProjects(): Promise<Project[]>;

  // Episodes
  getEpisode(id: string): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode>;
  deleteEpisode(id: string): Promise<void>;
  getAllEpisodes(): Promise<Episode[]>;
  getEpisodesByProject(projectId: string): Promise<Episode[]>;

  // Scripts
  getScript(id: string): Promise<Script | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: string, script: Partial<InsertScript>): Promise<Script>;
  deleteScript(id: string): Promise<void>;
  getAllScripts(): Promise<Script[]>;
  getScriptsByProject(projectId: string): Promise<Script[]>;

  // Topics
  getTopic(id: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, topic: Partial<InsertTopic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
  getAllTopics(): Promise<Topic[]>;

  // Radio Stations
  getRadioStation(id: string): Promise<RadioStation | undefined>;
  createRadioStation(station: InsertRadioStation): Promise<RadioStation>;
  updateRadioStation(id: string, station: Partial<InsertRadioStation>): Promise<RadioStation>;
  deleteRadioStation(id: string): Promise<void>;
  getAllRadioStations(): Promise<RadioStation[]>;

  // Free Project Access
  getFreeProjectAccess(id: string): Promise<FreeProjectAccess | undefined>;
  createFreeProjectAccess(access: InsertFreeProjectAccess): Promise<FreeProjectAccess>;
  updateFreeProjectAccess(id: string, access: Partial<InsertFreeProjectAccess>): Promise<FreeProjectAccess>;
  deleteFreeProjectAccess(id: string): Promise<void>;
  getAllFreeProjectAccess(): Promise<FreeProjectAccess[]>;

  // Files
  getFile(id: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, file: Partial<InsertFile>): Promise<File>;
  deleteFile(id: string): Promise<void>;
  getAllFiles(): Promise<File[]>;
  getFilesByEntity(entityType: string, entityId?: string): Promise<File[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: New schema doesn't have username field, this method may not be needed
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    let query = db.select().from(users).orderBy(desc(users.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }
    return await query;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  // Episodes
  async getEpisode(id: string): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode || undefined;
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const [episode] = await db.insert(episodes).values(insertEpisode).returning();
    return episode;
  }

  async updateEpisode(id: string, updateData: Partial<InsertEpisode>): Promise<Episode> {
    const [episode] = await db
      .update(episodes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(episodes.id, id))
      .returning();
    return episode;
  }

  async deleteEpisode(id: string): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }

  async getAllEpisodes(): Promise<Episode[]> {
    return await db.select().from(episodes).orderBy(desc(episodes.createdAt));
  }

  async getEpisodesByProject(projectId: string): Promise<Episode[]> {
    return await db
      .select()
      .from(episodes)
      .where(eq(episodes.projectId, projectId))
      .orderBy(desc(episodes.episodeNumber));
  }

  // Scripts
  async getScript(id: string): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script || undefined;
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const [script] = await db.insert(scripts).values(insertScript).returning();
    return script;
  }

  async updateScript(id: string, updateData: Partial<InsertScript>): Promise<Script> {
    const [script] = await db
      .update(scripts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(scripts.id, id))
      .returning();
    return script;
  }

  async deleteScript(id: string): Promise<void> {
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  async getAllScripts(): Promise<Script[]> {
    return await db.select().from(scripts).orderBy(desc(scripts.createdAt));
  }

  async getScriptsByProject(projectId: string): Promise<Script[]> {
    return await db
      .select()
      .from(scripts)
      .where(eq(scripts.projectId, projectId))
      .orderBy(desc(scripts.createdAt));
  }

  // Topics
  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic || undefined;
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(insertTopic).returning();
    return topic;
  }

  async updateTopic(id: string, updateData: Partial<InsertTopic>): Promise<Topic> {
    const [topic] = await db
      .update(topics)
      .set(updateData)
      .where(eq(topics.id, id))
      .returning();
    return topic;
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(topics).where(eq(topics.id, id));
  }

  async getAllTopics(): Promise<Topic[]> {
    return await db.select().from(topics).orderBy(topics.name);
  }

  // Radio Stations
  async getRadioStation(id: string): Promise<RadioStation | undefined> {
    const [station] = await db.select().from(radioStations).where(eq(radioStations.id, id));
    return station || undefined;
  }

  async createRadioStation(insertStation: InsertRadioStation): Promise<RadioStation> {
    const [station] = await db.insert(radioStations).values(insertStation).returning();
    return station;
  }

  async updateRadioStation(id: string, updateData: Partial<InsertRadioStation>): Promise<RadioStation> {
    const [station] = await db
      .update(radioStations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(radioStations.id, id))
      .returning();
    return station;
  }

  async deleteRadioStation(id: string): Promise<void> {
    await db.delete(radioStations).where(eq(radioStations.id, id));
  }

  async getAllRadioStations(limit?: number, offset?: number): Promise<RadioStation[]> {
    let query = db.select().from(radioStations).orderBy(desc(radioStations.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }
    return await query;
  }

  // Free Project Access
  async getFreeProjectAccess(id: string): Promise<FreeProjectAccess | undefined> {
    const [access] = await db.select().from(freeProjectAccess).where(eq(freeProjectAccess.id, id));
    return access || undefined;
  }

  async createFreeProjectAccess(insertAccess: InsertFreeProjectAccess): Promise<FreeProjectAccess> {
    const [access] = await db.insert(freeProjectAccess).values(insertAccess).returning();
    return access;
  }

  async updateFreeProjectAccess(id: string, updateData: Partial<InsertFreeProjectAccess>): Promise<FreeProjectAccess> {
    const [access] = await db
      .update(freeProjectAccess)
      .set(updateData)
      .where(eq(freeProjectAccess.id, id))
      .returning();
    return access;
  }

  async deleteFreeProjectAccess(id: string): Promise<void> {
    await db.delete(freeProjectAccess).where(eq(freeProjectAccess.id, id));
  }

  async getAllFreeProjectAccess(): Promise<FreeProjectAccess[]> {
    return await db.select().from(freeProjectAccess).orderBy(desc(freeProjectAccess.createdAt));
  }

  // Files
  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async updateFile(id: string, updateData: Partial<InsertFile>): Promise<File> {
    const [file] = await db.update(files)
      .set(updateData)
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async getAllFiles(limit?: number, offset?: number, entityType?: string): Promise<File[]> {
    let query = db.select().from(files).orderBy(desc(files.createdAt));
    if (entityType) {
      query = query.where(eq(files.entityType, entityType));
    }
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }
    return await query;
  }

  async getFileCount(entityType?: string): Promise<number> {
    let query = db.select({ count: sql`count(*)` }).from(files);
    if (entityType) {
      query = query.where(eq(files.entityType, entityType));
    }
    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async getFilesByEntity(entityType: string, entityId?: string): Promise<File[]> {
    const baseQuery = db.select().from(files);
    
    if (entityId) {
      return await baseQuery
        .where(and(eq(files.entityType, entityType), eq(files.entityId, entityId)))
        .orderBy(desc(files.createdAt));
    } else {
      return await baseQuery
        .where(eq(files.entityType, entityType))
        .orderBy(desc(files.createdAt));
    }
  }
}

export const storage = new DatabaseStorage();
