
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearUsers() {
  console.log("🗑️  Clearing all users from the database...");
  
  try {
    // First, clear related tables that reference users
    console.log("🔄 Clearing related user data...");
    
    // Clear onboarding responses
    await pool.query(`DELETE FROM onboarding_form_responses`);
    console.log("✅ Cleared onboarding form responses");
    
    // Clear onboarding form configs (created by users)
    await pool.query(`DELETE FROM onboarding_form_config`);
    console.log("✅ Cleared onboarding form configs");
    
    // Clear notifications
    await pool.query(`DELETE FROM notifications`);
    console.log("✅ Cleared notifications");
    
    // Clear OTP verifications
    await pool.query(`DELETE FROM otp_verifications`);
    console.log("✅ Cleared OTP verifications");
    
    // Clear download logs
    await pool.query(`DELETE FROM download_logs`);
    console.log("✅ Cleared download logs");
    
    // Clear files uploaded by users
    await pool.query(`DELETE FROM files WHERE uploaded_by IS NOT NULL`);
    console.log("✅ Cleared user-uploaded files");
    
    // Clear free project access
    await pool.query(`DELETE FROM free_project_access`);
    console.log("✅ Cleared free project access");
    
    // Clear radio stations
    await pool.query(`DELETE FROM radio_stations`);
    console.log("✅ Cleared radio stations");
    
    // Clear scripts (authored by users)
    await pool.query(`DELETE FROM scripts`);
    console.log("✅ Cleared scripts");
    
    // Clear sessions
    await pool.query(`DELETE FROM sessions`);
    console.log("✅ Cleared user sessions");
    
    // Finally, clear users table
    const userCountBefore = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users before clearing: ${userCountBefore.rows[0].count}`);
    
    await pool.query(`DELETE FROM users`);
    
    const userCountAfter = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users after clearing: ${userCountAfter.rows[0].count}`);
    
    console.log("\n🎉 All users and related data have been cleared successfully!");
    console.log("🔄 The application will now require new user registration");
    console.log("👤 The first user to register will automatically become admin");
    
    pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error clearing users:", error.message);
    pool.end();
    process.exit(1);
  }
}

clearUsers();
