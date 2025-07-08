# Delivery Express Management System

## Overview

This is a full-stack web application for managing a local delivery network. The system connects merchants with delivery personnel, providing comprehensive management tools for tracking deliveries, managing users, and handling financial operations. Built with React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: TSX for TypeScript execution

## Key Components

### Database Schema
- **Users**: Stores user authentication data from Replit Auth
- **Sessions**: Manages user sessions for authentication
- **Merchants**: Business entities that request deliveries
- **Deliverers**: Personnel who fulfill deliveries
- **Deliveries**: Core delivery records with relationships

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- Middleware for route protection
- User profile management

### API Structure
- RESTful endpoints for all entities
- Protected routes requiring authentication
- CRUD operations for merchants, deliverers, and deliveries
- Dashboard statistics and reporting endpoints

### UI Components
- Responsive design with mobile-first approach
- Consistent component library using Shadcn/ui
- Modal dialogs for forms and confirmations
- Toast notifications for user feedback
- Data tables with search and filtering

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Dashboard**: Aggregated statistics fetched from multiple endpoints
3. **Entity Management**: CRUD operations through API endpoints with optimistic updates
4. **Real-time Updates**: Query invalidation triggers UI updates after mutations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL driver for Neon database
- **drizzle-orm**: Type-safe SQL toolkit and ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **zod**: Schema validation and type safety

### Development Tools
- **Vite**: Build tool and development server
- **ESBuild**: JavaScript bundler for production
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development
- Vite development server with hot module replacement
- TSX for TypeScript execution without compilation
- Environment-based configuration

### Production
- Vite build generates optimized static assets
- ESBuild bundles server code with external dependencies
- Single artifact deployment with static file serving

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secret management
- Replit-specific environment variables for authentication

## Changelog

- July 08, 2025. Initial setup
- July 08, 2025. Implemented local authentication system with JWT tokens for all user types (admin, merchant, deliverer)

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication System

### Local Authentication
- **Admin Login**: admin@deliveryexpress.com / admin123
- **Merchant Login**: Email and phone number from database
- **Deliverer Login**: Email and phone number from database

### Test Credentials
- **Merchant**: joao@padaria.com / 123456789
- **Deliverer**: maria@entregador.com / 987654321

### Token Management
- JWT tokens with 24-hour expiration
- Stored in localStorage with user type identification
- Automatic token validation and cleanup on expiration