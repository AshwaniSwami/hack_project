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
        "email" varchar UNIQUE,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "username" varchar UNIQUE,
        "password" varchar,
        "role" varchar DEFAULT 'member',
        "is_active" boolean DEFAULT true,
        "is_verified" boolean DEFAULT false,
        "login_count" integer DEFAULT 0,
        "last_login_at" timestamp,
        "first_login_completed" boolean DEFAULT false,
        "location" jsonb,
        "onboarding_responses" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
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
        "theme_id" varchar,
        "target_audience" varchar,
        "status" varchar DEFAULT 'active',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE SET NULL
      );
    `);

    // Create episodes table
    await pool.query(`
      CREATE TABLE "episodes" (
        "id" varchar PRIMARY KEY,
        "title" varchar NOT NULL,
        "description" text,
        "duration" integer,
        "air_date" timestamp,
        "status" varchar DEFAULT 'draft',
        "project_id" varchar NOT NULL,
        "is_premium" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      );
    `);

    // Create scripts table
    await pool.query(`
      CREATE TABLE "scripts" (
        "id" varchar PRIMARY KEY,
        "title" varchar NOT NULL,
        "content" text,
        "status" varchar DEFAULT 'draft',
        "project_id" varchar NOT NULL,
        "episode_id" varchar,
        "author_id" varchar NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL,
        FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create file folders table
    await pool.query(`
      CREATE TABLE "file_folders" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "parent_id" varchar,
        "entity_type" varchar NOT NULL,
        "entity_id" varchar NOT NULL,
        "created_at" timestamp DEFAULT now(),
        FOREIGN KEY ("parent_id") REFERENCES "file_folders"("id") ON DELETE CASCADE
      );
    `);

    // Create files table
    await pool.query(`
      CREATE TABLE "files" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "original_name" varchar NOT NULL,
        "size" integer NOT NULL,
        "type" varchar NOT NULL,
        "data" text NOT NULL,
        "folder_id" varchar,
        "entity_type" varchar NOT NULL,
        "entity_id" varchar NOT NULL,
        "description" text,
        "tags" text[],
        "version" integer DEFAULT 1,
        "checksum" varchar,
        "uploaded_by" varchar NOT NULL,
        "uploaded_at" timestamp DEFAULT now(),
        "last_modified" timestamp DEFAULT now(),
        "download_count" integer DEFAULT 0,
        "is_public" boolean DEFAULT false,
        "access_level" varchar DEFAULT 'private',
        FOREIGN KEY ("folder_id") REFERENCES "file_folders"("id") ON DELETE SET NULL,
        FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE
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
        "user_id" varchar NOT NULL,
        "type" varchar NOT NULL,
        "title" varchar NOT NULL,
        "message" text NOT NULL,
        "priority" varchar DEFAULT 'medium',
        "is_read" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "data" jsonb,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create download logs table
    await pool.query(`
      CREATE TABLE "download_logs" (
        "id" varchar PRIMARY KEY,
        "file_id" varchar NOT NULL,
        "user_id" varchar NOT NULL,
        "ip_address" varchar,
        "user_agent" text,
        "downloaded_at" timestamptz DEFAULT now(),
        "download_duration" integer,
        "status" varchar DEFAULT 'success',
        "entity_type" varchar NOT NULL,
        "entity_id" varchar NOT NULL,
        "project_id" varchar,
        FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create onboarding form config table
    await pool.query(`
      CREATE TABLE "onboarding_form_config" (
        "id" varchar PRIMARY KEY,
        "version" integer NOT NULL,
        "config" jsonb NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "created_by" varchar NOT NULL,
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create onboarding form responses table
    await pool.query(`
      CREATE TABLE "onboarding_form_responses" (
        "id" varchar PRIMARY KEY,
        "user_id" varchar NOT NULL,
        "form_version" integer NOT NULL,
        "responses" jsonb NOT NULL,
        "submitted_at" timestamp DEFAULT now(),
        "ip_address" varchar,
        "user_agent" text,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
      CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
      CREATE INDEX IF NOT EXISTS "idx_projects_theme" ON "projects"("theme_id");
      CREATE INDEX IF NOT EXISTS "idx_episodes_project" ON "episodes"("project_id");
      CREATE INDEX IF NOT EXISTS "idx_scripts_project" ON "scripts"("project_id");
      CREATE INDEX IF NOT EXISTS "idx_scripts_author" ON "scripts"("author_id");
      CREATE INDEX IF NOT EXISTS "idx_files_entity" ON "files"("entity_type", "entity_id");
      CREATE INDEX IF NOT EXISTS "idx_files_uploaded_by" ON "files"("uploaded_by");
      CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_download_logs_file" ON "download_logs"("file_id");
      CREATE INDEX IF NOT EXISTS "idx_download_logs_user" ON "download_logs"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_onboarding_responses_user" ON "onboarding_form_responses"("user_id");
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