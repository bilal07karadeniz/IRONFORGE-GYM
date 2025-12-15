# IRONFORGE GYM - Appointment Booking System

A full-stack, production-ready gym appointment booking system featuring a modern React/Next.js frontend and a robust Node.js/Express backend with PostgreSQL database.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

IRONFORGE GYM is a comprehensive appointment booking system designed for gyms and fitness studios. It allows members to browse classes, book sessions, manage their fitness journey, while providing trainers and administrators with powerful tools to manage schedules, track attendance, and analyze performance.

### Key Highlights

- **Modern UI/UX**: Dark-themed, responsive design with smooth animations
- **Role-Based Access**: Member, Trainer, and Admin roles with specific permissions
- **Real-Time Availability**: Live capacity tracking with waitlist support
- **Secure Authentication**: JWT-based auth with refresh tokens and account protection
- **Production-Ready**: Rate limiting, input validation, error handling, and logging

---

## Features

### For Members
- **User Dashboard**: Personal stats, upcoming sessions, achievements tracking
- **Class Browsing**: Filter and search classes by category, difficulty, trainer
- **Schedule Viewing**: Interactive calendar and list views
- **Booking Management**: Book, cancel, and rate sessions
- **Waitlist Support**: Auto-join waitlist when classes are full
- **QR Code Check-in**: QR codes for easy attendance tracking
- **Profile Management**: Update personal information and preferences

### For Trainers
- **Trainer Dashboard**: Overview of upcoming sessions and student count
- **Schedule Management**: Create and manage class schedules
- **Student Tracking**: View enrolled students and attendance
- **Performance Analytics**: Rating and feedback tracking

### For Administrators
- **Admin Dashboard**: Comprehensive analytics and statistics
- **User Management**: Create, update, deactivate user accounts
- **Class Management**: Full CRUD operations for classes
- **Schedule Management**: Create, modify, cancel schedules
- **Booking Oversight**: View and manage all bookings
- **Analytics & Reports**: Revenue, attendance, and popularity metrics

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | React framework with App Router |
| React | 19.2.1 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| Radix UI | Latest | Accessible UI primitives |
| React Hook Form | 7.68.0 | Form management |
| Zod | 4.1.13 | Schema validation |
| Axios | 1.13.2 | HTTP client |
| Recharts | 3.5.1 | Data visualization |
| Sonner | 2.0.7 | Toast notifications |
| Lucide React | 0.561.0 | Icon library |
| QRCode.react | 4.2.0 | QR code generation |
| date-fns | 4.1.0 | Date manipulation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.18.2 | Web framework |
| PostgreSQL | 14+ | Database |
| pg | 8.11.3 | PostgreSQL client |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 2.4.3 | Password hashing |
| express-validator | 7.0.1 | Input validation |
| express-rate-limit | 7.1.5 | Rate limiting |
| Helmet | 7.1.0 | Security headers |
| Morgan | 1.10.0 | HTTP logging |
| node-pg-migrate | 6.2.2 | Database migrations |
| uuid | 9.0.1 | Unique ID generation |

---

## Architecture

```
gym-appointment/
├── backend/                 # Node.js/Express API server
│   ├── migrations/         # Database migration files
│   ├── scripts/           # Utility scripts (backup, restore)
│   └── src/
│       ├── config/        # App & database configuration
│       ├── controllers/   # Route handlers
│       ├── database/      # Seed data
│       ├── middleware/    # Auth, validation, error handling
│       ├── routes/        # API route definitions
│       ├── services/      # Business logic services
│       └── utils/         # Helper utilities
│
├── frontend/               # Next.js React application
│   ├── public/            # Static assets
│   └── src/
│       ├── app/           # Next.js App Router pages
│       │   ├── (auth)/    # Authentication pages
│       │   └── (protected)/ # Protected pages
│       ├── components/    # Reusable UI components
│       │   ├── admin/     # Admin-specific components
│       │   ├── auth/      # Auth-related components
│       │   ├── bookings/  # Booking components
│       │   ├── classes/   # Class display components
│       │   ├── dashboard/ # Dashboard widgets
│       │   ├── layout/    # Layout components
│       │   ├── profile/   # Profile components
│       │   ├── schedule/  # Schedule components
│       │   └── ui/        # Base UI components
│       ├── contexts/      # React contexts
│       ├── lib/           # Utilities and API client
│       └── types/         # TypeScript definitions
│
└── README.md              # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (or yarn)
- **PostgreSQL**: Version 14.0 or higher
- **Git**: For version control

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gym-appointment
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# (See Configuration section below)
```

### 3. Database Setup

```bash
# Connect to PostgreSQL and create database
psql -U postgres
CREATE DATABASE gym_appointment;
\q

# Run migrations
npm run migrate:up

# (Optional) Seed sample data
npm run seed
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local
```

---

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gym_appointment
DB_USER=postgres
DB_PASSWORD=your_password_here

# Database URL (for migrations)
DATABASE_URL=postgresql://postgres:your_password_here@localhost:5432/gym_appointment

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3001
```

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

---

## Project Structure

### Backend Structure

```
backend/
├── migrations/                    # Database migrations
│   ├── 1702500000000_create-users-table.js
│   ├── 1702500000001_create-trainers-table.js
│   ├── 1702500000002_create-classes-table.js
│   ├── 1702500000003_create-schedules-table.js
│   ├── 1702500000004_create-bookings-table.js
│   ├── 1702500000005_create-waiting-list-table.js
│   └── 1702500000006_add-auth-enhancements.js
├── scripts/
│   ├── backup-database.js        # Database backup utility
│   └── restore-database.js       # Database restore utility
├── src/
│   ├── config/
│   │   ├── database.js           # PostgreSQL connection pool
│   │   └── index.js              # App configuration
│   ├── controllers/
│   │   ├── admin.controller.js   # Admin operations
│   │   ├── auth.controller.js    # Authentication logic
│   │   ├── booking.controller.js # Booking operations
│   │   ├── class.controller.js   # Class management
│   │   ├── schedule.controller.js # Schedule management
│   │   ├── trainer.controller.js # Trainer operations
│   │   ├── trainerDashboard.controller.js
│   │   └── user.controller.js    # User management
│   ├── database/
│   │   └── seed.js               # Sample data seeder
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Global error handling
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── validators/           # Input validation schemas
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── class.routes.js
│   │   ├── index.js              # Route aggregator
│   │   ├── schedule.routes.js
│   │   ├── trainer.routes.js
│   │   ├── trainerDashboard.routes.js
│   │   ├── user.routes.js
│   │   └── waitingList.routes.js
│   ├── services/
│   │   ├── email.service.js      # Email preparation
│   │   └── tokenBlacklist.service.js
│   ├── utils/
│   │   ├── AppError.js           # Custom error class
│   │   ├── errorMessages.js      # Error message constants
│   │   ├── jwt.js                # Token utilities
│   │   ├── passwordValidator.js  # Password strength checker
│   │   └── response.js           # Response formatters
│   ├── app.js                    # Express app setup
│   └── index.js                  # Server entry point
├── .env.example
├── nodemon.json
├── package.json
├── Procfile                      # Heroku deployment
└── railway.json                  # Railway deployment
```

### Frontend Structure

```
frontend/
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/              # Public auth pages
│   │   │   ├── forgot-password/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (protected)/         # Authenticated pages
│   │   │   ├── admin/
│   │   │   │   ├── bookings/
│   │   │   │   ├── classes/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── schedules/
│   │   │   │   └── users/
│   │   │   ├── classes/
│   │   │   ├── dashboard/
│   │   │   ├── my-bookings/
│   │   │   ├── profile/
│   │   │   ├── schedule/
│   │   │   ├── trainer/
│   │   │   │   ├── dashboard/
│   │   │   │   └── students/
│   │   │   ├── waiting-list/
│   │   │   └── layout.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── admin/
│   │   │   ├── analytics-chart.tsx
│   │   │   ├── class-form.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── schedule-form.tsx
│   │   ├── auth/
│   │   │   ├── auth-layout.tsx
│   │   │   └── protected-route.tsx
│   │   ├── bookings/
│   │   │   ├── booking-card.tsx
│   │   │   └── qrcode-display.tsx
│   │   ├── classes/
│   │   │   ├── class-card.tsx
│   │   │   └── filter-sidebar.tsx
│   │   ├── dashboard/
│   │   │   └── stats-card.tsx
│   │   ├── layout/
│   │   │   ├── footer.tsx
│   │   │   └── navbar.tsx
│   │   ├── profile/
│   │   │   └── profile-form.tsx
│   │   ├── schedule/
│   │   │   ├── booking-modal.tsx
│   │   │   ├── schedule-calendar.tsx
│   │   │   └── time-slot-card.tsx
│   │   ├── ui/                  # Shadcn/UI components
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── capacity-indicator.tsx
│   │   │   ├── card.tsx
│   │   │   ├── category-badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── search-bar.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   └── textarea.tsx
│   │   └── error-boundary.tsx
│   ├── contexts/
│   │   └── auth-context.tsx     # Authentication state
│   ├── lib/
│   │   ├── api.ts               # Axios instance & API methods
│   │   ├── token.ts             # Token management
│   │   ├── utils.ts             # Utility functions
│   │   └── validations.ts       # Zod schemas
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── components.json              # Shadcn/UI config
├── eslint.config.mjs
├── netlify.toml                 # Netlify deployment
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/profile` | Update profile | Yes |
| PUT | `/auth/change-password` | Change password | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| POST | `/auth/verify-email` | Verify email | No |

### Classes Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/classes` | List all classes | No |
| GET | `/classes/categories` | Get class categories | No |
| GET | `/classes/:id` | Get class details | No |
| POST | `/classes` | Create class | Admin |
| PUT | `/classes/:id` | Update class | Admin |
| DELETE | `/classes/:id` | Delete class | Admin |

### Schedules Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/schedules` | List schedules | No |
| GET | `/schedules/available` | Get available slots | No |
| GET | `/schedules/my` | Trainer's schedules | Trainer |
| GET | `/schedules/:id` | Get schedule details | No |
| POST | `/schedules` | Create schedule | Admin/Trainer |
| PUT | `/schedules/:id` | Update schedule | Admin/Trainer |
| POST | `/schedules/:id/cancel` | Cancel schedule | Admin/Trainer |
| DELETE | `/schedules/:id` | Delete schedule | Admin/Trainer |

### Bookings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create booking | Yes |
| GET | `/bookings/my-bookings` | User's bookings | Yes |
| GET | `/bookings/:id` | Get booking details | Yes |
| DELETE | `/bookings/:id` | Cancel booking | Yes |
| POST | `/bookings/:id/rate` | Rate booking | Yes |
| GET | `/bookings` | All bookings | Admin |
| PATCH | `/bookings/:id/attendance` | Mark attendance | Admin/Trainer |

### Waiting List Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/waiting-list` | Join waitlist | Yes |
| GET | `/waiting-list/my-list` | User's waitlist | Yes |
| POST | `/waiting-list/:id/confirm` | Confirm from waitlist | Yes |
| DELETE | `/waiting-list/:id` | Leave waitlist | Yes |

### Trainers Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/trainers` | List all trainers | No |
| GET | `/trainers/:id` | Get trainer details | No |
| POST | `/trainers` | Create trainer | Admin |
| PATCH | `/trainers/:id` | Update trainer | Admin/Trainer |
| DELETE | `/trainers/:id` | Delete trainer | Admin |

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │────<│   trainers   │────<│   classes    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   bookings   │────>│  schedules   │<────│ waiting_list │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│token_blacklist│
└──────────────┘
```

### Tables Overview

- **users**: User accounts with roles (member, trainer, admin)
- **trainers**: Trainer profiles linked to users
- **classes**: Fitness class definitions
- **schedules**: Scheduled class instances
- **bookings**: User bookings for schedules
- **waiting_list**: Waitlist entries for full classes
- **token_blacklist**: Revoked JWT tokens

---

## Security Features

### Authentication
- JWT-based authentication with short-lived access tokens (15 min)
- Refresh tokens for seamless session renewal (7 days)
- Secure token storage and rotation

### Password Security
- Minimum 8 characters
- Uppercase, lowercase, number, and special character required
- Cannot contain parts of email
- Not in common password list
- bcrypt hashing with 12 salt rounds

### Account Protection
- Account lockout after 5 failed login attempts
- 30-minute lockout duration
- Login attempt tracking and reset

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 30 minutes |
| Register | 3 requests | 1 hour |
| Password Reset | 3 requests | 1 hour |
| Profile Update | 10 requests | 1 hour |

### Additional Security
- Helmet.js for HTTP security headers
- CORS configuration
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS protection

---

## Testing

### Test Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gymfit.com | Admin123! |
| Trainer | sarah.johnson@gymfit.com | Trainer123! |
| Member | john.doe@email.com | Member123! |

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

---

## Deployment

### Backend Deployment

The backend includes configurations for multiple platforms:

**Heroku:**
```bash
# Procfile is included
heroku create
heroku addons:create heroku-postgresql
git push heroku main
heroku run npm run migrate:up
```

**Railway:**
```bash
# railway.json is included
railway init
railway up
```

### Frontend Deployment

**Netlify:**
```bash
# netlify.toml is included
# Connect repository to Netlify
# Build command: npm run build
# Publish directory: .next
```

**Vercel:**
```bash
vercel --prod
```

### Environment Variables for Production

Ensure all sensitive environment variables are set in your deployment platform:

- `DATABASE_URL` or individual DB_* variables
- `JWT_SECRET` (use a strong, unique secret)
- `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- `CORS_ORIGIN` (your frontend URL)
- `NODE_ENV=production`

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use TypeScript for frontend code
- Write meaningful commit messages
- Add comments for complex logic

---

## License

This project is licensed under the ISC License.

---

## Support

For support, please open an issue in the repository or contact the development team.

---

**Built with passion for fitness enthusiasts everywhere.**
