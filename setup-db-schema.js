// Database schema setup script for SMART Radio Content Hub
// This script sets up the database schema with all necessary tables

const { neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function setupDatabase() {
  console.log('🔄 Setting up database schema...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Please provision a PostgreSQL database in Replit first.');
    process.exit(1);
  }

  try {
    // Test database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    
    console.log('✅ Database connection successful');
    
    // Create basic tables structure
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        username VARCHAR UNIQUE,
        password VARCHAR,
        role VARCHAR DEFAULT 'member',
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        login_count INTEGER DEFAULT 0,
        last_login_at TIMESTAMP,
        first_login_completed BOOLEAN DEFAULT false,
        location JSONB,
        onboarding_responses JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_form_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        questions JSONB NOT NULL,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_form_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        form_config_id UUID NOT NULL,
        question_id VARCHAR NOT NULL,
        question_type VARCHAR(20) NOT NULL,
        question_label TEXT NOT NULL,
        response JSONB NOT NULL,
        is_compulsory BOOLEAN DEFAULT false,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_onboarding_form_version ON onboarding_form_config(version);
      CREATE INDEX IF NOT EXISTS idx_onboarding_form_active ON onboarding_form_config(is_active);
      CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user ON onboarding_form_responses(user_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_responses_form ON onboarding_form_responses(form_config_id);
    `);

    console.log('✅ Database schema setup complete');
    console.log('🎉 Your SMART Radio Content Hub database is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application');
    console.log('2. Go to the login page and create your first admin account');
    console.log('3. The first user registered will automatically become admin');
    
    client.release();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();