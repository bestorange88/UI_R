# ARX Trading Platform

## Overview

ARX is a comprehensive cryptocurrency and financial trading platform built with a modern full-stack architecture. The platform provides trading functionality for cryptocurrencies, stocks, and futures, along with features like KYC verification, customer service chat, OTC trading, quantitative strategies, and an admin management dashboard.

The application follows a client-server architecture with React on the frontend and Express.js on the backend, using PostgreSQL for data persistence and Supabase for authentication and real-time features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM for client-side navigation
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default)
- **Internationalization**: i18next with support for 9 languages (zh-TW, zh-CN, en, es, fr, de, ja, ko, ar)
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints prefixed with `/api`
- **Static Serving**: Express static middleware serves built frontend in production

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit manages database migrations in `./migrations`
- **Type Safety**: Drizzle-zod generates Zod schemas from database tables

### Authentication & Authorization
- **Primary Auth**: Supabase Auth handles user authentication
- **Auth Methods**: Email, phone (SMS OTP), and wallet-based authentication
- **Admin Auth**: Separate admin authentication system with session management and timeout
- **Session Storage**: Connect-pg-simple for server-side sessions

### Real-time Features
- **Price Updates**: WebSocket connections to OKX exchange for live cryptocurrency prices
- **Chat System**: Server-Sent Events (SSE) for customer service real-time messaging
- **Subscriptions**: Supabase Realtime for database change notifications

### Key Design Patterns
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` allows swapping implementations
- **Component Organization**: Feature-based component folders under `client/src/components/`
- **Service Layer**: API services in `client/src/services/` handle external data fetching

## External Dependencies

### Third-Party Services
- **Supabase**: Authentication, database hosting, real-time subscriptions, edge functions, and file storage
- **OKX Exchange API**: Live cryptocurrency market data and WebSocket price feeds

### Key NPM Packages
- **@supabase/supabase-js**: Supabase client SDK
- **drizzle-orm / drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Async state management
- **react-router-dom**: Client-side routing
- **i18next / react-i18next**: Internationalization framework
- **zod**: Runtime type validation
- **date-fns**: Date manipulation utilities
- **qrcode.react**: QR code generation for deposit addresses

### Development Tools
- **Vite**: Build tool with HMR support
- **esbuild**: Server-side bundling for production
- **TypeScript**: Type checking across the entire codebase