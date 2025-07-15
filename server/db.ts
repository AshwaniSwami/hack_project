import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let db: any = null;
let pool: Pool | null = null;
let initialized = false;

// Initialize database connection lazily
function initializeDatabase() {
  if (initialized) return;
  initialized = true;
  
  console.log("Checking DATABASE_URL:", process.env.DATABASE_URL ? "✅ Found" : "❌ Not found");
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
}

// Getter that initializes on first access
function getDb() {
  initializeDatabase();
  return db;
}

function getPool() {
  initializeDatabase();
  return pool;
}

export { getPool as pool, getDb as db };

// Helper function to check if database is available
export const isDatabaseAvailable = () => !!getDb();

// Helper function to require database connection
export const requireDatabase = () => {
  const database = getDb();
  if (!database) {
    throw new Error("Database is not available. Please provision a PostgreSQL database to use this feature.");
  }
  return database;
};