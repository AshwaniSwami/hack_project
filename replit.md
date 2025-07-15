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
- **Users**: User authentication and profile management with role-based access control
- **Projects**: Project organization with theme categorization
- **Episodes**: Individual radio episodes linked to projects with premium content support
- **Scripts**: Content scripts with rich text support, workflow status, and topic associations
- **Radio Stations**: External radio station entities with contact information and project access
- **Topics**: Tagging system for content categorization and script classification
- **Files**: Enhanced file storage with folder organization, versioning, and metadata
- **File Folders**: Hierarchical folder structure for organizing files within entities
- **Free Project Access**: Access control system for radio stations to specific projects
- **Themes**: Visual theme system for project categorization and organization

### File Management System
- **Enhanced File Organization**: Hierarchical folder structure with nested folders support
- **Multiple File Types**: Supports audio, video, documents, images with proper MIME type detection  
- **Entity-based Organization**: Files organized by projects, episodes, scripts, and radio stations
- **Folder Management**: Create, organize, and manage file folders within entities
- **Advanced Features**: File versioning, tagging, access levels, and checksum validation
- **Search Capabilities**: Full-text search across filenames, descriptions, and tags
- **Storage**: Base64 encoding for file storage in database with 50MB per upload limit
- **Performance Optimizations**: File metadata separation, download tracking, and archive support

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

- July 15, 2025: Enhanced notification system with improved user experience and optimized interface design
- July 15, 2025: Removed irrelevant text (priority badges, emoji icons) and simplified notification display for cleaner appearance
- July 15, 2025: Optimized notification click behavior to automatically mark as read and redirect to Users page for verification
- July 15, 2025: Improved dark mode visibility across all notification components with better contrast and readability
- July 15, 2025: Streamlined notification actions - removed redundant buttons and kept only essential delete functionality
- July 15, 2025: Enhanced notification messages to be concise and actionable without unnecessary details
- July 15, 2025: Implemented comprehensive real-time notification system with WebSocket integration for admin users
- July 15, 2025: Added notification popup component with auto-dismiss functionality and priority-based visual indicators
- July 15, 2025: Enhanced notification bell with organized sorting (unread first, then by priority and date)
- July 15, 2025: Implemented mark-as-read functionality for both individual notifications and bulk operations
- July 15, 2025: Added WebSocket server with admin-only connection management for instant notification delivery
- July 15, 2025: Created notification management system with improved visual design and user interaction
- July 14, 2025: Streamlined admin dashboard by removing system health section and security status for cleaner, focused design
- July 14, 2025: Added relevant Recent Activity section with content updates, user access, and platform health indicators
- July 14, 2025: Enhanced welcome card by replacing security status with team member count for more useful information
- July 14, 2025: Fixed missing icon imports (Clock, Shield, Database, Server) resolving dashboard display errors
- July 13, 2025: Successfully completed migration from Replit Agent to Replit environment with full PostgreSQL database setup and database migrations applied
- July 13, 2025: Enhanced admin dashboard with fresh modern design removing unwanted components (health indicators, system urgent items)
- July 13, 2025: Redesigned dashboard welcome card with gradient background and improved visual hierarchy
- July 13, 2025: Removed hover scale effects from stats cards for cleaner appearance and better user experience
- July 13, 2025: Added quick actions section and platform overview with simplified content distribution metrics
- July 12, 2025: Fixed dark mode text visibility issues on Users and Radio Stations pages with proper contrast improvements
- July 12, 2025: Enhanced table headers, badges, and content text with proper dark mode styling across all pages
- July 12, 2025: Applied consistent dark mode variants to ensure all text elements are properly visible in both light and dark themes
- July 12, 2025: Fixed dark mode text visibility issues on Projects page including theme creation dialog and project cards
- July 12, 2025: Enhanced theme selection dropdowns with proper dark mode styling (dark background, light text)
- July 12, 2025: Updated ProjectCard component with comprehensive dark mode support for all text elements and backgrounds
- July 12, 2025: Fixed theme management dialog background and text colors for better visibility in dark mode
- July 12, 2025: Improved project statistics cards and description sections with proper dark mode color schemes
- July 12, 2025: Fixed dark mode text visibility issues in Users page - enhanced table headers, table cells, badges, and card backgrounds for proper contrast in dark mode
- July 12, 2025: Completed comprehensive text visibility fixes across all pages (Users, Radio Stations, Episodes, Projects, Scripts)
- July 12, 2025: Fixed dark mode text visibility issues on Episodes page including episode cards, file upload component, and file list component
- July 12, 2025: Enhanced episode-file-upload component with proper dark mode styling for labels, text, and backgrounds
- July 12, 2025: Updated file-list component with comprehensive dark mode support for all text elements, cards, and file items
- July 12, 2025: Fixed Episodes page episode cards (both grid and list views) with proper dark mode text colors and backgrounds
- July 12, 2025: Enhanced Episodes page tabs content with proper dark mode styling for upload and files sections
- July 12, 2025: Fixed dark mode text visibility issues on Scripts page including script cards, script editor, and script file upload components  
- July 12, 2025: Enhanced script-editor component with proper dark mode styling for status badges, content areas, and read-only mode
- July 12, 2025: Updated script-file-upload component with comprehensive dark mode support for file selection and upload areas
- July 12, 2025: Fixed Scripts page script cards (both grid and list views) with proper dark mode text colors and hover effects
- July 12, 2025: Enhanced script-file-manager component with proper dark mode styling for file lists and upload sections
- July 12, 2025: Enhanced dark mode text colors with proper contrast (gray-500 → gray-400, gray-600 → gray-400, gray-700 → gray-200)
- July 12, 2025: Fixed all table headers, text content, and placeholder text to display properly in dark mode
- July 12, 2025: Applied consistent dark mode variants to all gray text elements for better readability
- July 12, 2025: Enhanced visual design with light blue and red color scheme throughout the platform
- July 12, 2025: Reduced page header sizes from text-4xl/text-3xl to text-2xl for better proportions
- July 12, 2025: Updated all page headers with sky-blue to red gradient text effects
- July 12, 2025: Enhanced navbar with light blue and red color accents and improved visual hierarchy
- July 12, 2025: Applied light blue and red theme to dashboard background gradients
- July 12, 2025: Fixed dark mode text visibility issues across all pages with proper contrast
- July 12, 2025: Improved header integration by reducing padding and making them more compact
- July 12, 2025: Enhanced dark mode colors using lighter gray tones (avoiding extreme dark colors)
- July 12, 2025: Fixed Scripts page theme consistency to match other pages with light blue and red accents
- July 12, 2025: Optimized dark mode CSS variables for better readability and user experience
- July 12, 2025: Applied consistent Scripts page styling (search functionality and colors) across all pages
- July 12, 2025: Updated Projects, Episodes, Users, and Radio Stations pages with uniform light blue and red theme
- July 12, 2025: Standardized search bars with proper dark mode support and sky-blue focus colors
- July 12, 2025: Enhanced all page cards with consistent backdrop-blur effects and dark mode compatibility
- July 12, 2025: Removed "select all" functionality from both Episodes and Scripts pages for cleaner interface
- July 12, 2025: Created centralized color management system in @/lib/colors.ts for consistent theming
- July 12, 2025: Enhanced color storage and management with helper functions for status colors, gradients, and card styles
- July 12, 2025: Updated all pages to use the new centralized color system for better maintainability
- July 12, 2025: Enhanced visual design with light blue and red color scheme throughout the platform
- July 12, 2025: Reduced page header sizes from text-4xl/text-3xl to text-2xl for better proportions
- July 12, 2025: Updated all page headers with sky-blue to red gradient text effects
- July 12, 2025: Enhanced navbar with light blue and red color accents and improved visual hierarchy
- July 12, 2025: Applied light blue and red theme to dashboard background gradients
- July 12, 2025: Fixed dark mode text visibility issues across all pages with proper contrast
- July 12, 2025: Improved header integration by reducing padding and making them more compact
- July 12, 2025: Enhanced dark mode colors using lighter gray tones (avoiding extreme dark colors)
- July 12, 2025: Fixed Scripts page theme consistency to match other pages with light blue and red accents
- July 12, 2025: Optimized dark mode CSS variables for better readability and user experience
- July 12, 2025: Applied consistent Scripts page styling (search functionality and colors) across all pages
- July 12, 2025: Updated Projects, Episodes, Users, and Radio Stations pages with uniform light blue and red theme
- July 12, 2025: Standardized search bars with proper dark mode support and sky-blue focus colors
- July 12, 2025: Enhanced all page cards with consistent backdrop-blur effects and dark mode compatibility
- July 12, 2025: Removed "select all" functionality from both Episodes and Scripts pages for cleaner interface
- July 12, 2025: Created centralized color management system in @/lib/colors.ts for consistent theming
- July 12, 2025: Enhanced color storage and management with helper functions for status colors, gradients, and card styles
- July 12, 2025: Updated all pages to use the new centralized color system for better maintainability
- January 12, 2025: Transformed application design to light blue color scheme with whitish transparent navbar for NGO-appropriate branding
- January 12, 2025: Updated all page headers (Projects, Episodes, Scripts, Users, Radio Stations) with light blue theme and white backgrounds
- January 12, 2025: Enhanced navbar with whitish transparent background and dark text for better readability
- January 12, 2025: Redesigned dashboard with light blue-sky-cyan gradient backgrounds across all pages
- January 12, 2025: Updated admin dashboard KPI cards to use light blue color palette (blue/sky/cyan)
- January 12, 2025: Implemented consistent light blue theme throughout the entire platform
- January 12, 2025: Enhanced visual design system with light blue color palette for professional NGO appearance
- January 12, 2025: Updated CSS variables and glassmorphism effects to use lighter blue tones
- January 12, 2025: Transformed all page headers with improved typography and light blue accents
- July 12, 2025: Enhanced visual design with light blue and red color scheme throughout the platform
- July 12, 2025: Reduced heading sizes across all pages from text-4xl/text-3xl to text-2xl for better visual balance
- July 12, 2025: Updated navbar with light blue transparent background and sky-to-red gradient branding
- July 12, 2025: Applied light blue and red color gradients to page headers and navigation elements
- July 12, 2025: Enhanced dashboard background with sky-blue-to-rose gradient for modern appearance
- July 11, 2025: Successfully completed migration from Replit Agent to Replit environment with full database setup and PostgreSQL connectivity
- July 11, 2025: Applied database migrations and verified all core functionality including user registration and authentication
- January 8, 2025: Implemented comprehensive role-based dashboard system with specialized views for Admin, Editor, Contributor, and Member roles
- January 8, 2025: Created floating action button (FAB) for Admin and Editor roles with quick access to create Projects, Episodes, and Scripts
- January 8, 2025: Designed Admin dashboard with platform health KPIs, system-wide urgent items, user role summaries, and global activity feed
- January 8, 2025: Built Editor dashboard with scripts awaiting review, content workflow snapshots, team activity feeds, and top performance overview
- January 8, 2025: Developed Contributor dashboard with personal workflow management, script status tracking, and project contribution overview
- January 8, 2025: Created Member dashboard focused on content discovery with trending content, recommendations, and category exploration
- January 8, 2025: Enhanced user experience with role-specific interfaces optimized for each user type's primary workflow needs
- January 8, 2025: Fixed dashboard crashes by disabling analytics queries for non-admin users and correcting syntax errors
- January 8, 2025: Completely redesigned Member dashboard with clean, minimal interface featuring daily inspirational quotes, simple stats, and call-to-action buttons
- January 8, 2025: Simplified member experience by removing overwhelming content and focusing on motivational elements and easy navigation
- January 8, 2025: Restricted script and episode access for normal users - only admin, editor, and contributor roles can access these features
- January 8, 2025: Enhanced profile functionality with dropdown menu showing user ID, role, and logout option
- January 8, 2025: Fixed navigation restrictions and member dashboard button functionality
- January 9, 2025: Fixed logout functionality by implementing proper logout method in useAuth hook
- January 9, 2025: Completely redesigned member dashboard with proper radio-themed icons (Podcast, Radio, Mic, Music, Volume2)
- January 9, 2025: Removed "recently published content" section and achievements system from member dashboard
- January 9, 2025: Simplified dashboard to focus on single "Explore Projects" action with enhanced user engagement features
- January 9, 2025: Repositioned level progress system and removed member level from stats cards for cleaner layout
- January 9, 2025: Added progress level display to navbar with level indicator and progress bar for all users
- January 9, 2025: Restricted notification bell to admin users only - removed for normal users and editors
- January 9, 2025: Enhanced mobile navbar with detailed progress view showing level advancement
- January 7, 2025: Implemented comprehensive download tracking system with analytics dashboard for admin users to monitor file download patterns, user activity, and usage statistics
- January 7, 2025: Added download logs table with detailed tracking including user info, IP addresses, download duration, and status
- January 7, 2025: Created admin-only Analytics page with overview, user downloads, file statistics, and activity logs tabs
- January 7, 2025: Enhanced file permissions to allow members to download files while tracking all download activity
- January 7, 2025: Updated file manager components to show download counts and use new tracking endpoints
- January 7, 2025: Added project-specific analytics to track which project each downloaded file belongs to
- January 7, 2025: Enhanced analytics dashboard with Projects tab showing download statistics aggregated by project
- January 7, 2025: Improved analytics displays to show entity IDs and project associations for better content tracking
- January 7, 2025: Added comprehensive visual analytics with interactive charts using Recharts library
- January 7, 2025: Implemented Charts tab with area charts for downloads over time, pie charts for content type distribution, and bar charts for hourly download patterns
- January 7, 2025: Created dedicated Scripts analytics tab to track script downloads by project and status
- January 7, 2025: Enhanced analytics with script-specific tracking showing which project scripts are downloaded most
- January 7, 2025: Added visual charts for script downloads by project and status distribution
- January 7, 2025: Simplified script analytics to focus on project-based tracking as requested by user
- January 7, 2025: Enhanced script analytics to clearly show which project each downloaded script belongs to
- January 7, 2025: Redesigned Scripts tab with prominent project-based script download tracking and visual charts
- January 7, 2025: Enhanced visual experience with gradient cards, progress bars, and color-coded project identification
- January 7, 2025: Added dual chart system (bar chart and pie chart) for comprehensive project script download visualization  
- January 7, 2025: Optimized individual script display to clearly show project associations with visual indicators
- January 10, 2025: Fixed timezone synchronization issues in download tracking by converting database timestamps to timestamptz (timezone-aware)
- January 10, 2025: Resolved project name display issues in analytics by implementing proper JOIN operations and project mapping
- January 10, 2025: Enhanced date/time formatting across all analytics tabs with proper year display and timezone handling
- January 10, 2025: Optimized analytics SQL queries for better performance and accurate data association between files and projects
- January 10, 2025: Added comprehensive interactive charts to Projects and Episodes tabs in analytics dashboard
- January 10, 2025: Implemented bar charts, pie charts, and area charts for visual data analysis across all content types
- January 10, 2025: Removed data transfer graphs and enhanced project distribution visualization for episodes similar to scripts tab
- January 10, 2025: Created unified visual experience with gradient backgrounds and responsive chart design throughout analytics
- January 6, 2025: Implemented advanced file storage system with folder organization, search, and enhanced metadata
- January 6, 2025: Enhanced file management with versioning, tagging, access levels, and checksum validation
- January 6, 2025: Fixed UUID validation error in script creation by using authenticated user ID
- January 6, 2025: Added comprehensive API endpoints for folder management and file search functionality
- January 6, 2025: Optimized database schema with proper indexing for improved performance
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
- January 11, 2025: Fixed project detail view to properly display script content instead of non-existent description field
- January 11, 2025: Optimized project page with modern design and enhanced description visibility on both landing page and detail view
- January 11, 2025: Removed project descriptions from all creation forms and optimized episode/script description positioning in project details
- January 11, 2025: Restricted radio station creation, editing, and deletion to admin and editor roles only - members can only view station information
- January 11, 2025: Removed level bar and progress tracking system for all users from the navbar
- January 11, 2025: Cleaned up all project selection dropdowns to show only project names without descriptions in episode, script, and file upload forms
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
- January 21, 2025: Optimized project cards for large datasets - removed files display, made cards more compact with 4-column layout and reduced padding for better space efficiency
- December 19, 2024: Successfully completed migration from Replit Agent to Replit environment
- June 21, 2025: Enhanced navbar with modern gradient design, improved icons, and smooth animations
- June 21, 2025: Completely redesigned dashboard with fresh modern look featuring hero section, enhanced stats cards with progress indicators, and improved visual hierarchy
- June 21, 2025: Added glassmorphism effects, backdrop blur, and hover animations throughout dashboard interface
- June 21, 2025: Implemented comprehensive color gradients from indigo to purple to pink across UI components
- June 21, 2025: Enhanced user experience with interactive elements, scale transforms, and smooth transitions
- January 21, 2025: Fixed script creation authentication issue by adding proper isAuthenticated middleware to script API routes
- January 21, 2025: Fixed UUID type mismatch in scripts table - changed authorId from uuid to varchar to match users table schema
- January 21, 2025: Removed subproject feature entirely from the system to simplify project management
- January 21, 2025: Enhanced Overview tab with project summary, statistics, and recent activity display  
- January 21, 2025: Fixed database schema by removing subproject relations and hierarchy functionality
- January 6, 2025: Successfully migrated project from Replit Agent to Replit environment with authentication fixes
- January 6, 2025: Added comprehensive theme system for project categorization with role-based access control
- January 6, 2025: Implemented theme filtering, management interface, and project-theme associations
- January 6, 2025: Only admin and editor roles can create/edit themes, members can view and filter by themes
- January 6, 2025: Removed description field from theme creation for cleaner interface
- January 6, 2025: Fixed theme visibility optimization with improved scrolling and layout
- January 6, 2025: Fixed UUID validation error for project theme assignment
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