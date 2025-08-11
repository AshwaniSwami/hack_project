
const { Pool } = require('pg');

async function createAnalyticsSampleData() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.skcjkhwtyvktrdkmbvrm:11223344@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Creating sample analytics data...');

    // Get existing data
    const users = await client.query('SELECT id, email, name, role FROM users LIMIT 5');
    const files = await client.query('SELECT id, filename, original_name, entity_type, entity_id FROM files LIMIT 10');
    
    if (users.rows.length === 0) {
      console.log('❌ No users found. Creating sample users...');
      await client.query(`
        INSERT INTO users (id, email, name, role, is_approved, created_at, updated_at) VALUES
        ('user1', 'john.doe@example.com', 'John Doe', 'member', true, NOW(), NOW()),
        ('user2', 'jane.smith@example.com', 'Jane Smith', 'editor', true, NOW(), NOW()),
        ('user3', 'admin@example.com', 'Admin User', 'admin', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Sample users created');
    }

    if (files.rows.length === 0) {
      console.log('❌ No files found. Creating sample files...');
      
      // First ensure we have projects
      await client.query(`
        INSERT INTO projects (id, name, description, created_at, updated_at) VALUES
        ('project1', 'Sample Radio Project', 'A sample project for testing', NOW(), NOW()),
        ('project2', 'News Podcast Series', 'Daily news podcast episodes', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Create sample episodes
      await client.query(`
        INSERT INTO episodes (id, project_id, title, episode_number, created_at, updated_at) VALUES
        ('episode1', 'project1', 'Episode 1: Getting Started', 1, NOW(), NOW()),
        ('episode2', 'project1', 'Episode 2: Advanced Topics', 2, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Create sample scripts  
      await client.query(`
        INSERT INTO scripts (id, project_id, title, content, created_at, updated_at) VALUES
        ('script1', 'project1', 'Opening Script', 'Welcome to our show...', NOW(), NOW()),
        ('script2', 'project2', 'News Brief Script', 'Today''s headlines...', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Create sample files
      await client.query(`
        INSERT INTO files (id, filename, original_name, mime_type, file_size, entity_type, entity_id, created_at, updated_at) VALUES
        ('file1', 'episode1_audio.mp3', 'Episode 1 Audio.mp3', 'audio/mpeg', 15000000, 'episodes', 'episode1', NOW(), NOW()),
        ('file2', 'episode2_audio.mp3', 'Episode 2 Audio.mp3', 'audio/mpeg', 18000000, 'episodes', 'episode2', NOW(), NOW()),
        ('file3', 'script1.pdf', 'Opening Script.pdf', 'application/pdf', 500000, 'scripts', 'script1', NOW(), NOW()),
        ('file4', 'script2.pdf', 'News Script.pdf', 'application/pdf', 750000, 'scripts', 'script2', NOW(), NOW()),
        ('file5', 'project1_logo.png', 'Project Logo.png', 'image/png', 250000, 'projects', 'project1', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Sample files created');
    }

    // Clear existing download logs to start fresh
    await client.query('DELETE FROM download_logs');
    console.log('🗑️ Cleared existing download logs');

    // Get fresh data after creation
    const usersRefresh = await client.query('SELECT id, email, name, role FROM users');
    const filesRefresh = await client.query('SELECT id, filename, original_name, entity_type, entity_id FROM files');

    console.log(`📊 Found ${usersRefresh.rows.length} users and ${filesRefresh.rows.length} files`);

    // Create sample download logs for the past 30 days
    const downloadLogs = [];
    const now = new Date();
    
    // Generate 200 sample downloads
    for (let i = 0; i < 200; i++) {
      const randomFile = filesRefresh.rows[Math.floor(Math.random() * filesRefresh.rows.length)];
      const randomUser = usersRefresh.rows[Math.floor(Math.random() * usersRefresh.rows.length)];
      
      // Random date in the past 30 days, with more recent activity
      const daysAgo = Math.floor(Math.random() * 30);
      const downloadDate = new Date(now);
      downloadDate.setDate(downloadDate.getDate() - daysAgo);
      downloadDate.setHours(Math.floor(Math.random() * 24));
      downloadDate.setMinutes(Math.floor(Math.random() * 60));
      
      const downloadSize = Math.floor(Math.random() * 20000000) + 100000; // 100KB to 20MB
      const downloadDuration = Math.floor(Math.random() * 10000) + 200; // 200ms to 10s
      const isSuccessful = Math.random() > 0.05; // 95% success rate

      downloadLogs.push([
        `download_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        randomFile.id,
        randomUser.id,
        randomUser.email,
        randomUser.name || randomUser.email.split('@')[0],
        randomUser.role,
        `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        downloadSize,
        downloadDuration,
        isSuccessful ? 'completed' : (Math.random() > 0.5 ? 'failed' : 'interrupted'),
        randomFile.entity_type,
        randomFile.entity_id,
        Math.random() > 0.5 ? '/projects' : '/episodes',
        downloadDate.toISOString(),
        downloadDate.toISOString(),
        downloadDate.toISOString()
      ]);
    }

    // Insert download logs in batches
    const batchSize = 50;
    for (let i = 0; i < downloadLogs.length; i += batchSize) {
      const batch = downloadLogs.slice(i, i + batchSize);
      const values = batch.map((_, index) => {
        const offset = i + index;
        return `($${offset * 16 + 1}, $${offset * 16 + 2}, $${offset * 16 + 3}, $${offset * 16 + 4}, $${offset * 16 + 5}, $${offset * 16 + 6}, $${offset * 16 + 7}, $${offset * 16 + 8}, $${offset * 16 + 9}, $${offset * 16 + 10}, $${offset * 16 + 11}, $${offset * 16 + 12}, $${offset * 16 + 13}, $${offset * 16 + 14}, $${offset * 16 + 15}, $${offset * 16 + 16})`;
      }).join(', ');
      
      const flatValues = batch.flat();
      
      await client.query(`
        INSERT INTO download_logs (
          id, file_id, user_id, user_email, user_name, user_role, 
          ip_address, download_size, download_duration, download_status,
          entity_type, entity_id, referer_page, downloaded_at, created_at, updated_at
        ) VALUES ${values}
      `, flatValues);
    }

    console.log(`✅ Created ${downloadLogs.length} sample download logs`);

    // Update file download counts
    await client.query(`
      UPDATE files 
      SET download_count = (
        SELECT COUNT(*) FROM download_logs WHERE download_logs.file_id = files.id
      ),
      last_accessed_at = (
        SELECT MAX(downloaded_at) FROM download_logs WHERE download_logs.file_id = files.id
      )
    `);
    
    console.log('✅ Updated file download counts');

    // Show final statistics
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_downloads,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT file_id) as files_downloaded,
        SUM(download_size) as total_data,
        COUNT(CASE WHEN download_status = 'completed' THEN 1 END) as successful_downloads
      FROM download_logs
    `);

    console.log('\n📈 Analytics Summary:');
    console.log(`Total Downloads: ${stats.rows[0].total_downloads}`);
    console.log(`Unique Users: ${stats.rows[0].unique_users}`);
    console.log(`Files Downloaded: ${stats.rows[0].files_downloaded}`);
    console.log(`Total Data: ${(stats.rows[0].total_data / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Success Rate: ${((stats.rows[0].successful_downloads / stats.rows[0].total_downloads) * 100).toFixed(1)}%`);
    
    console.log('\n🎉 Sample analytics data created successfully!');
    console.log('You can now view the analytics page to see the data visualization.');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
createAnalyticsSampleData()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
