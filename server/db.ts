import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let db: any = null;
let pool: Pool | null = null;
let initialized = false;

// Force re-initialization for debugging
export function resetDbConnection() {
  initialized = false;
  db = null;
  pool = null;
}

// Initialize database connection lazily
function initializeDatabase() {
  if (initialized) return;
  initialized = true;

  console.log("Checking DATABASE_URL:", process.env.DATABASE_URL ? "✅ Found" : "❌ Not found");
  if (process.env.DATABASE_URL) {
    try {
      // Configure pool for Supabase with proper SSL and connection settings
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { 
          rejectUnauthorized: false 
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      
      db = drizzle(pool, { schema });
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

export { getPool as pool, getDb as db, getDb };

let dbAvailable: boolean | null = null;

export async function checkDatabaseAvailability(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.log("❌ No DATABASE_URL found");
    return false;
  }

  console.log("Checking DATABASE_URL: ✅ Found");

  try {
    // Test the connection with a simple query using pool - configured for Supabase
    const testPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false 
      },
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    
    const result = await testPool.query('SELECT 1 as test');
    console.log("✅ Database connection test successful:", result.rows[0]);
    await testPool.end();
    return true;
  } catch (error) {
    console.log("❌ Database connection failed:", error);
    return false;
  }
}

export function isDatabaseAvailable(): boolean {
  if (dbAvailable === null) {
    // Synchronous fallback - check if DATABASE_URL exists
    return !!process.env.DATABASE_URL;
  }
  return dbAvailable;
}

// Initialize database availability check
export async function initializeDatabaseCheck(): Promise<void> {
  dbAvailable = await checkDatabaseAvailability();
}

// Helper function to require database connection
export const requireDatabase = () => {
  const database = getDb();
  if (!database) {
    throw new Error("Database is not available. Please provision a PostgreSQL database to use this feature.");
  }
  return database;
};