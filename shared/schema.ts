import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  integer,
  boolean,
  decimal,
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
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").unique(),
  name: varchar("name"),
  role: varchar("role").default("participant"), // organizer, analyzer, participant
  password: varchar("password"), // For custom users (not Replit users)
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
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

// Categories table (formerly Themes)
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  colorHex: varchar("color_hex", { length: 7 }).notNull().default("#3B82F6"), // Hex color for category
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hackathons table (formerly Projects)
export const hackathons = pgTable("hackathons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id"), // Reference to category
  submissionDeadline: timestamp("submission_deadline"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  maxTeamSize: integer("max_team_size").default(5),
  minTeamSize: integer("min_team_size").default(1),
  prizePool: varchar("prize_pool", { length: 255 }),
  rulesDescription: text("rules_description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table (formerly Episodes)
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  hackathonId: uuid("hackathon_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  teamLeaderId: varchar("team_leader_id"),
  teamSize: integer("team_size").default(1),
  registrationStatus: varchar("registration_status", { length: 50 }).default("pending"),
  collegeId: uuid("college_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_teams_hackathon").on(table.hackathonId),
  index("idx_teams_college").on(table.collegeId),
]);

// Submissions table (formerly Scripts)
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  hackathonId: uuid("hackathon_id").notNull(),
  teamId: uuid("team_id"),
  authorId: varchar("author_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  submissionType: varchar("submission_type", { length: 10 }).notNull().default("code"), // code, documentation, presentation
  originalSubmissionId: uuid("original_submission_id"),
  submissionGroup: varchar("submission_group", { length: 100 }),
  isOriginal: boolean("is_original").default(true),
  githubLink: varchar("github_link", { length: 500 }),
  demoLink: varchar("demo_link", { length: 500 }),
  evaluationScore: decimal("evaluation_score", { precision: 5, scale: 2 }),
  evaluatorId: varchar("evaluator_id"),
  evaluationComments: text("evaluation_comments"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_submissions_type").on(table.submissionType),
  index("idx_submissions_group").on(table.submissionGroup),
  index("idx_submissions_original").on(table.originalSubmissionId),
  index("idx_submissions_hackathon_type").on(table.hackathonId, table.submissionType),
  index("idx_submissions_team").on(table.teamId),
]);

// Topics table
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Submission-Topic junction table (formerly Script-Topic)
export const submissionTopics = pgTable("submission_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull(),
  topicId: uuid("topic_id").notNull(),
});

// Colleges table (formerly Radio Stations)
export const colleges = pgTable("colleges", {
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

// Free Hackathon Access table (formerly Free Project Access)
export const freeHackathonAccess = pgTable("free_hackathon_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull(),
  hackathonId: uuid("hackathon_id").notNull(),
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
  entityType: varchar("entity_type", { length: 50 }).notNull(), // hackathons, teams, submissions
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
  entityType: varchar("entity_type", { length: 50 }).notNull(), // hackathons, teams, submissions, colleges
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
  accessLevel: varchar("access_level", { length: 20 }).default("hackathon"), // hackathon, public, private
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
  entityType: varchar("entity_type", { length: 50 }), // context: hackathon, team, submission
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

// Notifications table for organizer notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(), // Organizer user who receives the notification
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
  createdBy: varchar("created_by").notNull(), // Organizer who created the form
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
  submissions: many(submissions),
  colleges: many(colleges),
  grantedAccess: many(freeHackathonAccess),
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

export const categoriesRelations = relations(categories, ({ many }) => ({
  hackathons: many(hackathons),
}));

export const hackathonsRelations = relations(hackathons, ({ one, many }) => ({
  category: one(categories, {
    fields: [hackathons.categoryId],
    references: [categories.id],
  }),
  teams: many(teams),
  submissions: many(submissions),
  freeAccess: many(freeHackathonAccess),
  folders: many(fileFolders),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  hackathon: one(hackathons, {
    fields: [teams.hackathonId],
    references: [hackathons.id],
  }),
  college: one(colleges, {
    fields: [teams.collegeId],
    references: [colleges.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  hackathon: one(hackathons, {
    fields: [submissions.hackathonId],
    references: [hackathons.id],
  }),
  team: one(teams, {
    fields: [submissions.teamId],
    references: [teams.id],
  }),
  author: one(users, {
    fields: [submissions.authorId],
    references: [users.id],
  }),
  submissionTopics: many(submissionTopics),
  originalSubmission: one(submissions, {
    fields: [submissions.originalSubmissionId],
    references: [submissions.id],
  }),
  relatedSubmissions: many(submissions),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  submissionTopics: many(submissionTopics),
}));

export const submissionTopicsRelations = relations(submissionTopics, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionTopics.submissionId],
    references: [submissions.id],
  }),
  topic: one(topics, {
    fields: [submissionTopics.topicId],
    references: [topics.id],
  }),
}));

export const collegesRelations = relations(colleges, ({ one, many }) => ({
  associatedUser: one(users, {
    fields: [colleges.userId],
    references: [users.id],
  }),
  freeAccess: many(freeHackathonAccess),
  teams: many(teams),
}));

export const freeHackathonAccessRelations = relations(freeHackathonAccess, ({ one }) => ({
  college: one(colleges, {
    fields: [freeHackathonAccess.collegeId],
    references: [colleges.id],
  }),
  hackathon: one(hackathons, {
    fields: [freeHackathonAccess.hackathonId],
    references: [hackathons.id],
  }),
  grantedBy: one(users, {
    fields: [freeHackathonAccess.grantedByUserId],
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

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHackathonSchema = createInsertSchema(hackathons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  authorId: true, // Remove author from form input - will be set server-side
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertCollegeSchema = createInsertSchema(colleges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFreeHackathonAccessSchema = createInsertSchema(freeHackathonAccess).omit({
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

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof insertCategorySchema._type;

export type Hackathon = typeof hackathons.$inferSelect;
export type InsertHackathon = typeof insertHackathonSchema._type;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof insertTeamSchema._type;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof insertSubmissionSchema._type;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof insertTopicSchema._type;

export type College = typeof colleges.$inferSelect;
export type InsertCollege = typeof insertCollegeSchema._type;

export type FreeHackathonAccess = typeof freeHackathonAccess.$inferSelect;
export type InsertFreeHackathonAccess = typeof insertFreeHackathonAccessSchema._type;

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

// Backward compatibility exports (deprecated - use new names)
export const themes = categories;
export const projects = hackathons;
export const episodes = teams;
export const scripts = submissions;
export const radioStations = colleges;
export const freeProjectAccess = freeHackathonAccess;
export const scriptTopics = submissionTopics;

export type Theme = Category;
export type Project = Hackathon;
export type Episode = Team;
export type Script = Submission;
export type RadioStation = College;
export type FreeProjectAccess = FreeHackathonAccess;

export const insertThemeSchema = insertCategorySchema;
export const insertProjectSchema = insertHackathonSchema;
export const insertEpisodeSchema = insertTeamSchema;
export const insertScriptSchema = insertSubmissionSchema;
export const insertRadioStationSchema = insertCollegeSchema;
export const insertFreeProjectAccessSchema = insertFreeHackathonAccessSchema;

export type InsertTheme = InsertCategory;
export type InsertProject = InsertHackathon;
export type InsertEpisode = InsertTeam;
export type InsertScript = InsertSubmission;
export type InsertRadioStation = InsertCollege;
