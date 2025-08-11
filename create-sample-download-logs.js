
const { Pool } = require('pg');

async function createSampleDownloadLogs() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.skcjkhwtyvktrdkmbvrm:11223344@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Checking existing download logs...');
    
    // Check if download_logs table exists and has data
    const logCount = await pool.query('SELECT COUNT(*) FROM download_logs');
    console.log(`📊 Current download logs: ${logCount.rows[0].count}`);

    if (parseInt(logCount.rows[0].count) > 0) {
      console.log('✅ Download logs already exist, skipping creation');
      return;
    }

    // Get some sample files and users for creating realistic download logs
    const files = await pool.query('SELECT id, filename, original_name, entity_type, entity_id FROM files LIMIT 5');
    const users = await pool.query('SELECT id, email, name, role FROM users LIMIT 3');

    if (files.rows.length === 0 || users.rows.length === 0) {
      console.log('❌ No files or users found. Please create some first.');
      return;
    }

    console.log(`📁 Found ${files.rows.length} files and ${users.rows.length} users`);

    // Create sample download logs for the past 30 days
    const sampleLogs = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const downloadDate = new Date(now);
      downloadDate.setDate(now.getDate() - i);
      
      // Create 2-8 downloads per day
      const downloadsPerDay = Math.floor(Math.random() * 7) + 2;
      
      for (let j = 0; j < downloadsPerDay; j++) {
        const randomFile = files.rows[Math.floor(Math.random() * files.rows.length)];
        const randomUser = users.rows[Math.floor(Math.random() * users.rows.length)];
        
        // Random hour of the day
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        downloadDate.setHours(randomHour, randomMinute, 0, 0);
        
        sampleLogs.push({
          id: `dl_${Date.now()}_${i}_${j}_${Math.random().toString(36).substr(2, 9)}`,
          fileId: randomFile.id,
          filename: randomFile.filename,
          originalName: randomFile.original_name,
          userId: randomUser.id,
          userEmail: randomUser.email,
          userName: randomUser.name,
          userRole: randomUser.role,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          downloadSize: Math.floor(Math.random() * 10000000) + 100000, // 100KB to 10MB
          downloadDuration: Math.floor(Math.random() * 5000) + 500, // 0.5 to 5.5 seconds
          downloadStatus: Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'failed' : 'interrupted'),
          entityType: randomFile.entity_type,
          entityId: randomFile.entity_id,
          refererPage: `/projects/${randomFile.entity_id}`,
          downloadedAt: downloadDate.toISOString(),
          createdAt: downloadDate.toISOString(),
          updatedAt: downloadDate.toISOString()
        });
      }
    }

    console.log(`📦 Creating ${sampleLogs.length} sample download logs...`);

    // Insert sample logs in batches
    for (let i = 0; i < sampleLogs.length; i += 10) {
      const batch = sampleLogs.slice(i, i + 10);
      
      for (const log of batch) {
        try {
          await pool.query(`
            INSERT INTO download_logs (
              id, file_id, filename, original_name, user_id, user_email, user_name, user_role,
              ip_address, download_size, download_duration, download_status, entity_type, entity_id,
              referer_page, downloaded_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          `, [
            log.id, log.fileId, log.filename, log.originalName, log.userId, log.userEmail,
            log.userName, log.userRole, log.ipAddress, log.downloadSize, log.downloadDuration,
            log.downloadStatus, log.entityType, log.entityId, log.refererPage, log.downloadedAt,
            log.createdAt, log.updatedAt
          ]);
        } catch (insertError) {
          console.warn(`⚠️ Failed to insert log ${log.id}:`, insertError.message);
        }
      }
      
      console.log(`✅ Inserted batch ${Math.floor(i/10) + 1}/${Math.ceil(sampleLogs.length/10)}`);
    }

    // Verify the data was inserted
    const finalCount = await pool.query('SELECT COUNT(*) FROM download_logs');
    console.log(`🎉 Created ${finalCount.rows[0].count} download logs successfully!`);

    // Show some stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_downloads,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(download_size) as total_data,
        entity_type,
        COUNT(*) as type_count
      FROM download_logs 
      GROUP BY entity_type
      ORDER BY type_count DESC
    `);

    console.log('\n📈 Download stats by type:');
    stats.rows.forEach(stat => {
      console.log(`  ${stat.entity_type}: ${stat.type_count} downloads`);
    });

  } catch (error) {
    console.error('❌ Error creating sample download logs:', error);
  } finally {
    await pool.end();
  }
}

createSampleDownloadLogs().catch(console.error);
