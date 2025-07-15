import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  integer,
  boolean,
  date,
  primaryKey,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  password: varchar("password"), // For custom users (not Replit users)
  role: varchar("role").default("member"), // admin, editor, member
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false), // Email verification status
  loginCount: integer("login_count").default(0),
  lastLoginAt: timestamp("last_login_at"),
  // Onboarding form fields
  firstLoginCompleted: boolean("first_login_completed").default(false),
  location: jsonb("location"), // { country, city, latitude, longitude }
  onboardingResponses: jsonb("onboarding_responses"), // Store form responses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(), // 'account_verification', 'account_deletion'
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Themes table
export const themes = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  colorHex: varchar("color_hex", { length: 7 }).default("#3B82F6"), // Default blue color
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  themeId: uuid("theme_id"), // Reference to theme
  projectType: varchar("project_type", { length: 50 }).default("main"), // main, template
  isTemplate: boolean("is_template").default(false),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_projects_type").on(table.projectType),
  index("idx_projects_sort").on(table.sortOrder),
]);

// Episodes table
export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  episodeNumber: integer("episode_number").notNull(),
  description: text("description"),
  broadcastDate: date("broadcast_date"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scripts table
export const scripts = pgTable("scripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  authorId: varchar("author_id").notNull(), // Changed from uuid to varchar to match users table
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  reviewComments: text("review_comments"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Topics table
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Script-Topic junction table
export const scriptTopics = pgTable("script_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  scriptId: uuid("script_id").notNull(),
  topicId: uuid("topic_id").notNull(),
});

// Radio Stations table
export const radioStations = pgTable("radio_stations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Free Project Access table
export const freeProjectAccess = pgTable("free_project_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  radioStationId: uuid("radio_station_id").notNull(),
  projectId: uuid("project_id").notNull(),
  grantedByUserId: uuid("granted_by_user_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// File Folders table for better organization
export const fileFolders = pgTable("file_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentFolderId: uuid("parent_folder_id"), // For nested folders
  entityType: varchar("entity_type", { length: 50 }).notNull(), // projects, episodes, scripts
  entityId: uuid("entity_id").notNull(),
  folderPath: text("folder_path"), // Full path for optimization
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_folders_entity").on(table.entityType, table.entityId),
  index("idx_folders_parent").on(table.parentFolderId),
  index("idx_folders_path").on(table.folderPath),
]);

// Enhanced Files table for storing uploaded files
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data
  entityType: varchar("entity_type", { length: 50 }).notNull(), // projects, episodes, scripts, radio-stations
  entityId: uuid("entity_id"), // Link to specific entity
  folderId: uuid("folder_id"), // Optional: organize in folders
  uploadedBy: varchar("uploaded_by"), // User who uploaded (non-UUID user ID)
  sortOrder: integer("sort_order").default(0), // For manual reordering
  tags: text("tags").array(), // For better categorization and search
  description: text("description"), // Optional file description
  version: integer("version").default(1), // For file versioning
  isArchived: boolean("is_archived").default(false), // For archiving old versions
  isActive: boolean("is_active").default(true), // For soft delete
  filePath: text("file_path"), // Virtual file path for organization
  checksum: varchar("checksum", { length: 64 }), // For duplicate detection
  accessLevel: varchar("access_level", { length: 20 }).default("project"), // project, public, private
  downloadCount: integer("download_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_files_entity").on(table.entityType, table.entityId),
  index("idx_files_folder").on(table.folderId),
  index("idx_files_sort_order").on(table.entityType, table.entityId, table.sortOrder),
  index("idx_files_created_at").on(table.createdAt),
  index("idx_files_checksum").on(table.checksum),
  index("idx_files_path").on(table.filePath),
  index("idx_files_tags").on(table.tags),
]);

// Download Logs table for tracking file downloads
export const downloadLogs = pgTable("download_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id").notNull(),
  userId: varchar("user_id").notNull(), // User who downloaded
  userEmail: varchar("user_email"), // Store email for easier analytics
  userName: varchar("user_name"), // Store name for easier analytics
  userRole: varchar("user_role"), // Store role at time of download
  ipAddress: varchar("ip_address", { length: 45 }), // Support IPv4 and IPv6
  userAgent: text("user_agent"), // Browser/device info
  downloadSize: integer("download_size"), // File size at time of download
  downloadDuration: integer("download_duration"), // Time taken in milliseconds
  downloadStatus: varchar("download_status", { length: 20 }).default("completed"), // completed, failed, interrupted
  entityType: varchar("entity_type", { length: 50 }), // context: project, episode, script
  entityId: uuid("entity_id"), // context entity
  refererPage: text("referer_page"), // Which page initiated the download
  downloadedAt: timestamp("downloaded_at").defaultNow(),
}, (table) => [
  index("idx_downloads_file").on(table.fileId),
  index("idx_downloads_user").on(table.userId),
  index("idx_downloads_date").on(table.downloadedAt),
  index("idx_downloads_entity").on(table.entityType, table.entityId),
  index("idx_downloads_status").on(table.downloadStatus),
]);

// Notifications table for admin notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(), // Admin user who receives the notification
  type: varchar("type", { length: 50 }).notNull(), // 'user_verification_request', 'user_registered', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedUserId: varchar("related_user_id"), // User who triggered the notification
  relatedUserEmail: varchar("related_user_email"), // Email of user who triggered the notification
  relatedUserName: varchar("related_user_name"), // Name of user who triggered the notification
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  actionUrl: varchar("action_url", { length: 500 }), // URL to take action on the notification
  metadata: jsonb("metadata"), // Additional data related to the notification
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_type").on(table.type),
  index("idx_notifications_read").on(table.isRead),
  index("idx_notifications_created").on(table.createdAt),
  index("idx_notifications_priority").on(table.priority),
]);

// Onboarding Form Configuration table
export const onboardingFormConfig = pgTable("onboarding_form_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  questions: jsonb("questions").notNull(), // Array of question objects
  createdBy: varchar("created_by").notNull(), // Admin who created the form
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_form_version").on(table.version),
  index("idx_onboarding_form_active").on(table.isActive),
  index("idx_onboarding_form_created").on(table.createdAt),
]);

// Onboarding Form Responses table (for detailed analytics)
export const onboardingFormResponses = pgTable("onboarding_form_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  formConfigId: uuid("form_config_id").notNull(),
  questionId: varchar("question_id").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(), // radio, checkbox, text
  questionLabel: text("question_label").notNull(),
  response: jsonb("response").notNull(), // Single value or array for multiple choice
  isCompulsory: boolean("is_compulsory").default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_responses_user").on(table.userId),
  index("idx_onboarding_responses_form").on(table.formConfigId),
  index("idx_onboarding_responses_question").on(table.questionId),
  index("idx_onboarding_responses_submitted").on(table.submittedAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scripts: many(scripts),
  radioStations: many(radioStations),
  grantedAccess: many(freeProjectAccess),
  otpVerifications: many(otpVerifications),
  notifications: many(notifications),
  onboardingResponses: many(onboardingFormResponses),
}));

export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
  user: one(users, {
    fields: [otpVerifications.userId],
    references: [users.id],
  }),
}));

export const themesRelations = relations(themes, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  theme: one(themes, {
    fields: [projects.themeId],
    references: [themes.id],
  }),
  episodes: many(episodes),
  scripts: many(scripts),
  freeAccess: many(freeProjectAccess),
  folders: many(fileFolders),
}));

export const episodesRelations = relations(episodes, ({ one }) => ({
  project: one(projects, {
    fields: [episodes.projectId],
    references: [projects.id],
  }),
}));

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  project: one(projects, {
    fields: [scripts.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [scripts.authorId],
    references: [users.id],
  }),
  scriptTopics: many(scriptTopics),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  scriptTopics: many(scriptTopics),
}));

export const scriptTopicsRelations = relations(scriptTopics, ({ one }) => ({
  script: one(scripts, {
    fields: [scriptTopics.scriptId],
    references: [scripts.id],
  }),
  topic: one(topics, {
    fields: [scriptTopics.topicId],
    references: [topics.id],
  }),
}));

export const radioStationsRelations = relations(radioStations, ({ one, many }) => ({
  associatedUser: one(users, {
    fields: [radioStations.userId],
    references: [users.id],
  }),
  freeAccess: many(freeProjectAccess),
}));

export const freeProjectAccessRelations = relations(freeProjectAccess, ({ one }) => ({
  radioStation: one(radioStations, {
    fields: [freeProjectAccess.radioStationId],
    references: [radioStations.id],
  }),
  project: one(projects, {
    fields: [freeProjectAccess.projectId],
    references: [projects.id],
  }),
  grantedBy: one(users, {
    fields: [freeProjectAccess.grantedByUserId],
    references: [users.id],
  }),
}));

// File Folders Relations
export const fileFoldersRelations = relations(fileFolders, ({ one, many }) => ({
  parentFolder: one(fileFolders, {
    fields: [fileFolders.parentFolderId],
    references: [fileFolders.id],
  }),
  subfolders: many(fileFolders),
  files: many(files),
}));

// Files Relations
export const filesRelations = relations(files, ({ one, many }) => ({
  folder: one(fileFolders, {
    fields: [files.folderId],
    references: [fileFolders.id],
  }),
  uploader: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
  downloadLogs: many(downloadLogs),
}));

// Download Logs Relations
export const downloadLogsRelations = relations(downloadLogs, ({ one }) => ({
  file: one(files, {
    fields: [downloadLogs.fileId],
    references: [files.id],
  }),
  user: one(users, {
    fields: [downloadLogs.userId],
    references: [users.id],
  }),
}));

// Notifications Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [notifications.relatedUserId],
    references: [users.id],
  }),
}));

// Onboarding Form Config Relations
export const onboardingFormConfigRelations = relations(onboardingFormConfig, ({ one, many }) => ({
  creator: one(users, {
    fields: [onboardingFormConfig.createdBy],
    references: [users.id],
  }),
  responses: many(onboardingFormResponses),
}));

// Onboarding Form Responses Relations
export const onboardingFormResponsesRelations = relations(onboardingFormResponses, ({ one }) => ({
  user: one(users, {
    fields: [onboardingFormResponses.userId],
    references: [users.id],
  }),
  formConfig: one(onboardingFormConfig, {
    fields: [onboardingFormResponses.formConfigId],
    references: [onboardingFormConfig.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  authorId: true, // Remove author from form input - will be set server-side
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertRadioStationSchema = createInsertSchema(radioStations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFreeProjectAccessSchema = createInsertSchema(freeProjectAccess).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileFolderSchema = createInsertSchema(fileFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  createdAt: true,
});

export const insertDownloadLogSchema = createInsertSchema(downloadLogs).omit({
  id: true,
  downloadedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertOnboardingFormConfigSchema = createInsertSchema(onboardingFormConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingFormResponseSchema = createInsertSchema(onboardingFormResponses).omit({
  id: true,
  submittedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof insertUserSchema._type;
export type UpsertUser = typeof upsertUserSchema._type;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof insertThemeSchema._type;

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof insertProjectSchema._type;

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = typeof insertEpisodeSchema._type;

export type Script = typeof scripts.$inferSelect;
export type InsertScript = typeof insertScriptSchema._type;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof insertTopicSchema._type;

export type RadioStation = typeof radioStations.$inferSelect;
export type InsertRadioStation = typeof insertRadioStationSchema._type;

export type FreeProjectAccess = typeof freeProjectAccess.$inferSelect;
export type InsertFreeProjectAccess = typeof insertFreeProjectAccessSchema._type;

export type File = typeof files.$inferSelect;
export type InsertFile = typeof insertFileSchema._type;

export type FileFolder = typeof fileFolders.$inferSelect;
export type InsertFileFolder = typeof insertFileFolderSchema._type;

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = typeof insertOtpVerificationSchema._type;

export type DownloadLog = typeof downloadLogs.$inferSelect;
export type InsertDownloadLog = typeof insertDownloadLogSchema._type;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof insertNotificationSchema._type;
