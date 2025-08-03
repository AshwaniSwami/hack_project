# SMART Radio Content Hub

## Overview

SMART Radio Content Hub is a comprehensive content management system for radio broadcasting, integrating dynamic user onboarding. It centralizes management of radio projects, episodes, scripts, and radio station access. Key capabilities include an advanced form builder for customized user registration, file uploads, user management with role-based access control, and content organization tailored for radio production workflows. The platform aims to streamline radio content creation and distribution, offering robust tools for content producers and station managers.

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