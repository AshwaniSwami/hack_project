#!/bin/bash

echo "🚀 SMART Radio Content Hub - Database Setup"
echo "==========================================="
echo ""
echo "This script will help you set up a PostgreSQL database for your application."
echo "The app currently works with fallback storage, but adding a database unlocks:"
echo "• Full user authentication and management"
echo "• Persistent data storage"
echo "• Advanced analytics and reporting"
echo "• File upload and organization"
echo "• Real-time notifications"
echo ""

echo "📋 Database Provider Options:"
echo "1. Neon (neon.tech) - Free tier: 0.5GB, 1 database"
echo "2. Supabase (supabase.com) - Free tier: 500MB, 2 databases"
echo "3. Railway (railway.app) - Free trial available"
echo "4. Vercel Postgres - Free tier: 256MB"
echo "5. Replit Database (if available in your project)"
echo "6. Other PostgreSQL provider"
echo ""

echo "🔧 Quick Setup Instructions:"
echo ""
echo "For Neon (Recommended):"
echo "1. Go to https://neon.tech and create a free account"
echo "2. Create a new project"
echo "3. Copy the connection string from the dashboard"
echo "4. It looks like: postgresql://username:password@hostname/database"
echo ""
echo "For Supabase:"
echo "1. Go to https://supabase.com and create a free account"
echo "2. Create a new project"
echo "3. Go to Settings > Database"
echo "4. Copy the connection string (URI format)"
echo ""

read -p "Do you have a PostgreSQL connection string ready? (y/n): " has_connection

if [[ $has_connection != "y" && $has_connection != "Y" ]]; then
    echo ""
    echo "Please set up a database first using one of the providers above."
    echo "Once you have a connection string, run this script again."
    echo ""
    echo "💡 Tip: The connection string format is:"
    echo "postgresql://username:password@hostname:port/database"
    echo ""
    exit 0
fi

echo ""
read -p "Please paste your PostgreSQL connection string: " connection_string

if [[ -z "$connection_string" ]]; then
    echo "❌ No connection string provided. Please run the script again."
    exit 1
fi

if [[ ! "$connection_string" =~ ^postgres(ql)?:// ]]; then
    echo "❌ Invalid connection string format."
    echo "Please use format: postgresql://username:password@hostname:port/database"
    exit 1
fi

echo ""
echo "⚙️ Setting up database connection..."

# Create/update .env file
echo "📝 Creating .env file..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="$connection_string"

# Session Secret (auto-generated)
SESSION_SECRET="$(openssl rand -hex 32)"

# Environment
NODE_ENV=development
EOF

echo "✅ Environment file created!"

echo ""
echo "🔄 Testing database connection..."

# Export the DATABASE_URL for testing
export DATABASE_URL="$connection_string"

# Test connection using node
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
  console.log('✅ Database connection successful!');
  pool.end();
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"

if [[ $? -eq 0 ]]; then
    echo ""
    echo "🏗️ Running database migrations..."
    npm run db:push
    
    if [[ $? -eq 0 ]]; then
        echo ""
        echo "🎉 Database setup completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Your application will restart automatically"
        echo "2. Go to the login page"
        echo "3. Click 'Sign Up' to create your first admin account"
        echo "4. The first user to register will automatically become admin"
        echo ""
        echo "🔐 Your application now has full database functionality!"
        echo ""
        echo "💡 Features now available:"
        echo "• User registration and authentication"
        echo "• Project and episode management"
        echo "• File uploads and organization"
        echo "• Real-time notifications"
        echo "• Analytics dashboard"
        echo "• Onboarding form management"
    else
        echo ""
        echo "⚠️ Database migration had some issues, but your database should still work."
        echo "You can manually run 'npm run db:push' if needed."
    fi
else
    echo ""
    echo "❌ Database connection failed. Please check your connection string and try again."
    exit 1
fi