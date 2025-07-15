# 🚀 Database Setup for SMART Radio Content Hub

## Step 1: Create PostgreSQL Database in Replit

1. **Look for the Database tab** in your Replit sidebar (left side - cylinder icon 🗄️)
2. **Click "Create Database"**
3. **Select "PostgreSQL"** 
4. **Wait 2-3 minutes** for provisioning

## Step 2: Verify Database Connection

Once Replit creates the database, it automatically sets the `DATABASE_URL` environment variable. 

To verify it's working:
```bash
npm run db:push
```

This command will:
- Connect to your new database
- Create all the necessary tables
- Set up the schema for users, projects, episodes, scripts, etc.

## Step 3: First Admin Account

After database setup:

1. **Refresh your application** (it will restart automatically)
2. **Go to the login page**
3. **Click "Sign Up" tab**
4. **Create your admin account:**
   - Email: your-email@domain.com
   - Password: your-secure-password
   - First Name: Your name
   - Last Name: Your surname

**Important:** The first user to register automatically becomes the admin!

## Step 4: What You'll Get

With the database connected, you'll have access to:

### 🔐 Full Authentication System
- Real user accounts with secure password hashing
- Session management with database storage
- Role-based access (Admin, Editor, Member)

### 📊 Complete Data Management
- **Projects**: Radio project organization
- **Episodes**: Individual episodes with file management
- **Scripts**: Content scripts with rich text editing
- **Radio Stations**: External station management
- **Users**: Full user management system
- **Analytics**: Download tracking and usage stats

### 🛡️ Security Features
- Secure password hashing with bcrypt
- Protected API endpoints
- Role-based access control
- Session persistence

## Current Status: Demo Mode → Full Database Mode

**Before Database:**
- Demo login (admin@example.com / password)
- Temporary data that doesn't persist
- Limited functionality

**After Database:**
- Real user accounts
- Persistent data storage
- Full feature access
- Production-ready authentication

## Need Help?

If you encounter any issues:
1. Check the application logs in the console
2. Verify DATABASE_URL is set: `echo $DATABASE_URL`
3. Run the migration: `npm run db:push`

Once your database is ready, the application will automatically switch from demo mode to full database mode!