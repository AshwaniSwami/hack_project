import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let db: any = null;
let pool: Pool | null = null;

// Check if database is available
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    db = null;
  }
} else {
  console.warn("⚠️  DATABASE_URL not found. The application will start but database features will be unavailable.");
  console.warn("   To enable full functionality, please provision a PostgreSQL database in your Replit project.");
}

export { pool, db };

// Helper function to check if database is available
export const isDatabaseAvailable = () => !!db;

// Helper function to require database connection
export const requireDatabase = () => {
  if (!db) {
    throw new Error("Database is not available. Please provision a PostgreSQL database to use this feature.");
  }
  return db;
};