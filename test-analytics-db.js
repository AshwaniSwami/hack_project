
const { Pool } = require('pg');

async function testAnalyticsData() {
  // Use your Supabase connection string
  const pool = new Pool({
    connectionString: 'postgresql://postgres.skcjkhwtyvktrdkmbvrm:11223344@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const testQuery = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log('📅 Current time:', testQuery.rows[0].now);
    
    // Check if download_logs table exists
    console.log('\n🔍 Checking if download_logs table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'download_logs'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ download_logs table exists');
      
      // Count total download logs
      const countResult = await pool.query('SELECT COUNT(*) FROM download_logs');
      console.log(`📊 Total download logs: ${countResult.rows[0].count}`);
      
      if (parseInt(countResult.rows[0].count) > 0) {
        // Show recent download logs
        const recentLogs = await pool.query(`
          SELECT id, file_id, user_id, user_email, entity_type, download_size, downloaded_at 
          FROM download_logs 
          ORDER BY downloaded_at DESC 
          LIMIT 5
        `);
        
        console.log('\n📋 Recent download logs:');
        recentLogs.rows.forEach(log => {
          console.log(`  - ${log.user_email} downloaded ${log.entity_type} (${log.download_size} bytes) at ${log.downloaded_at}`);
        });
        
        // Check date range for last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentCount = await pool.query(`
          SELECT COUNT(*) FROM download_logs 
          WHERE downloaded_at >= $1
        `, [weekAgo]);
        
        console.log(`\n📊 Downloads in last 7 days: ${recentCount.rows[0].count}`);
        
      } else {
        console.log('⚠️  download_logs table is empty - no download data available');
      }
      
    } else {
      console.log('❌ download_logs table does not exist');
      
      // Check what tables do exist
      const tablesResult = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('\n📋 Available tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    // Check files table
    console.log('\n🔍 Checking files table...');
    const filesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'files'
      );
    `);
    
    if (filesCheck.rows[0].exists) {
      const filesCount = await pool.query('SELECT COUNT(*) FROM files');
      console.log(`✅ files table exists with ${filesCount.rows[0].count} files`);
    } else {
      console.log('❌ files table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testAnalyticsData().catch(console.error);
