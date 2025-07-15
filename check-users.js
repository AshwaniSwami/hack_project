import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3WpGbh4FAkMI@ep-divine-poetry-adygbcuc-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function checkAndCreateAdminUser() {
  try {
    // Check existing users
    const result = await pool.query('SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 10');
    console.log('Current users in database:');
    if (result.rows.length === 0) {
      console.log('No users found in database');
      
      // Create a default admin user
      const adminEmail = 'admin@example.com';
      const adminPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminId = nanoid();
      
      await pool.query(`
        INSERT INTO users (id, email, password, role, is_active, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [adminId, adminEmail, hashedPassword, 'admin', true, true, new Date(), new Date()]);
      
      console.log('✅ Created default admin user:');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role: admin`);
    } else {
      console.log('Existing users:');
      result.rows.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id}, Role: ${user.role})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndCreateAdminUser();