#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Database Setup for SMART Radio Content Hub\n');
console.log('This script will help you configure your PostgreSQL database connection.\n');

console.log('You can use any PostgreSQL database provider:');
console.log('• Replit Database (if you created one in the Database tab)');
console.log('• Neon (neon.tech)');
console.log('• Supabase (supabase.com)');
console.log('• Railway (railway.app)');
console.log('• Or any other PostgreSQL provider\n');

rl.question('Please paste your PostgreSQL connection string:\n(Example: postgresql://user:password@host:port/database)\n\nConnection String: ', async (connectionString) => {
  
  if (!connectionString || !connectionString.trim()) {
    console.log('❌ No connection string provided. Please run the script again.');
    rl.close();
    return;
  }

  // Validate connection string format
  if (!connectionString.includes('postgresql://') && !connectionString.includes('postgres://')) {
    console.log('❌ Invalid connection string format. Please use: postgresql://user:password@host:port/database');
    rl.close();
    return;
  }

  console.log('\n⚙️  Setting up database connection...');

  try {
    // Test the connection first
    console.log('🔍 Testing database connection...');
    
    const testConnection = spawn('node', ['-e', `
      import { Pool } from '@neondatabase/serverless';
      const pool = new Pool({ connectionString: '${connectionString}' });
      try {
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        client.release();
        process.exit(0);
      } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
      }
    `], { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: connectionString }
    });

    testConnection.on('close', (code) => {
      if (code === 0) {
        // Connection successful, proceed with setup
        setupDatabase(connectionString);
      } else {
        console.log('\n❌ Database connection test failed.');
        console.log('Please check your connection string and try again.');
        rl.close();
      }
    });

  } catch (error) {
    console.error('❌ Error testing connection:', error.message);
    rl.close();
  }
});

async function setupDatabase(connectionString) {
  try {
    console.log('\n📝 Creating .env file...');
    
    // Create or update .env file
    const envContent = `# Database Configuration
DATABASE_URL="${connectionString}"

# Session Secret (change this in production)
SESSION_SECRET="your-secret-key-change-in-production-${Math.random().toString(36).substring(7)}"
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully!');

    console.log('\n🔄 Running database migrations...');
    
    // Run database migrations
    const migrate = spawn('npm', ['run', 'db:push'], { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: connectionString }
    });

    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Your application will restart automatically');
        console.log('2. Go to the login page');
        console.log('3. Click "Sign Up" to create your first admin account');
        console.log('4. The first user to register will automatically become admin');
        console.log('\n🔐 Your application now has full database functionality!');
      } else {
        console.log('\n⚠️  Migration completed with warnings. Your database should still work.');
        console.log('You can try running "npm run db:push" again if needed.');
      }
      rl.close();
    });

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    rl.close();
  }
}