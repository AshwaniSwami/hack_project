import pkg from 'pg';
const { Pool } = pkg;

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3WpGbh4FAkMI@ep-divine-poetry-adygbcuc-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    console.log('🔄 Setting up database schema...');
    
    // Drop existing tables if they exist
    await pool.query(`
      DROP TABLE IF EXISTS "onboarding_form_responses" CASCADE;
      DROP TABLE IF EXISTS "onboarding_form_config" CASCADE;
      DROP TABLE IF EXISTS "download_logs" CASCADE;
      DROP TABLE IF EXISTS "notifications" CASCADE;
      DROP TABLE IF EXISTS "free_project_access" CASCADE;
      DROP TABLE IF EXISTS "file_folders" CASCADE;
      DROP TABLE IF EXISTS "files" CASCADE;
      DROP TABLE IF EXISTS "scripts" CASCADE;
      DROP TABLE IF EXISTS "episodes" CASCADE;
      DROP TABLE IF EXISTS "themes" CASCADE;
      DROP TABLE IF EXISTS "projects" CASCADE;
      DROP TABLE IF EXISTS "radio_stations" CASCADE;
      DROP TABLE IF EXISTS "topics" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE "users" (
        "id" varchar PRIMARY KEY,
        "email" varchar UNIQUE NOT NULL,
        "password" varchar NOT NULL,
        "firstName" varchar,
        "lastName" varchar,
        "role" varchar DEFAULT 'member',
        "isActive" boolean DEFAULT true,
        "isVerified" boolean DEFAULT false,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        "hasCompletedOnboarding" boolean DEFAULT false,
        "country" varchar,
        "city" varchar,
        "latitude" numeric,
        "longitude" numeric
      );
    `);

    // Create topics table
    await pool.query(`
      CREATE TABLE "topics" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "description" text,
        "createdAt" timestamp DEFAULT now()
      );
    `);

    // Create themes table
    await pool.query(`
      CREATE TABLE "themes" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "color" varchar NOT NULL,
        "createdAt" timestamp DEFAULT now()
      );
    `);

    // Create radio stations table
    await pool.query(`
      CREATE TABLE "radio_stations" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "frequency" varchar,
        "location" varchar,
        "contactEmail" varchar,
        "contactPhone" varchar,
        "website" varchar,
        "description" text,
        "isActive" boolean DEFAULT true,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      );
    `);

    // Create projects table
    await pool.query(`
      CREATE TABLE "projects" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "themeId" varchar,
        "targetAudience" varchar,
        "status" varchar DEFAULT 'active',
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE SET NULL
      );
    `);

    // Create episodes table
    await pool.query(`
      CREATE TABLE "episodes" (
        "id" varchar PRIMARY KEY,
        "title" varchar NOT NULL,
        "description" text,
        "duration" integer,
        "airDate" timestamp,
        "status" varchar DEFAULT 'draft',
        "projectId" varchar NOT NULL,
        "isPremium" boolean DEFAULT false,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      );
    `);

    // Create scripts table
    await pool.query(`
      CREATE TABLE "scripts" (
        "id" varchar PRIMARY KEY,
        "title" varchar NOT NULL,
        "content" text,
        "status" varchar DEFAULT 'draft',
        "projectId" varchar NOT NULL,
        "episodeId" varchar,
        "authorId" varchar NOT NULL,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
        FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE SET NULL,
        FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create file folders table
    await pool.query(`
      CREATE TABLE "file_folders" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "parentId" varchar,
        "entityType" varchar NOT NULL,
        "entityId" varchar NOT NULL,
        "createdAt" timestamp DEFAULT now(),
        FOREIGN KEY ("parentId") REFERENCES "file_folders"("id") ON DELETE CASCADE
      );
    `);

    // Create files table
    await pool.query(`
      CREATE TABLE "files" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "originalName" varchar NOT NULL,
        "size" integer NOT NULL,
        "type" varchar NOT NULL,
        "data" text NOT NULL,
        "folderId" varchar,
        "entityType" varchar NOT NULL,
        "entityId" varchar NOT NULL,
        "description" text,
        "tags" text[],
        "version" integer DEFAULT 1,
        "checksum" varchar,
        "uploadedBy" varchar NOT NULL,
        "uploadedAt" timestamp DEFAULT now(),
        "lastModified" timestamp DEFAULT now(),
        "downloadCount" integer DEFAULT 0,
        "isPublic" boolean DEFAULT false,
        "accessLevel" varchar DEFAULT 'private',
        FOREIGN KEY ("folderId") REFERENCES "file_folders"("id") ON DELETE SET NULL,
        FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create free project access table
    await pool.query(`
      CREATE TABLE "free_project_access" (
        "id" varchar PRIMARY KEY,
        "radioStationId" varchar NOT NULL,
        "projectId" varchar NOT NULL,
        "grantedAt" timestamp DEFAULT now(),
        "grantedBy" varchar NOT NULL,
        FOREIGN KEY ("radioStationId") REFERENCES "radio_stations"("id") ON DELETE CASCADE,
        FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
        FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create notifications table
    await pool.query(`
      CREATE TABLE "notifications" (
        "id" varchar PRIMARY KEY,
        "userId" varchar NOT NULL,
        "type" varchar NOT NULL,
        "title" varchar NOT NULL,
        "message" text NOT NULL,
        "priority" varchar DEFAULT 'medium',
        "isRead" boolean DEFAULT false,
        "createdAt" timestamp DEFAULT now(),
        "data" jsonb,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create download logs table
    await pool.query(`
      CREATE TABLE "download_logs" (
        "id" varchar PRIMARY KEY,
        "fileId" varchar NOT NULL,
        "userId" varchar NOT NULL,
        "ipAddress" varchar,
        "userAgent" text,
        "downloadedAt" timestamptz DEFAULT now(),
        "downloadDuration" integer,
        "status" varchar DEFAULT 'success',
        "entityType" varchar NOT NULL,
        "entityId" varchar NOT NULL,
        "projectId" varchar,
        FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create onboarding form config table
    await pool.query(`
      CREATE TABLE "onboarding_form_config" (
        "id" varchar PRIMARY KEY,
        "version" integer NOT NULL,
        "config" jsonb NOT NULL,
        "isActive" boolean DEFAULT true,
        "createdAt" timestamp DEFAULT now(),
        "createdBy" varchar NOT NULL,
        FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create onboarding form responses table
    await pool.query(`
      CREATE TABLE "onboarding_form_responses" (
        "id" varchar PRIMARY KEY,
        "userId" varchar NOT NULL,
        "formVersion" integer NOT NULL,
        "responses" jsonb NOT NULL,
        "submittedAt" timestamp DEFAULT now(),
        "ipAddress" varchar,
        "userAgent" text,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
      CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
      CREATE INDEX IF NOT EXISTS "idx_projects_theme" ON "projects"("themeId");
      CREATE INDEX IF NOT EXISTS "idx_episodes_project" ON "episodes"("projectId");
      CREATE INDEX IF NOT EXISTS "idx_scripts_project" ON "scripts"("projectId");
      CREATE INDEX IF NOT EXISTS "idx_scripts_author" ON "scripts"("authorId");
      CREATE INDEX IF NOT EXISTS "idx_files_entity" ON "files"("entityType", "entityId");
      CREATE INDEX IF NOT EXISTS "idx_files_uploaded_by" ON "files"("uploadedBy");
      CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications"("userId");
      CREATE INDEX IF NOT EXISTS "idx_download_logs_file" ON "download_logs"("fileId");
      CREATE INDEX IF NOT EXISTS "idx_download_logs_user" ON "download_logs"("userId");
      CREATE INDEX IF NOT EXISTS "idx_onboarding_responses_user" ON "onboarding_form_responses"("userId");
    `);

    console.log('✅ Database schema created successfully!');
    console.log('🔧 All tables and indexes have been set up.');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);