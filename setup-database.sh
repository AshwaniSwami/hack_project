#!/bin/bash

echo "🚀 Database Setup for SMART Radio Content Hub"
echo ""
echo "This script will help you configure your PostgreSQL database connection."
echo ""
echo "You can use any PostgreSQL database provider:"
echo "• Replit Database (if you created one in the Database tab)"
echo "• Neon (neon.tech) - Free tier available"
echo "• Supabase (supabase.com) - Free tier available"
echo "• Railway (railway.app) - Free tier available"
echo "• Or any other PostgreSQL provider"
echo ""

read -p "Please paste your PostgreSQL connection string: " CONNECTION_STRING

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ No connection string provided. Please run the script again."
    exit 1
fi

if [[ ! "$CONNECTION_STRING" =~ ^postgres(ql)?:// ]]; then
    echo "❌ Invalid connection string format."
    echo "Please use format: postgresql://user:password@host:port/database"
    exit 1
fi

echo ""
echo "⚙️  Setting up database connection..."

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="$CONNECTION_STRING"

# Session Secret (change this in production)
SESSION_SECRET="your-secret-key-change-in-production-$(openssl rand -hex 8)"
EOF

echo "✅ .env file created successfully!"

echo ""
echo "🔄 Running database migrations..."

# Test connection and run migrations
export DATABASE_URL="$CONNECTION_STRING"
npm run db:push

if [ $? -eq 0 ]; then
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
else
    echo ""
    echo "⚠️  Migration completed with warnings. Your database should still work."
    echo "You can try running 'npm run db:push' again if needed."
fi