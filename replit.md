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

- December 19, 2024: Successfully migrated project from Replit Agent to Replit environment
- December 19, 2024: Configured PostgreSQL database and applied migrations
- December 19, 2024: Modified project detail view to focus on Episodes and Scripts organization
- December 19, 2024: Removed upload functionality from project details view per user preference

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