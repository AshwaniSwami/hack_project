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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  episodeId: uuid("episode_id").notNull(),
  authorId: uuid("author_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  reviewComments: text("review_comments"),
  audioFilePath: varchar("audio_file_path", { length: 500 }),
  audioLink: varchar("audio_link", { length: 500 }),
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
  name: varchar("name", { length: 255 }).notNull().unique(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
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

// Files table for storing uploaded files
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data
  entityType: varchar("entity_type", { length: 50 }).notNull(), // users, projects, episodes, scripts, radio-stations
  entityId: uuid("entity_id"), // Optional: link to specific entity
  uploadedBy: uuid("uploaded_by"), // Optional: user who uploaded
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scripts: many(scripts),
  radioStations: many(radioStations),
  grantedAccess: many(freeProjectAccess),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  episodes: many(episodes),
  freeAccess: many(freeProjectAccess),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  project: one(projects, {
    fields: [episodes.projectId],
    references: [projects.id],
  }),
  scripts: many(scripts),
}));

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  episode: one(episodes, {
    fields: [scripts.episodeId],
    references: [episodes.id],
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
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
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof insertUserSchema._type;

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
