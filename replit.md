# SMART Radio Content Hub

## Overview
SMART Radio Content Hub is a comprehensive content management system for radio broadcasting. It centralizes the management of radio projects, episodes, scripts, and radio station access. Key capabilities include an advanced form builder for dynamic user onboarding, file management with hierarchical organization and versioning, robust user management with role-based access control, and detailed content organization tailored for radio production workflows. The project aims to streamline content creation, distribution, and user engagement for radio broadcasters, offering a unified platform for diverse content management needs and strong analytics for user onboarding.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: Shadcn/ui leveraging Radix UI
- **Styling**: Tailwind CSS with CSS variables
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editor**: ReactQuill
- **UI/UX Decisions**: Responsive design (mobile-first), dark/light theme support, dashboard with statistics, tabbed interfaces, modal dialogs, drag-and-drop file uploads, dynamic form builder, multi-step onboarding wizard, analytics dashboard with interactive charts and geographic visualization. Visual design uses a light blue and red color scheme with gradient effects and glassmorphism. Page headers are compact with gradient text.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Custom system with bcrypt, Express sessions, and role-based access control (admin, editor, member)
- **File Handling**: Multer for multipart file uploads
- **API Design**: RESTful API with JSON responses
- **Key Features**:
    - **Database Schema**: Users, Projects, Episodes, Scripts, Radio Stations, Topics, Files (with folder organization, versioning, metadata), File Folders, Free Project Access, Themes, Onboarding Form Config, Onboarding Form Responses.
    - **File Management**: Hierarchical folder structure, support for multiple file types (audio, video, docs, images), entity-based organization (projects, episodes, scripts, stations), file versioning, tagging, access levels, checksum validation, full-text search, Base64 encoding for storage (50MB limit per upload).
    - **Dynamic Onboarding**: Configurable forms with versioning and question management, analytics dashboard for user responses and geographic distribution.
    - **Notifications**: Real-time WebSocket-based notification system for admin users.
    - **Analytics**: Comprehensive download tracking system with admin dashboard for file download patterns, user activity, usage statistics, and project-specific analytics with interactive charts.
    - **Content Workflow**: Projects as containers, Episodes within Projects, Scripts linked to Projects, files at various levels, controlled access for Radio Stations.

### Build System
- **Frontend Bundler**: Vite
- **TypeScript Execution**: TSX for development
- **Server Bundling**: ESBuild for production

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation
- **wouter**: React router
- **multer**: File upload handling
- **@radix-ui/react-***: Accessible UI primitive components
- **tailwindcss**: CSS framework
- **class-variance-authority**: Component variant management
- **react-quill**: Rich text editor
- **recharts**: Charting library for analytics (for interactive charts)