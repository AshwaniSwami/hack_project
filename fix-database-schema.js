import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function fixDatabaseSchema() {
  console.log("🔧 Fixing database schema...");
  
  try {
    // Add missing columns to projects table
    await db.execute(sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'main'
    `);
    console.log("✅ Added project_type column to projects table");

    await db.execute(sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    console.log("✅ Added description column to projects table");

    await db.execute(sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false
    `);
    console.log("✅ Added is_template column to projects table");

    await db.execute(sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);
    console.log("✅ Added sort_order column to projects table");

    // Add missing columns to episodes table
    await db.execute(sql`
      ALTER TABLE episodes 
      ADD COLUMN IF NOT EXISTS episode_number INTEGER
    `);
    console.log("✅ Added episode_number column to episodes table");

    await db.execute(sql`
      ALTER TABLE episodes 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    console.log("✅ Added description column to episodes table");

    await db.execute(sql`
      ALTER TABLE episodes 
      ADD COLUMN IF NOT EXISTS broadcast_date DATE
    `);
    console.log("✅ Added broadcast_date column to episodes table");

    await db.execute(sql`
      ALTER TABLE episodes 
      ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false
    `);
    console.log("✅ Added is_premium column to episodes table");

    // Add missing columns to themes table
    await db.execute(sql`
      ALTER TABLE themes 
      ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7) DEFAULT '#3B82F6'
    `);
    console.log("✅ Added color_hex column to themes table");

    await db.execute(sql`
      ALTER TABLE themes 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    console.log("✅ Added is_active column to themes table");

    // Add missing columns to scripts table
    await db.execute(sql`
      ALTER TABLE scripts 
      ADD COLUMN IF NOT EXISTS review_comments TEXT
    `);
    console.log("✅ Added review_comments column to scripts table");

    await db.execute(sql`
      ALTER TABLE scripts 
      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false
    `);
    console.log("✅ Added is_archived column to scripts table");

    console.log("\n🎉 Database schema fixed successfully!");
    console.log("📊 All missing columns have been added to the database.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing database schema:", error);
    process.exit(1);
  }
}

fixDatabaseSchema();