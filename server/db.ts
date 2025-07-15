import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import postgres from 'postgres';

neonConfig.webSocketConstructor = ws;

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
      const connectionString = process.env.DATABASE_URL;
      
      // Enhanced connection configuration for production
      const poolConfig = {
        connectionString,
        ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 30000,
        query_timeout: 30000,
      };
      
      pool = new Pool(poolConfig);
      db = drizzle({ client: pool, schema });
      console.log("✅ Database connected successfully with enhanced config");
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
    // Test the connection with a simple query using pool
    const connectionString = process.env.DATABASE_URL;
    const testPool = new Pool({ 
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    
    await testPool.query('SELECT 1');
    console.log("✅ Database connected successfully");
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