
#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please set up your database connection first:');
    console.log('1. Open a new tab in Replit');
    console.log('2. Search for "Database"');
    console.log('3. Click "Create a database"');
    console.log('4. Copy the DATABASE_URL from the env section');
    console.log('5. Add it to your .env file or Replit secrets');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Clear analytics data to start fresh
    console.log('🧹 Clearing old analytics data...');
    
    try {
      await client.query('DELETE FROM download_logs');
      console.log('✅ Cleared download logs');
    } catch (error) {
      console.log('ℹ️  Download logs table may not exist yet');
    }

    // Ensure download_logs table exists with correct structure
    console.log('📊 Setting up download_logs table...');
    
    const createDownloadLogsTable = `
      CREATE TABLE IF NOT EXISTS download_logs (
        id VARCHAR(36) PRIMARY KEY,
        file_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        download_size BIGINT DEFAULT 0,
        download_duration INTEGER DEFAULT 0,
        download_status VARCHAR(20) DEFAULT 'completed',
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        referer_page TEXT,
        downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createDownloadLogsTable);
    console.log('✅ Download logs table ready');

    // Create indexes for better query performance
    console.log('🔧 Creating indexes for analytics performance...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON download_logs(downloaded_at);',
      'CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON download_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_download_logs_file_id ON download_logs(file_id);',
      'CREATE INDEX IF NOT EXISTS idx_download_logs_entity_type ON download_logs(entity_type);',
      'CREATE INDEX IF NOT EXISTS idx_download_logs_entity_id ON download_logs(entity_id);',
    ];

    for (const index of indexes) {
      try {
        await client.query(index);
      } catch (error) {
        console.log(`⚠️  Index creation warning: ${error.message}`);
      }
    }

    console.log('✅ Indexes created');

    // Insert some sample data to test analytics
    console.log('📝 Creating sample data for testing...');
    
    // Check if we have any users
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersResult.rows[0].count);
    
    if (userCount === 0) {
      console.log('👤 Creating sample admin user...');
      await client.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, first_login_completed, created_at, updated_at)
        VALUES (
          'admin-001',
          'admin@smartradio.com',
          '$2b$10$dummy.hash.for.testing.purposes.only',
          'Admin',
          'User',
          'admin',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Sample admin user created');
    }

    // Check if we have any projects
    const projectsResult = await client.query('SELECT COUNT(*) FROM projects');
    const projectCount = parseInt(projectsResult.rows[0].count);
    
    if (projectCount === 0) {
      console.log('📁 Creating sample project...');
      await client.query(`
        INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
        VALUES (
          'project-001',
          'Sample Radio Project',
          'A sample project to test analytics tracking',
          'admin-001',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Sample project created');
    }

    // Check if we have any files
    const filesResult = await client.query('SELECT COUNT(*) FROM files');
    const fileCount = parseInt(filesResult.rows[0].count);
    
    if (fileCount === 0) {
      console.log('📄 Creating sample file entries...');
      await client.query(`
        INSERT INTO files (id, filename, original_name, file_size, file_type, entity_type, entity_id, uploaded_by, created_at, updated_at, is_active)
        VALUES 
        (
          'file-001',
          'sample-script.txt',
          'Sample Radio Script.txt',
          2048,
          'text/plain',
          'projects',
          'project-001',
          'admin-001',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          true
        ),
        (
          'file-002',
          'sample-episode.mp3',
          'Sample Episode Recording.mp3',
          5242880,
          'audio/mpeg',
          'episodes',
          'episode-001',
          'admin-001',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          true
        )
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Sample files created');
    }

    console.log('🎉 Database reset complete!');
    console.log('');
    console.log('📊 Analytics is now ready to track:');
    console.log('  • File downloads');
    console.log('  • User activity');
    console.log('  • Project engagement');
    console.log('  • Episode and script usage');
    console.log('');
    console.log('🚀 Restart your application and start using the system to see analytics data!');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await client.end();
  }
}

// Run the script
resetDatabase().catch(console.error);
