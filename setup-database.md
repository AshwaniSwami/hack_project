# Complete Database Setup for SMART Radio Content Hub

## Step 1: Create PostgreSQL Database in Replit

1. **Find the Database tab** in your Replit sidebar (cylinder icon)
2. **Click "Create Database"** 
3. **Select "PostgreSQL"**
4. **Wait for provisioning** (may take 2-3 minutes)

## Step 2: Automatic Configuration

Once the database is created:
- Replit automatically sets `DATABASE_URL` environment variable
- Application restarts and detects the database
- Database schema is automatically created via migrations

## Step 3: Create Your First Admin Account

1. **Go to the login page** in your application
2. **Click "Sign Up" tab**
3. **Register with your admin credentials:**
   - Email: your admin email
   - Password: your secure password
   - First Name: Your first name
   - Last Name: Your last name
4. **The first user automatically becomes admin**

## Step 4: User Management Features

After database setup, you'll have:

### Admin Capabilities:
- **Users Tab**: Visible only to admin users
- **Create Users**: Add new team members
- **Edit Users**: Modify user information and roles
- **Delete Users**: Remove users from the system
- **Role Management**: Assign admin, editor, or member roles

### User Roles:
- **Admin**: Full access including user management
- **Editor**: Can create and edit content
- **Member**: Can view and contribute to assigned projects

### Security Features:
- **Password Hashing**: Secure bcrypt encryption
- **Session Management**: Persistent login sessions
- **Role-Based Access**: Different permissions per user type
- **Secure Authentication**: Protected routes and API endpoints

## Current Status: Demo Mode

Right now you're in demo mode with:
- Temporary authentication (admin@example.com / password)
- Sample data for testing UI
- Non-persistent user management

Once you set up the database, everything becomes fully functional with real data storage.