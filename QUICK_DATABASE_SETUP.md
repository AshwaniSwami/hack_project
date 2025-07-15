# 🚀 Quick Database Setup

## Option 1: Using the Setup Script (Recommended)

Run this command and paste your connection string when prompted:

```bash
./setup-database.sh
```

## Option 2: Manual Setup

If you prefer to do it manually:

### Step 1: Create .env file
```bash
echo 'DATABASE_URL="your-connection-string-here"' > .env
echo 'SESSION_SECRET="your-secret-key"' >> .env
```

### Step 2: Run migrations
```bash
npm run db:push
```

## Where to Get PostgreSQL Connection Strings

### 🟢 Free Options:

#### **Neon (Recommended for production)**
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free
3. Create a new project
4. Copy the connection string from the dashboard
5. Format: `postgresql://user:password@host/database?sslmode=require`

#### **Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Format: `postgresql://postgres:password@host:5432/postgres`

#### **Railway**
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy connection string from variables
5. Format: `postgresql://user:password@host:port/database`

#### **Replit Database**
1. In your Replit project, click the Database tab (cylinder icon)
2. Click "Create Database" 
3. Select "PostgreSQL"
4. The DATABASE_URL will be automatically available

## Connection String Examples

```bash
# Neon
postgresql://username:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require

# Supabase  
postgresql://postgres.abcdefghijklmnop:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Railway
postgresql://postgres:password123@containers-us-west-1.railway.app:7045/railway

# Local PostgreSQL
postgresql://username:password@localhost:5432/database_name
```

## After Setup

Once you've set up the database:

1. **Application restarts automatically**
2. **Go to the login page**
3. **Click "Sign Up" tab**
4. **Create your admin account** (first user becomes admin)
5. **Start using all features!**

## Features Unlocked with Database

✅ **Real user accounts**  
✅ **Persistent data storage**  
✅ **Project management**  
✅ **Episode and script management**  
✅ **File uploads and organization**  
✅ **User role management**  
✅ **Analytics and reporting**  
✅ **Full admin dashboard**  

## Need Help?

If you encounter issues:
1. Check that your connection string is correct
2. Ensure your database allows external connections
3. Verify your database credentials
4. Check the application logs for specific errors

Your connection string should start with `postgresql://` or `postgres://`