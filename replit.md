# LevelUp - Gamified Student Productivity App

## Overview

LevelUp is a gamified student productivity application designed to help students manage their academic tasks through game-like mechanics. The app features a coin/XP reward system, streak tracking, and various productivity tools including a task planner, notes system, focus timer, alarm management, and a virtual shop for spending earned rewards.

The application follows a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for gamification state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend is organized as a single-page application with the following pages:
- Dashboard (home/overview)
- Planner (task management)
- Notes (note-taking with CRUD operations)
- Focus (Pomodoro-style timer)
- Social (leaderboards)
- Alarm (alarm management)
- Shop (spend coins on rewards)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints under `/api/` prefix
- **Development**: Vite middleware for HMR in development mode
- **Production**: Static file serving from built assets

Key API endpoints:
- `/api/alarms` - CRUD operations for alarms
- `/api/notes` - CRUD operations for notes
- `/api/users` - User management (authentication ready)

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (via Neon serverless connector)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with `db:push` command

Current schema includes:
- `users` table (id, username, password)
- `alarms` table (user alarms with time, sound, repeat settings)
- `notes` table (user notes with title, body, tags)

### Storage Abstraction
The `server/storage.ts` file implements an `IStorage` interface with a `MemStorage` implementation for development. This design allows easy switching to database storage when PostgreSQL is connected.

### Shared Code
The `shared/` directory contains:
- Database schema definitions (Drizzle)
- Zod validation schemas (via drizzle-zod)
- TypeScript types exported for both frontend and backend use

### Build System
- Development: `tsx` for server, Vite for client with HMR
- Production: esbuild bundles server to `dist/index.cjs`, Vite builds client to `dist/public`
- Path aliases: `@/` for client source, `@shared/` for shared code, `@assets/` for static assets

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **@neondatabase/serverless**: Neon's serverless PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store (available but not yet implemented)

### UI Components
- **Radix UI**: Complete primitive component library (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui**: Pre-styled component system built on Radix
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component

### Form Handling
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Validation resolvers
- **Zod**: Schema validation

### Utilities
- **date-fns**: Date manipulation
- **class-variance-authority**: CSS variant management
- **clsx/tailwind-merge**: Conditional class handling

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Source mapping (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)