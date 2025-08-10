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
import { eq, desc, and, sql, like, or, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUsersPendingVerification(): Promise<User[]>;
  verifyUser(id: string): Promise<User>;
  suspendUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
  getAdminUsers(): Promise<User[]>;

  // Themes
  getTheme(id: string): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: string, theme: Partial<InsertTheme>): Promise<Theme>;
  deleteTheme(id: string): Promise<void>;
  getAllThemes(): Promise<Theme[]>;
  getActiveThemes(): Promise<Theme[]>;
  getProjectsByTheme(themeId: string): Promise<Project[]>;

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
  getScriptsByLanguage(language: string): Promise<Script[]>;
  getScriptsByProject(projectId: string): Promise<Script[]>;
  getScriptsByLanguageGroup(languageGroup: string): Promise<Script[]>;
  getTranslationsForScript(scriptId: string): Promise<Script[]>;
  getScriptWithTranslations(scriptId: string): Promise<{ script: Script; translations: Script[] } | undefined>;

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
  getAllRadioStations(limit?: number, offset?: number): Promise<RadioStation[]>;

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
  getAllFiles(limit?: number, offset?: number): Promise<File[]>;
  getFilesByEntity(entityType: string, entityId: string): Promise<File[]>;
  getFileCount(): Promise<number>;
  reorderFiles(entityType: string, entityId: string | null, fileIds: string[]): Promise<void>;
  searchFiles(query: string, entityType?: string, entityId?: string): Promise<File[]>;

  // File Folders
  getFileFolder(id: string): Promise<FileFolder | undefined>;
  createFileFolder(folder: InsertFileFolder): Promise<FileFolder>;
  updateFileFolder(id: string, folder: Partial<InsertFileFolder>): Promise<FileFolder>;
  deleteFileFolder(id: string): Promise<void>;
  getFoldersByEntity(entityType: string, entityId: string): Promise<FileFolder[]>;
  getFoldersByParent(parentFolderId?: string): Promise<FileFolder[]>;

  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
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

  async getUsersPendingVerification(): Promise<User[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(users)
      .where(and(eq(users.isVerified, false), eq(users.role, "member")))
      .orderBy(desc(users.createdAt));
  }

  async verifyUser(id: string): Promise<User> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance
      .update(users)
      .set({ isVerified: true, isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async suspendUser(id: string): Promise<User> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async activateUser(id: string): Promise<User> {
    const dbInstance = requireDatabase();
    const [user] = await dbInstance
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAdminUsers(): Promise<User[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(users).where(eq(users.role, "admin"));
  }

  // Themes
  async getTheme(id: string): Promise<Theme | undefined> {
    const dbInstance = requireDatabase();
    const [theme] = await dbInstance.select().from(themes).where(eq(themes.id, id));
    return theme || undefined;
  }

  async createTheme(themeData: InsertTheme): Promise<Theme> {
    const dbInstance = requireDatabase();
    const [theme] = await dbInstance.insert(themes).values(themeData).returning();
    return theme;
  }

  async updateTheme(id: string, themeData: Partial<InsertTheme>): Promise<Theme> {
    const dbInstance = requireDatabase();
    const [theme] = await dbInstance
      .update(themes)
      .set({ ...themeData, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();
    return theme;
  }

  async deleteTheme(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(themes).where(eq(themes.id, id));
  }

  async getAllThemes(): Promise<Theme[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(themes).orderBy(asc(themes.name));
  }

  async getActiveThemes(): Promise<Theme[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(themes).orderBy(asc(themes.name));
  }

  async getProjectsByTheme(themeId: string): Promise<Project[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(projects).where(eq(projects.themeId, themeId));
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const dbInstance = requireDatabase();
    const [project] = await dbInstance.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const dbInstance = requireDatabase();
    const [project] = await dbInstance.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const dbInstance = requireDatabase();
    const [project] = await dbInstance
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(projects).where(eq(projects.id, id));
  }

  async getAllProjects(): Promise<Project[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(projects).orderBy(desc(projects.createdAt));
  }

  // Episodes
  async getEpisode(id: string): Promise<Episode | undefined> {
    const dbInstance = requireDatabase();
    const [episode] = await dbInstance.select().from(episodes).where(eq(episodes.id, id));
    return episode || undefined;
  }

  async createEpisode(episodeData: InsertEpisode): Promise<Episode> {
    const dbInstance = requireDatabase();
    const [episode] = await dbInstance.insert(episodes).values(episodeData).returning();
    return episode;
  }

  async updateEpisode(id: string, episodeData: Partial<InsertEpisode>): Promise<Episode> {
    const dbInstance = requireDatabase();
    const [episode] = await dbInstance
      .update(episodes)
      .set({ ...episodeData, updatedAt: new Date() })
      .where(eq(episodes.id, id))
      .returning();
    return episode;
  }

  async deleteEpisode(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(episodes).where(eq(episodes.id, id));
  }

  async getAllEpisodes(): Promise<Episode[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(episodes).orderBy(desc(episodes.createdAt));
  }

  async getEpisodesByProject(projectId: string): Promise<Episode[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(episodes)
      .where(eq(episodes.projectId, projectId))
      .orderBy(asc(episodes.title));
  }

  // Scripts
  async getScript(id: string): Promise<Script | undefined> {
    const dbInstance = requireDatabase();
    const [script] = await dbInstance.select().from(scripts).where(eq(scripts.id, id));
    return script || undefined;
  }

  async createScript(scriptData: InsertScript): Promise<Script> {
    const dbInstance = requireDatabase();
    try {
      const [script] = await dbInstance.insert(scripts).values(scriptData).returning();
      return script;
    } catch (error) {
      console.error('Error creating script:', error);
      throw new Error('Failed to create script');
    }
  }

  async updateScript(id: string, scriptData: Partial<InsertScript>): Promise<Script> {
    const dbInstance = requireDatabase();
    const [script] = await dbInstance
      .update(scripts)
      .set({ ...scriptData, updatedAt: new Date() })
      .where(eq(scripts.id, id))
      .returning();
    return script;
  }

  async deleteScript(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(scripts).where(eq(scripts.id, id));
  }

  async getAllScripts(): Promise<Script[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(scripts).orderBy(desc(scripts.createdAt));
  }

  async getScriptsByLanguage(language: string): Promise<Script[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(scripts)
      .where(eq(scripts.language, language))
      .orderBy(desc(scripts.createdAt));
  }

  async getScriptsByProject(projectId: string): Promise<Script[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(scripts)
      .where(eq(scripts.projectId, projectId))
      .orderBy(desc(scripts.createdAt));
  }

  async getScriptsByLanguageGroup(languageGroup: string): Promise<Script[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(scripts)
      .where(eq(scripts.languageGroup, languageGroup))
      .orderBy(desc(scripts.createdAt));
  }

  async getTranslationsForScript(scriptId: string): Promise<Script[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(scripts)
      .where(eq(scripts.originalScriptId, scriptId))
      .orderBy(desc(scripts.createdAt));
  }

  async getScriptWithTranslations(scriptId: string): Promise<{ script: Script; translations: Script[] } | undefined> {
    const dbInstance = requireDatabase();

    // Get the original script
    const script = await this.getScript(scriptId);
    if (!script) return undefined;

    // Get all translations
    const translations = await this.getTranslationsForScript(scriptId);

    return { script, translations };
  }

  // Topics
  async getTopic(id: string): Promise<Topic | undefined> {
    const dbInstance = requireDatabase();
    const [topic] = await dbInstance.select().from(topics).where(eq(topics.id, id));
    return topic || undefined;
  }

  async createTopic(topicData: InsertTopic): Promise<Topic> {
    const dbInstance = requireDatabase();
    const [topic] = await dbInstance.insert(topics).values(topicData).returning();
    return topic;
  }

  async updateTopic(id: string, topicData: Partial<InsertTopic>): Promise<Topic> {
    const dbInstance = requireDatabase();
    const [topic] = await dbInstance
      .update(topics)
      .set({ ...topicData, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning();
    return topic;
  }

  async deleteTopic(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(topics).where(eq(topics.id, id));
  }

  async getAllTopics(): Promise<Topic[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(topics).orderBy(asc(topics.name));
  }

  // Radio Stations
  async getRadioStation(id: string): Promise<RadioStation | undefined> {
    const dbInstance = requireDatabase();
    const [station] = await dbInstance.select().from(radioStations).where(eq(radioStations.id, id));
    return station || undefined;
  }

  async createRadioStation(stationData: InsertRadioStation): Promise<RadioStation> {
    const dbInstance = requireDatabase();
    const [station] = await dbInstance.insert(radioStations).values(stationData).returning();
    return station;
  }

  async updateRadioStation(id: string, stationData: Partial<InsertRadioStation>): Promise<RadioStation> {
    const dbInstance = requireDatabase();
    const [station] = await dbInstance
      .update(radioStations)
      .set({ ...stationData, updatedAt: new Date() })
      .where(eq(radioStations.id, id))
      .returning();
    return station;
  }

  async deleteRadioStation(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(radioStations).where(eq(radioStations.id, id));
  }

  async getAllRadioStations(limit?: number, offset?: number): Promise<RadioStation[]> {
    const dbInstance = requireDatabase();
    let query = dbInstance.select().from(radioStations).orderBy(asc(radioStations.name));
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
    const dbInstance = requireDatabase();
    const [access] = await dbInstance.select().from(freeProjectAccess).where(eq(freeProjectAccess.id, id));
    return access || undefined;
  }

  async createFreeProjectAccess(accessData: InsertFreeProjectAccess): Promise<FreeProjectAccess> {
    const dbInstance = requireDatabase();
    const [access] = await dbInstance.insert(freeProjectAccess).values(accessData).returning();
    return access;
  }

  async updateFreeProjectAccess(id: string, accessData: Partial<InsertFreeProjectAccess>): Promise<FreeProjectAccess> {
    const dbInstance = requireDatabase();
    const [access] = await dbInstance
      .update(freeProjectAccess)
      .set({ ...accessData, updatedAt: new Date() })
      .where(eq(freeProjectAccess.id, id))
      .returning();
    return access;
  }

  async deleteFreeProjectAccess(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(freeProjectAccess).where(eq(freeProjectAccess.id, id));
  }

  async getAllFreeProjectAccess(): Promise<FreeProjectAccess[]> {
    const dbInstance = requireDatabase();
    return await dbInstance.select().from(freeProjectAccess).orderBy(desc(freeProjectAccess.createdAt));
  }

  // Files
  async getFile(id: string): Promise<File | undefined> {
    const dbInstance = requireDatabase();
    const [file] = await dbInstance.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const dbInstance = requireDatabase();
    const [file] = await dbInstance.insert(files).values(fileData).returning();
    return file;
  }

  async updateFile(id: string, fileData: Partial<InsertFile>): Promise<File> {
    const dbInstance = requireDatabase();
    const [file] = await dbInstance
      .update(files)
      .set({ ...fileData, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(files).where(eq(files.id, id));
  }

  async getAllFiles(limit?: number, offset?: number): Promise<File[]> {
    const dbInstance = requireDatabase();
    let query = dbInstance.select().from(files).orderBy(desc(files.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }
    return await query;
  }

  async getFilesByEntity(entityType: string, entityId: string): Promise<File[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(files)
      .where(and(eq(files.entityType, entityType), eq(files.entityId, entityId)))
      .orderBy(asc(files.sortOrder), desc(files.createdAt));
  }

  async getFileCount(): Promise<number> {
    const dbInstance = requireDatabase();
    const [result] = await dbInstance.select({ count: sql<number>`count(*)` }).from(files);
    return result.count;
  }

  async reorderFiles(entityType: string, entityId: string | null, fileIds: string[]): Promise<void> {
    const dbInstance = requireDatabase();

    for (let i = 0; i < fileIds.length; i++) {
      await dbInstance
        .update(files)
        .set({ sortOrder: i + 1 })
        .where(eq(files.id, fileIds[i]));
    }
  }

  async searchFiles(query: string, entityType?: string, entityId?: string): Promise<File[]> {
    const dbInstance = requireDatabase();
    let conditions = [
      or(
        like(files.filename, `%${query}%`),
        like(files.originalName, `%${query}%`)
      )
    ];

    if (entityType) {
      conditions.push(eq(files.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(files.entityId, entityId));
    }

    return await dbInstance
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.createdAt));
  }

  // File Folders
  async getFileFolder(id: string): Promise<FileFolder | undefined> {
    const dbInstance = requireDatabase();
    const [folder] = await dbInstance.select().from(fileFolders).where(eq(fileFolders.id, id));
    return folder || undefined;
  }

  async createFileFolder(folderData: InsertFileFolder): Promise<FileFolder> {
    const dbInstance = requireDatabase();
    const [folder] = await dbInstance.insert(fileFolders).values(folderData).returning();
    return folder;
  }

  async updateFileFolder(id: string, folderData: Partial<InsertFileFolder>): Promise<FileFolder> {
    const dbInstance = requireDatabase();
    const [folder] = await dbInstance
      .update(fileFolders)
      .set({ ...folderData, updatedAt: new Date() })
      .where(eq(fileFolders.id, id))
      .returning();
    return folder;
  }

  async deleteFileFolder(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(fileFolders).where(eq(fileFolders.id, id));
  }

  async getFoldersByEntity(entityType: string, entityId: string): Promise<FileFolder[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(fileFolders)
      .where(and(eq(fileFolders.entityType, entityType), eq(fileFolders.entityId, entityId)))
      .orderBy(asc(fileFolders.name));
  }

  async getFoldersByParent(parentFolderId?: string): Promise<FileFolder[]> {
    const dbInstance = requireDatabase();
    const condition = parentFolderId 
      ? eq(fileFolders.parentFolderId, parentFolderId)
      : eq(fileFolders.parentFolderId, sql`null`);
    return await dbInstance
      .select()
      .from(fileFolders)
      .where(condition)
      .orderBy(asc(fileFolders.name));
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    const dbInstance = requireDatabase();
    const [notification] = await dbInstance.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const dbInstance = requireDatabase();
    const [notification] = await dbInstance.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async updateNotification(id: string, notificationData: Partial<InsertNotification>): Promise<Notification> {
    const dbInstance = requireDatabase();
    const [notification] = await dbInstance
      .update(notifications)
      .set({ ...notificationData, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance.delete(notifications).where(eq(notifications.id, id));
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const dbInstance = requireDatabase();
    return await dbInstance
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const dbInstance = requireDatabase();
    const [notification] = await dbInstance
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const dbInstance = requireDatabase();
    await dbInstance
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }
}

export class FallbackStorage implements IStorage {
  private tempUsers: User[] = [
    {
      id: "temp-admin-001",
      email: "admin@example.com",
      username: "admin",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      profileImageUrl: null,
      isVerified: true,
      loginCount: 0,
      firstLoginCompleted: true,
      location: null,
      onboardingResponses: null,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private throwDatabaseError(): never {
    throw new Error("Database is not available. Please provision a PostgreSQL database to use this feature.");
  }

  // Users - implement basic functionality for authentication
  async getUser(id: string): Promise<User | undefined> { 
    return this.tempUsers.find(u => u.id === id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> { 
    return this.tempUsers.find(u => u.username === username || u.email === username);
  }
  async upsertUser(user: UpsertUser): Promise<User> { return this.throwDatabaseError(); }
  async createUser(user: InsertUser): Promise<User> { return this.throwDatabaseError(); }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> { return this.throwDatabaseError(); }
  async deleteUser(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllUsers(limit?: number, offset?: number): Promise<User[]> { 
    console.log("FallbackStorage: getAllUsers called, returning temp users:", this.tempUsers.length);
    return this.tempUsers;
  }
  async getUsersPendingVerification(): Promise<User[]> { return this.throwDatabaseError(); }
  async verifyUser(id: string): Promise<User> { return this.throwDatabaseError(); }
  async suspendUser(id: string): Promise<User> { return this.throwDatabaseError(); }
  async activateUser(id: string): Promise<User> { return this.throwDatabaseError(); }
  async getAdminUsers(): Promise<User[]> { return this.throwDatabaseError(); }

  // Themes
  async getTheme(id: string): Promise<Theme | undefined> { return this.throwDatabaseError(); }
  async createTheme(theme: InsertTheme): Promise<Theme> { return this.throwDatabaseError(); }
  async updateTheme(id: string, theme: Partial<InsertTheme>): Promise<Theme> { return this.throwDatabaseError(); }
  async deleteTheme(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllThemes(): Promise<Theme[]> { return this.throwDatabaseError(); }
  async getActiveThemes(): Promise<Theme[]> { return this.throwDatabaseError(); }
  async getProjectsByTheme(themeId: string): Promise<Project[]> { return this.throwDatabaseError(); }

  // Projects
  async getProject(id: string): Promise<Project | undefined> { return this.throwDatabaseError(); }
  async createProject(project: InsertProject): Promise<Project> { return this.throwDatabaseError(); }
  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> { return this.throwDatabaseError(); }
  async deleteProject(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllProjects(): Promise<Project[]> { return this.throwDatabaseError(); }

  // Episodes
  async getEpisode(id: string): Promise<Episode | undefined> { return this.throwDatabaseError(); }
  async createEpisode(episode: InsertEpisode): Promise<Episode> { return this.throwDatabaseError(); }
  async updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode> { return this.throwDatabaseError(); }
  async deleteEpisode(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllEpisodes(): Promise<Episode[]> { return this.throwDatabaseError(); }
  async getEpisodesByProject(projectId: string): Promise<Episode[]> { return this.throwDatabaseError(); }

  // Scripts
  async getScript(id: string): Promise<Script | undefined> { return this.throwDatabaseError(); }
  async createScript(script: InsertScript): Promise<Script> { return this.throwDatabaseError(); }
  async updateScript(id: string, script: Partial<InsertScript>): Promise<Script> { return this.throwDatabaseError(); }
  async deleteScript(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllScripts(): Promise<Script[]> { return this.throwDatabaseError(); }
  async getScriptsByLanguage(language: string): Promise<Script[]> { return this.throwDatabaseError(); }
  async getScriptsByProject(projectId: string): Promise<Script[]> { return this.throwDatabaseError(); }
  async getScriptsByLanguageGroup(languageGroup: string): Promise<Script[]> { return this.throwDatabaseError(); }
  async getTranslationsForScript(scriptId: string): Promise<Script[]> { return this.throwDatabaseError(); }
  async getScriptWithTranslations(scriptId: string): Promise<{ script: Script; translations: Script[] } | undefined> { return this.throwDatabaseError(); }

  // Topics
  async getTopic(id: string): Promise<Topic | undefined> { return this.throwDatabaseError(); }
  async createTopic(topic: InsertTopic): Promise<Topic> { return this.throwDatabaseError(); }
  async updateTopic(id: string, topic: Partial<InsertTopic>): Promise<Topic> { return this.throwDatabaseError(); }
  async deleteTopic(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllTopics(): Promise<Topic[]> { return this.throwDatabaseError(); }

  // Radio Stations
  async getRadioStation(id: string): Promise<RadioStation | undefined> { return this.throwDatabaseError(); }
  async createRadioStation(station: InsertRadioStation): Promise<RadioStation> { return this.throwDatabaseError(); }
  async updateRadioStation(id: string, station: Partial<InsertRadioStation>): Promise<RadioStation> { return this.throwDatabaseError(); }
  async deleteRadioStation(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllRadioStations(limit?: number, offset?: number): Promise<RadioStation[]> { return this.throwDatabaseError(); }

  // Free Project Access
  async getFreeProjectAccess(id: string): Promise<FreeProjectAccess | undefined> { return this.throwDatabaseError(); }
  async createFreeProjectAccess(access: InsertFreeProjectAccess): Promise<FreeProjectAccess> { return this.throwDatabaseError(); }
  async updateFreeProjectAccess(id: string, access: Partial<InsertFreeProjectAccess>): Promise<FreeProjectAccess> { return this.throwDatabaseError(); }
  async deleteFreeProjectAccess(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllFreeProjectAccess(): Promise<FreeProjectAccess[]> { return this.throwDatabaseError(); }

  // Files
  async getFile(id: string): Promise<File | undefined> { return this.throwDatabaseError(); }
  async createFile(file: InsertFile): Promise<File> { return this.throwDatabaseError(); }
  async updateFile(id: string, file: Partial<InsertFile>): Promise<File> { return this.throwDatabaseError(); }
  async deleteFile(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getAllFiles(limit?: number, offset?: number): Promise<File[]> { return this.throwDatabaseError(); }
  async getFilesByEntity(entityType: string, entityId: string): Promise<File[]> { return this.throwDatabaseError(); }
  async getFileCount(): Promise<number> { return this.throwDatabaseError(); }
  async reorderFiles(entityType: string, entityId: string | null, fileIds: string[]): Promise<void> { return this.throwDatabaseError(); }
  async searchFiles(query: string, entityType?: string, entityId?: string): Promise<File[]> { return this.throwDatabaseError(); }

  // File Folders
  async getFileFolder(id: string): Promise<FileFolder | undefined> { return this.throwDatabaseError(); }
  async createFileFolder(folder: InsertFileFolder): Promise<FileFolder> { return this.throwDatabaseError(); }
  async updateFileFolder(id: string, folder: Partial<InsertFileFolder>): Promise<FileFolder> { return this.throwDatabaseError(); }
  async deleteFileFolder(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getFoldersByEntity(entityType: string, entityId: string): Promise<FileFolder[]> { return this.throwDatabaseError(); }
  async getFoldersByParent(parentFolderId?: string): Promise<FileFolder[]> { return this.throwDatabaseError(); }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> { return this.throwDatabaseError(); }
  async createNotification(notification: InsertNotification): Promise<Notification> { return this.throwDatabaseError(); }
  async updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification> { return this.throwDatabaseError(); }
  async deleteNotification(id: string): Promise<void> { return this.throwDatabaseError(); }
  async getUserNotifications(userId: string): Promise<Notification[]> { return this.throwDatabaseError(); }
  async getUnreadNotifications(userId: string): Promise<Notification[]> { return []; }
  async markNotificationAsRead(id: string): Promise<Notification> { return this.throwDatabaseError(); }
  async markAllNotificationsAsRead(userId: string): Promise<void> { return this.throwDatabaseError(); }
}

// Storage will be initialized after database check
let storage: DatabaseStorage | FallbackStorage;

export async function initializeStorage() {
  try {
    console.log("🔄 Initializing storage...");

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.log("⚠️  DATABASE_URL not found - using fallback storage");
      storage = new FallbackStorage();
      return;
    }

    // Verify database connection with a simple test
    const dbInstance = getDb();
    if (dbInstance) {
      try {
        // Test the database connection directly
        await dbInstance.execute(sql`SELECT 1 as test`);
        console.log("✅ Database connection verified");
        storage = new DatabaseStorage();
      } catch (error) {
        console.log("⚠️  Database connection failed - using fallback storage");
        console.log("Error:", error instanceof Error ? error.message : String(error));
        storage = new FallbackStorage();
      }
    } else {
      console.log("⚠️  Database not available - using fallback storage");
      storage = new FallbackStorage();
    }

    console.log("✅ Storage initialization complete");

  } catch (error) {
    console.error("❌ Failed to initialize storage:", error);
    console.log("⚠️  Using fallback storage due to error");
    storage = new FallbackStorage();
  }
}

// Export storage getter function
export function getStorage(): DatabaseStorage | FallbackStorage {
  if (!storage) {
    throw new Error("Storage not initialized. Call initializeStorage() first.");
  }
  return storage;
}

export { storage };