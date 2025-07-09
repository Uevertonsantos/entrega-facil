# Entrega Fácil Management System

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
- July 08, 2025. Fixed authentication middleware and token handling for all API endpoints
- July 08, 2025. Corrected logout functionality to properly clear tokens and redirect users
- July 08, 2025. Improved error handling for duplicate email addresses in registration forms
- July 08, 2025. Enhanced user feedback with meaningful error messages for form validation
- July 08, 2025. Fixed endpoint routing conflicts - moved specific endpoints before generic ones (/current before /:id)
- July 08, 2025. Resolved portal access issues for both deliverer and merchant applications
- July 08, 2025. Added CNPJ/CPF field to merchant registration with automatic data fetching from Receita Federal API
- July 08, 2025. Implemented CNPJ validation service with automatic form filling for business information
- July 08, 2025. Fixed critical schema errors - added missing type and planValue fields to merchant database table
- July 08, 2025. Resolved unhandledrejection errors in CNPJ lookup functionality with improved error handling
- July 09, 2025. Corrected critical API request parameter order issue in all frontend files (apiRequest now uses url, method, data)
- July 09, 2025. Fixed merchant and deliverer login authentication to use password field instead of phone field
- July 09, 2025. Added delete functionality for merchants and deliverers with confirmation dialogs and error handling
- July 09, 2025. Enhanced UI with delete buttons (trash icon) for both merchants and deliverers management pages
- July 09, 2025. Implemented automatic pickup address filling from merchant establishment data
- July 09, 2025. Added CEP field to merchant schema for better address geocoding
- July 09, 2025. Created robust geocoding system prioritizing street names over CEP for interior cities
- July 09, 2025. Built street-specific coordinate database for Conde and common interior street names
- July 09, 2025. Integrated ViaCEP API for fallback geocoding without requiring paid services
- July 09, 2025. Added multiple subscription plan options: weekly, monthly, quarterly, annual, basic, and premium
- July 09, 2025. Expanded admin settings with comprehensive plan configuration for different subscription types
- July 09, 2025. Created dedicated plan management page with detailed plan configuration including delivery limits
- July 09, 2025. Implemented visual plan cards with features, pricing, and delivery limits (unlimited or specific numbers)
- July 09, 2025. Added plan editor modal for creating/editing plans with custom features and delivery restrictions
- July 09, 2025. Built complete installer system for client deployment with local SQLite database
- July 09, 2025. Implemented automatic data synchronization from client installations to admin panel
- July 09, 2025. Added client sync API endpoints for receiving merchants, deliverers, and deliveries data
- July 09, 2025. Created Windows service integration for auto-start functionality
- July 09, 2025. Developed comprehensive installer with business configuration and license key validation
- July 09, 2025. Added new fields "Vehicle Model" and "Vehicle Plate" to deliverer registration and management
- July 09, 2025. Updated all interfaces to use "Taxa da Plataforma" instead of "Comissão" for consistency
- July 09, 2025. Enhanced new deliverer modal with complete form including vehicle information
- July 09, 2025. Implemented admin login with username instead of email for enhanced security
- July 09, 2025. Created comprehensive email recovery system with Gmail SMTP integration
- July 09, 2025. Built forgot password and reset password functionality with secure token system
- July 09, 2025. Added email configuration panel for Gmail SMTP setup with test functionality
- July 09, 2025. Enhanced admin user management with dedicated admin_users table and proper authentication
- July 09, 2025. Implemented secure admin credentials management with form validation and password hashing
- July 09, 2025. Added dynamic admin credentials editing with real-time validation and security best practices
- July 09, 2025. Enhanced test credentials page with improved UI/UX and proper form handling
- July 09, 2025. Completed comprehensive rebranding from "Delivery Express" to "Entrega Fácil" across all system files
- July 09, 2025. Updated all references in codebase, installer, documentation, and configuration files
- July 09, 2025. Maintained PWA functionality with updated manifest and service worker cache names
- July 09, 2025. Fixed all HTML meta tags, email addresses, and URLs to reflect new brand identity
- July 09, 2025. Updated PWA icons to display "ENTREGA" text instead of "DELIVERY" for mobile app installation
- July 09, 2025. Corrected icon-512x512.svg dimensions and positioning for proper PWA functionality
- July 09, 2025. Incremented service worker cache version to force icon updates on client devices
- July 09, 2025. Implemented comprehensive payment method system for deliveries
- July 09, 2025. Added payment_method field to delivery database schema with multiple options (dinheiro, cartão, PIX, etc.)
- July 09, 2025. Enhanced delivery creation form with payment method selection dropdown
- July 09, 2025. Updated all delivery views (admin, deliverer, modals) to display payment method information
- July 09, 2025. Added clear-auth page to help users reset authentication state and return to landing page
- July 09, 2025. Enhanced cache management system for better Chrome compatibility with external domains
- July 09, 2025. Implemented aggressive cache clearing and service worker updates for consistent page loading
- July 09, 2025. Added version-based cache invalidation to ensure users see the latest application version

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication System

### Local Authentication
- **Admin Login**: admin@entregafacil.com / admin123
- **Merchant Login**: Email and phone number from database
- **Deliverer Login**: Email and phone number from database

### Test Credentials
- **Merchant**: joao@padaria.com / 123456789
- **Deliverer**: maria@entregador.com / 987654321

### Token Management
- JWT tokens with 24-hour expiration
- Stored in localStorage with user type identification
- Automatic token validation and cleanup on expiration