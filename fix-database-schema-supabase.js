
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.skcjkhwtyvktrdkmbvrm:11223344@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Read the SQL file
    const sqlScript = fs.readFileSync('fix-users-table.sql', 'utf8');
    
    // Execute the SQL script
    console.log('🔄 Executing schema fixes...');
    await client.query(sqlScript);
    console.log('✅ Schema fixes applied successfully');
    
    // Verify the table structure
    console.log('🔍 Verifying users table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current users table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

fixDatabaseSchema();
