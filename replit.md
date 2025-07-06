# SMART Radio Content Hub

## Overview

SMART Radio Content Hub is a comprehensive content management system designed for radio broadcasting. It provides a centralized platform for managing radio projects, episodes, scripts, and radio station access. The application supports file uploads, user management, and content organization with a focus on radio production workflows.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editor**: ReactQuill for script content editing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Custom authentication system with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL store (fallback to memory store)
- **Authorization**: Role-based access control (admin, editor, member)
- **File Handling**: Multer for multipart file uploads with memory storage
- **API Design**: RESTful API with JSON responses

### Build System
- **Bundler**: Vite for frontend development and building
- **Development**: TSX for TypeScript execution
- **Production**: ESBuild for server bundling

## Key Components

### Database Schema
The application uses a relational database with the following core entities:
- **Users**: User authentication and profile management
- **Projects**: Top-level content organization units
- **Episodes**: Individual radio episodes linked to projects
- **Scripts**: Content scripts with rich text support and workflow status
- **Radio Stations**: External radio station entities with contact information
- **Topics**: Tagging system for content categorization
- **Files**: Centralized file storage with entity relationships
- **Free Project Access**: Access control for radio stations to specific projects

### File Management System
- Supports multiple file types (audio, video, documents, images)
- Entity-based file organization (project-level, episode-level, script-level)
- Base64 encoding for file storage in database
- File size limit of 50MB per upload
- Automatic filename generation with timestamps

### User Interface
- Responsive design with mobile-first approach
- Dark/light theme support with system preference detection
- Dashboard with statistics and quick actions
- Tabbed interfaces for detailed content management
- Modal dialogs for content creation and editing
- File upload components with drag-and-drop support

## Data Flow

### Content Creation Workflow
1. Users create Projects as organizational containers
2. Episodes are created within Projects with metadata
3. Scripts are authored with rich text content and linked to Projects
4. Files can be uploaded at Project, Episode, or Script levels
5. Radio Stations can be granted access to specific Projects

### API Data Flow
1. Frontend makes HTTP requests to `/api/*` endpoints
2. Express middleware handles request logging and error handling
3. Drizzle ORM executes type-safe database queries
4. Responses are formatted as JSON with appropriate HTTP status codes
5. React Query caches responses and manages state synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation
- **wouter**: Lightweight React router
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/react-***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **react-quill**: Rich text editor for script content

### Development Dependencies
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production server bundling
- **drizzle-kit**: Database migration and schema management

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- TSX for running TypeScript server code
- Database migrations managed through Drizzle Kit
- Replit-specific configuration for cloud development

### Production Build
1. Frontend assets built with Vite to `dist/public`
2. Server code bundled with ESBuild to `dist/index.js`
3. Static assets served from Express server
4. Database connection via Neon serverless PostgreSQL

### Environment Configuration
- `DATABASE_URL` required for PostgreSQL connection
- Automatic database provisioning check on startup
- Port configuration for Replit deployment (5000 → 80)
- Session management with PostgreSQL session store

## Recent Changes

- January 6, 2025: Removed Replit authentication and implemented custom authentication system
- January 6, 2025: Created custom login/register page with role-based access control
- January 6, 2025: Updated navigation to hide Users tab for non-admin users
- January 6, 2025: First registered user automatically becomes admin
- January 6, 2025: Implemented secure password hashing with bcrypt
- January 6, 2025: Enhanced authentication system with complete admin user management capabilities
- January 6, 2025: Added user verification workflow - new users require admin approval before login
- January 6, 2025: Implemented comprehensive Users page with tabbed interface for managing all users and pending verifications
- January 6, 2025: Added admin-only controls for user verification, suspension, activation, and deletion
- January 6, 2025: Successfully tested and deployed complete admin user management system
- January 21, 2025: Redesigned all main pages (Episodes, Projects, Scripts, Users, Radio Stations) with consistent blue-emerald color scheme and compact headers
- January 21, 2025: Fixed script editor functionality with consistent ReactQuill implementation across dashboard and scripts page
- January 21, 2025: Added episode selection support to scripts (optional relationship)
- January 21, 2025: Enhanced script viewer with proper read-only mode and improved formatting
- January 21, 2025: Reduced header heights across all pages for better space utilization and enhanced visual consistency
- January 21, 2025: Transformed Users and Radio Stations pages with modern card layouts, enhanced search, and professional styling
- January 21, 2025: Transformed Scripts page with status filtering, enhanced search, and modern workflow management
- January 21, 2025: Transformed Projects page with modern card design, statistical indicators, and enhanced search functionality
- January 21, 2025: Optimized both episode and project cards with improved spacing, better contrast, and refined interactions
- January 21, 2025: Enhanced glassmorphism effects with backdrop blur and sophisticated hover animations
- January 21, 2025: Implemented comprehensive episode management with create, edit, delete functionality
- January 21, 2025: Enhanced episode file upload and organization system with project-based structure
- December 19, 2024: Successfully completed migration from Replit Agent to Replit environment
- June 21, 2025: Enhanced navbar with modern gradient design, improved icons, and smooth animations
- June 21, 2025: Completely redesigned dashboard with fresh modern look featuring hero section, enhanced stats cards with progress indicators, and improved visual hierarchy
- June 21, 2025: Added glassmorphism effects, backdrop blur, and hover animations throughout dashboard interface
- June 21, 2025: Implemented comprehensive color gradients from indigo to purple to pink across UI components
- June 21, 2025: Enhanced user experience with interactive elements, scale transforms, and smooth transitions
- December 19, 2024: Successfully migrated project from Replit Agent to Replit environment
- December 19, 2024: Configured PostgreSQL database and applied migrations
- December 19, 2024: Fixed script file upload routing and file association with projects
- December 19, 2024: Updated project statistics to properly count script files in project management page
- December 19, 2024: Fixed file upload routing - audio/video files go to Episodes, documents go to Scripts
- December 19, 2024: Files now display correctly in project detail view under Episodes and Scripts tabs
- December 19, 2024: Resolved script upload 404 errors by correcting endpoint routing
- December 19, 2024: Project badges now show accurate counts including both records and uploaded files
- December 19, 2024: Fixed script editor save functionality and removed debug logging
- December 19, 2024: Enhanced script display with proper HTML formatting and removed irrelevant author data
- December 19, 2024: Added ScriptFileManager component for individual script file uploads
- December 19, 2024: Improved script interface with better layout and file management capabilities

## Changelog

```
Changelog:
- June 20, 2025. Initial setup
- December 19, 2024. Migration to Replit environment completed
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```