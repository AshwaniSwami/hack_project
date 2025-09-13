import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Helper functions for backward compatibility
export function getDb() {
  return db;
}

export function getPool() {
  return pool;
}

export async function checkDatabaseAvailability(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log("✅ Database connection test successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.log("❌ Database connection failed:", (error as Error).message);
    return false;
  }
}

// Add missing export for backward compatibility
export function resetDbConnection() {
  // No-op for new architecture
}

export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export const requireDatabase = () => {
  if (!db) {
    throw new Error("Database is not available. Please provision a PostgreSQL database to use this feature.");
  }
  return db;
};