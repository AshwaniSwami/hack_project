// Create sample analytics data for better demonstration
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSampleAnalyticsData() {
  const client = await pool.connect();
  
  try {
    console.log('Creating sample analytics data...');
    
    // Check current data
    const currentDownloads = await client.query('SELECT COUNT(*) FROM download_logs');
    const currentFiles = await client.query('SELECT COUNT(*) FROM files');
    const currentUsers = await client.query('SELECT COUNT(*) FROM users');
    
    console.log(`Current data - Downloads: ${currentDownloads.rows[0].count}, Files: ${currentFiles.rows[0].count}, Users: ${currentUsers.rows[0].count}`);
    
    // Create additional sample users if needed
    const users = await client.query('SELECT id, email FROM users LIMIT 5');
    console.log('Current users:', users.rows);
    
    if (users.rows.length < 3) {
      // Add sample users
      await client.query(`
        INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES 
        ('user2', 'john.doe@example.com', 'John', 'Doe', 'editor', NOW() - INTERVAL '5 days'),
        ('user3', 'jane.smith@example.com', 'Jane', 'Smith', 'member', NOW() - INTERVAL '3 days')
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('Added sample users');
    }
    
    // Get files for download tracking
    const files = await client.query('SELECT id, entity_type, entity_id FROM files');
    const allUsers = await client.query('SELECT id, email, first_name, last_name, role FROM users');
    
    if (files.rows.length > 0 && allUsers.rows.length > 0) {
      // Create additional download logs for better analytics
      for (let i = 0; i < 15; i++) {
        const file = files.rows[Math.floor(Math.random() * files.rows.length)];
        const user = allUsers.rows[Math.floor(Math.random() * allUsers.rows.length)];
        const daysAgo = Math.floor(Math.random() * 7) + 1;
        const fileSize = Math.floor(Math.random() * 500000) + 50000;
        const duration = Math.floor(Math.random() * 2000) + 100;
        
        await client.query(`
          INSERT INTO download_logs (
            id, file_id, user_id, user_email, user_name, user_role, 
            ip_address, user_agent, download_size, download_duration, 
            download_status, entity_type, entity_id, referer_page, downloaded_at
          ) VALUES (
            gen_random_uuid(),
            $1, $2, $3, $4, $5,
            '192.168.1.' || (FLOOR(RANDOM() * 254) + 1)::text,
            'Mozilla/5.0 (compatible; Analytics Bot)',
            $6, $7, 'completed', $8, $9,
            'https://example.com/analytics',
            NOW() - INTERVAL '${daysAgo} days' - INTERVAL '${Math.floor(Math.random() * 24)} hours'
          )
        `, [
          file.id, 
          user.id, 
          user.email, 
          `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous',
          user.role,
          fileSize,
          duration,
          file.entity_type,
          file.entity_id
        ]);
      }
      console.log('Added 15 sample download logs');
    }
    
    // Update download counts in files table
    await client.query(`
      UPDATE files 
      SET download_count = (
        SELECT COUNT(*) FROM download_logs WHERE download_logs.file_id = files.id
      ),
      last_accessed_at = (
        SELECT MAX(downloaded_at) FROM download_logs WHERE download_logs.file_id = files.id
      )
    `);
    console.log('Updated file download counts');
    
    // Create sample episodes if none exist
    const episodes = await client.query('SELECT COUNT(*) FROM episodes');
    if (parseInt(episodes.rows[0].count) === 0) {
      const projects = await client.query('SELECT id FROM projects LIMIT 1');
      if (projects.rows.length > 0) {
        await client.query(`
          INSERT INTO episodes (id, project_id, title, created_at) VALUES
          (gen_random_uuid(), $1, 'Sample Episode 1', NOW() - INTERVAL '2 days'),
          (gen_random_uuid(), $1, 'Sample Episode 2', NOW() - INTERVAL '1 day')
        `, [projects.rows[0].id]);
        console.log('Added sample episodes');
      }
    }
    
    console.log('Sample analytics data creation complete!');
    
    // Show final counts
    const finalDownloads = await client.query('SELECT COUNT(*) FROM download_logs');
    const finalFiles = await client.query('SELECT COUNT(*) FROM files');
    const finalUsers = await client.query('SELECT COUNT(*) FROM users');
    const finalEpisodes = await client.query('SELECT COUNT(*) FROM episodes');
    
    console.log(`Final data - Downloads: ${finalDownloads.rows[0].count}, Files: ${finalFiles.rows[0].count}, Users: ${finalUsers.rows[0].count}, Episodes: ${finalEpisodes.rows[0].count}`);
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    client.release();
  }
}

// Run the function
createSampleAnalyticsData()
  .then(() => {
    console.log('Sample data creation completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });