# SMART Radio Content Hub

## Overview

NGO Content Management Hub is a comprehensive content management platform for non-profit organizations, designed to facilitate content exploration and community engagement. It centralizes management of articles, reports, success stories, projects, and events. Key capabilities include content discovery tools, user engagement features, donation and volunteer integration, and content organization tailored for NGO communication workflows. The platform aims to connect communities with impactful content while providing opportunities for involvement through donations, volunteering, and newsletter subscriptions.

## Recent Updates (August 2025)

✅ **Database Migration to Supabase** - Successfully migrated to new Supabase PostgreSQL database:
- Updated DATABASE_URL to use Supabase hosted PostgreSQL
- Reset database with clean schema and fresh sample data
- 3 users (admin, editor, member), 6 themes, 5 projects with proper relationships
- Server running on port 5000 with all dependencies configured
- Analytics system functional with real-time tracking
- Authentication system working with session management

✅ **Theme System Fixed and Functional** - Project theme colors now working properly:
- 6 themes created with distinct colors (Blue Ocean, Forest Green, Sunset Orange, Purple Magic, Rose Pink, Emerald Bright)
- 5 sample projects with theme associations and descriptions
- Theme colors correctly displayed in project cards using colorHex values
- Database schema updated with proper color_hex and description fields
- Direct database API routes bypassing fallback storage issues

✅ **Analytics System Fully Functional** - Complete real-time analytics tracking all user activity:
- Real user data display (3 users, 1 file, 6+ downloads tracked)
- Download analytics with timeframe filtering (24h, 7d, 30d, 90d)
- Activity feeds showing actual download events with timestamps
- File-specific analytics showing download history and user details
- Performance metrics including download speeds and data transfer amounts

✅ **Download System Optimized** - File downloads working perfectly:
- Smart caching system preventing repeated Base64 operations
- Real-time download tracking and logging
- Proper authentication and session management
- File permission checking and security controls

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: Shadcn/ui, Radix UI
- **Styling**: Tailwind CSS with CSS variables for theming, supporting dark/light modes.
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editor**: ReactQuill for script content editing.
- **UI/UX Decisions**: Responsive design (mobile-first), intuitive dashboards, tabbed interfaces, modal dialogs, drag-and-drop file uploads, dynamic form builder with multi-step wizards, and analytics dashboards with interactive charts and geographic visualization. Visual design uses a light blue and red color scheme with gradient effects and glassmorphism.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Custom system with bcrypt hashing, session management (PostgreSQL store), and role-based access control (admin, editor, member). Admin approval for new users.
- **File Handling**: Multer for multipart file uploads with memory storage, supporting various file types (audio, video, documents, images). Enhanced file management includes hierarchical folders, versioning, tagging, and checksum validation. File storage in database via Base64 encoding (50MB limit per upload).
- **API Design**: RESTful API with JSON responses.
- **Core Entities**: Users, Projects, Episodes, Scripts, Radio Stations, Topics, Files, File Folders, Free Project Access, Themes, Onboarding Form Config, Onboarding Form Responses.

### Build System
- **Frontend Bundler**: Vite
- **Server Execution (Dev)**: TSX
- **Server Bundler (Prod)**: ESBuild

## External Dependencies

- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation
- **wouter**: Lightweight React router
- **multer**: File upload handling
- **@radix-ui/react-***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **react-quill**: Rich text editor
- **drizzle-kit**: Database migration and schema management
- **Recharts**: For interactive charts in analytics.