# Technical Documentation

## IRONFORGE GYM - Appointment Booking System

This document provides in-depth technical details for developers working on the IRONFORGE GYM appointment booking system.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Database Design](#4-database-design)
5. [Authentication System](#5-authentication-system)
6. [API Reference](#6-api-reference)
7. [Business Logic](#7-business-logic)
8. [Error Handling](#8-error-handling)
9. [Security Implementation](#9-security-implementation)
10. [Performance Considerations](#10-performance-considerations)
11. [Development Guidelines](#11-development-guidelines)

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Browser    │  │  Mobile App  │  │   Admin UI   │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          └────────────────┼─────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  App Router  │  React 19  │  TypeScript  │  Tailwind CSS        │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Auth Context  │  API Client (Axios)  │  Token Management       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ REST API
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express.js)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Routes  │  Controllers  │  Middleware  │  Services              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Rate Limiting  │  JWT Auth  │  Validation  │  Error Handling    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ SQL
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (PostgreSQL)                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Users  │  Trainers  │  Classes  │  Schedules  │  Bookings       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Request Flow

1. Client makes HTTP request to frontend
2. Frontend handles routing via Next.js App Router
3. API calls are made through Axios client with interceptors
4. Backend validates request (auth, rate limit, input)
5. Controller processes request and interacts with database
6. Response formatted and returned
7. Frontend updates UI state

---

## 2. Backend Architecture

### 2.1 Directory Structure

```
backend/
├── src/
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
│   ├── config/
│   │   ├── database.js     # PostgreSQL pool & helpers
│   │   └── index.js        # Environment configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic services
│   └── utils/              # Utility functions
└── migrations/             # Database migrations
```

### 2.2 App Configuration (`app.js`)

```javascript
// Middleware stack order:
1. helmet()           // Security headers
2. cors()             // CORS configuration
3. rateLimit()        // API rate limiting
4. morgan()           // Request logging
5. express.json()     // Body parsing
6. routes             // API routes
7. notFoundHandler    // 404 handling
8. errorHandler       // Global error handler
```

### 2.3 Database Configuration (`config/database.js`)

```javascript
// Connection Pool Settings
{
  max: 20,                    // Maximum pool connections
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 2000 // Connection timeout
}

// Available Exports
- pool          // Raw pool instance
- query()       // Execute parameterized query
- getClient()   // Get client for transactions
- transaction() // Transaction wrapper
- checkConnection() // Health check
- closePool()   // Graceful shutdown
```

### 2.4 Controller Pattern

Each controller follows a consistent pattern:

```javascript
const controllerMethod = async (req, res, next) => {
  try {
    // 1. Extract and validate input
    const { param } = req.body;

    // 2. Perform database operations
    const result = await query('SELECT...', [param]);

    // 3. Apply business logic
    if (result.rows.length === 0) {
      throw AppError.notFound('Resource not found');
    }

    // 4. Return formatted response
    return success(res, result.rows[0], 'Operation successful');
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

### 2.5 Middleware Stack

#### Authentication (`middleware/auth.js`)
```javascript
// Exported functions:
- authenticate          // Verify JWT token (required)
- authenticateOptional  // Verify if token present (optional)
- authorize(...roles)   // Check user role
```

#### Rate Limiting (`middleware/rateLimiter.js`)
```javascript
// Endpoint-specific limiters:
- authLimiter           // 5 req / 30 min (login)
- registerLimiter       // 3 req / 1 hour
- refreshLimiter        // 30 req / 15 min
- passwordResetLimiter  // 3 req / 1 hour
- profileUpdateLimiter  // 10 req / 1 hour
```

#### Validators (`middleware/validators/`)
```javascript
// Each validator exports arrays of express-validator rules:
- auth.validator.js     // Login, register, password rules
- booking.validator.js  // Booking creation rules
- class.validator.js    // Class CRUD rules
- schedule.validator.js // Schedule CRUD rules
- trainer.validator.js  // Trainer CRUD rules
- admin.validator.js    // Admin-specific rules
```

---

## 3. Frontend Architecture

### 3.1 Next.js App Router Structure

```
src/app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing page (public)
├── globals.css             # Global styles
├── (auth)/                 # Auth route group (public)
│   ├── layout.tsx          # Auth-specific layout
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
└── (protected)/            # Protected route group
    ├── layout.tsx          # Layout with navbar/auth check
    ├── dashboard/page.tsx  # User dashboard
    ├── classes/            # Class browsing
    ├── schedule/           # Schedule views
    ├── my-bookings/        # User's bookings
    ├── waiting-list/       # User's waitlist
    ├── profile/            # User profile
    ├── admin/              # Admin pages
    │   ├── dashboard/
    │   ├── users/
    │   ├── classes/
    │   ├── schedules/
    │   └── bookings/
    └── trainer/            # Trainer pages
        ├── dashboard/
        └── students/
```

### 3.2 Authentication Context

```typescript
// contexts/auth-context.tsx

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// Usage:
const { user, login, logout } = useAuth();
```

### 3.3 API Client (`lib/api.ts`)

```typescript
// Axios instance with interceptors:

// Request Interceptor:
- Adds Authorization header from stored token

// Response Interceptor:
- Handles 401 errors with token refresh
- Queues failed requests during refresh
- Redirects to login on refresh failure

// API Modules:
- authApi       // Authentication endpoints
- bookingsApi   // Booking CRUD
- adminApi      // Admin operations
- trainerApi    // Trainer dashboard
- classesApi    // Class browsing
- schedulesApi  // Schedule operations
- trainersApi   // Trainer listing
```

### 3.4 Token Management (`lib/token.ts`)

```typescript
// Functions:
- getAccessToken(): string | null
- getRefreshToken(): string | null
- setTokens(access: string, refresh: string): void
- clearTokens(): void
- isTokenExpired(token: string): boolean

// Storage: localStorage (consider httpOnly cookies for production)
```

### 3.5 Component Architecture

```
components/
├── ui/                 # Base UI components (Shadcn/Radix)
│   └── [component].tsx # button, card, input, etc.
├── layout/             # Layout components
│   ├── navbar.tsx      # Navigation bar
│   └── footer.tsx      # Footer
├── auth/               # Auth-related
│   └── protected-route.tsx
├── [feature]/          # Feature-specific components
│   └── [component].tsx
└── error-boundary.tsx  # Error handling
```

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
                    ┌──────────────────────┐
                    │       users          │
                    │──────────────────────│
                    │ id (PK, UUID)        │
                    │ email (UNIQUE)       │
                    │ password             │
                    │ full_name            │
                    │ phone                │
                    │ role (ENUM)          │
                    │ is_active            │
                    │ email_verified       │
                    │ login_attempts       │
                    │ locked_until         │
                    │ refresh_token        │
                    │ created_at           │
                    │ updated_at           │
                    └──────────┬───────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    trainers      │  │ token_blacklist  │  │    bookings      │
│──────────────────│  │──────────────────│  │──────────────────│
│ id (PK, UUID)    │  │ id (PK, UUID)    │  │ id (PK, UUID)    │
│ user_id (FK)     │  │ token_hash       │  │ user_id (FK)     │
│ specialization   │  │ user_id (FK)     │  │ schedule_id (FK) │
│ bio              │  │ expires_at       │  │ status (ENUM)    │
│ years_experience │  │ blacklisted_at   │  │ booking_date     │
│ rating           │  │ reason           │  │ cancelled_at     │
│ rating_count     │  └──────────────────┘  │ attended         │
│ hourly_rate      │                        │ rating           │
│ is_available     │                        │ feedback         │
└────────┬─────────┘                        └────────┬─────────┘
         │                                           │
         │         ┌──────────────────┐              │
         │         │     classes      │              │
         │         │──────────────────│              │
         └────────>│ id (PK, UUID)    │              │
                   │ name             │              │
                   │ description      │              │
                   │ duration_minutes │              │
                   │ max_capacity     │              │
                   │ trainer_id (FK)  │              │
                   │ category (ENUM)  │              │
                   │ difficulty_level │              │
                   │ equipment_needed │              │
                   │ is_active        │              │
                   └────────┬─────────┘              │
                            │                        │
                            ▼                        │
                   ┌──────────────────┐              │
                   │    schedules     │<─────────────┘
                   │──────────────────│
                   │ id (PK, UUID)    │
                   │ class_id (FK)    │
                   │ trainer_id (FK)  │
                   │ start_time       │
                   │ end_time         │
                   │ current_bookings │
                   │ status (ENUM)    │
                   │ room             │
                   │ notes            │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │  waiting_list    │
                   │──────────────────│
                   │ id (PK, UUID)    │
                   │ user_id (FK)     │
                   │ schedule_id (FK) │
                   │ position         │
                   │ notified         │
                   │ notified_at      │
                   │ expires_at       │
                   │ created_at       │
                   └──────────────────┘
```

### 4.2 Enum Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('member', 'trainer', 'admin');

-- Class categories
CREATE TYPE class_category AS ENUM (
  'yoga', 'pilates', 'cardio', 'strength',
  'hiit', 'spinning', 'boxing', 'dance', 'other'
);

-- Difficulty levels
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Schedule status
CREATE TYPE schedule_status AS ENUM ('active', 'cancelled', 'completed');

-- Booking status
CREATE TYPE booking_status AS ENUM (
  'confirmed', 'cancelled', 'completed', 'no_show'
);
```

### 4.3 Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Schedules
CREATE INDEX idx_schedules_class_id ON schedules(class_id);
CREATE INDEX idx_schedules_trainer_id ON schedules(trainer_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_status ON schedules(status);

-- Bookings
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_schedule_id ON bookings(schedule_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Token blacklist (for cleanup)
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

### 4.4 Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Applied to: users, trainers, classes, schedules, bookings
```

---

## 5. Authentication System

### 5.1 Token Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                    JWT Token Strategy                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Access Token:                                                 │
│  ├─ Lifetime: 15 minutes                                       │
│  ├─ Payload: { id, email, role }                              │
│  ├─ Storage: Memory/localStorage                               │
│  └─ Purpose: API authorization                                 │
│                                                                │
│  Refresh Token:                                                │
│  ├─ Lifetime: 7 days                                          │
│  ├─ Payload: { id, email, role }                              │
│  ├─ Storage: Database (users.refresh_token)                   │
│  └─ Purpose: Obtain new access tokens                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │         │ Backend │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │    POST /login    │                   │
     │──────────────────>│                   │
     │                   │  Verify email     │
     │                   │──────────────────>│
     │                   │     User data     │
     │                   │<──────────────────│
     │                   │                   │
     │                   │ Compare password  │
     │                   │ (bcrypt)          │
     │                   │                   │
     │                   │ Generate tokens   │
     │                   │                   │
     │                   │ Store refresh     │
     │                   │──────────────────>│
     │                   │                   │
     │ {accessToken,     │                   │
     │  refreshToken,    │                   │
     │  user}            │                   │
     │<──────────────────│                   │
     │                   │                   │
```

### 5.3 Token Refresh Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │         │ Backend │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ API Request       │                   │
     │ (expired token)   │                   │
     │──────────────────>│                   │
     │                   │                   │
     │ 401 Unauthorized  │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ POST /refresh     │                   │
     │ {refreshToken}    │                   │
     │──────────────────>│                   │
     │                   │ Check blacklist   │
     │                   │──────────────────>│
     │                   │                   │
     │                   │ Verify stored     │
     │                   │ refresh token     │
     │                   │──────────────────>│
     │                   │                   │
     │                   │ Blacklist old     │
     │                   │──────────────────>│
     │                   │                   │
     │ {newAccessToken,  │                   │
     │  newRefreshToken} │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ Retry original    │                   │
     │ request           │                   │
     │──────────────────>│                   │
```

### 5.4 Password Validation Rules

```javascript
// utils/passwordValidator.js

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  maxConsecutiveChars: 2,
  checkCommonPasswords: true,
  checkEmailSimilarity: true,
};

// Validation checks:
1. Length validation (8-128 chars)
2. Uppercase letter (A-Z)
3. Lowercase letter (a-z)
4. Number (0-9)
5. Special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
6. No more than 2 consecutive identical characters
7. Not in common password list
8. Does not contain email username
```

### 5.5 Account Lockout

```javascript
// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// Flow:
1. Failed login → Increment login_attempts
2. If login_attempts >= 5 → Set locked_until
3. On login attempt with locked account → Check locked_until
4. If still locked → Return error with remaining time
5. Successful login → Reset login_attempts and locked_until
```

---

## 6. API Reference

### 6.1 Response Formats

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": [ ... ]
  }
}
```

### 6.2 Authentication Endpoints

#### POST /api/auth/register
```javascript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "+1234567890"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { id, email, full_name, role },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST /api/auth/login
```javascript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "success": true,
  "data": {
    "user": { id, email, full_name, role, email_verified },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 6.3 Booking Endpoints

#### POST /api/bookings
```javascript
// Request
{
  "schedule_id": "uuid"
}

// Response
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "schedule_id": "uuid",
    "status": "confirmed",
    "booking_date": "2024-01-15T10:00:00Z",
    "class_name": "Yoga Flow",
    "trainer_name": "Sarah Johnson",
    "start_time": "2024-01-20T09:00:00Z",
    "end_time": "2024-01-20T10:00:00Z"
  }
}
```

#### GET /api/bookings/my-bookings
```javascript
// Query Parameters
?page=1&limit=10&type=upcoming&status=confirmed

// Response
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... },
  "stats": {
    "upcoming": 3,
    "completed": 15,
    "cancelled": 2,
    "no_show": 0
  }
}
```

---

## 7. Business Logic

### 7.1 Booking Rules

```javascript
// Booking Creation Checks:
1. Schedule must exist and be active
2. Schedule must be in the future
3. User cannot already have booking for same schedule
4. Class must not be at capacity
5. User cannot have conflicting booking (time overlap)

// Booking Cancellation Rules:
1. Must be at least 2 hours before class start
2. Admin can override cancellation window
3. Cancelled booking triggers waitlist promotion
```

### 7.2 Waitlist Logic

```javascript
// Join Waitlist:
1. Class must be at capacity
2. User not already booked or on waitlist
3. Assign next position number

// Spot Opens:
1. First person on waitlist is notified
2. Set 24-hour expiration window
3. User must confirm within window

// Confirmation:
1. Check notification status
2. Verify expiration not passed
3. Check for time conflicts
4. Create booking
5. Remove from waitlist
6. Update remaining positions
```

### 7.3 Schedule Conflict Detection

```javascript
// Trainer Conflict Check:
SELECT * FROM schedules
WHERE trainer_id = $1
  AND status = 'active'
  AND (start_time < $end_time AND end_time > $start_time)

// Room Conflict Check:
SELECT * FROM schedules
WHERE room = $1
  AND status = 'active'
  AND (start_time < $end_time AND end_time > $start_time)

// User Booking Conflict:
SELECT * FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
WHERE b.user_id = $1
  AND b.status = 'confirmed'
  AND (s.start_time < $end_time AND s.end_time > $start_time)
```

### 7.4 Rating System

```javascript
// Rating Rules:
1. Can only rate after class has ended
2. Cannot rate cancelled bookings
3. Cannot rate twice

// Trainer Rating Update:
// Weighted average calculation
new_rating = (old_rating * count + new_rating) / (count + 1)
```

---

## 8. Error Handling

### 8.1 Error Class Hierarchy

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }

  // Static factory methods:
  static badRequest(message)     // 400
  static unauthorized(message)   // 401
  static forbidden(message)      // 403
  static notFound(message)       // 404
  static conflict(message)       // 409
  static tooManyRequests(message) // 429
  static internal(message)       // 500
}
```

### 8.2 Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', err);

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  // Programming errors (unexpected)
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

### 8.3 Validation Error Handling

```javascript
// Express-validator errors are formatted as:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 9. Security Implementation

### 9.1 Security Headers (Helmet)

```javascript
// Applied headers:
- Content-Security-Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection
- Referrer-Policy
```

### 9.2 CORS Configuration

```javascript
{
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

### 9.3 Input Validation

```javascript
// All user inputs validated using express-validator:
- String sanitization (trim, escape)
- Email format validation
- Password strength validation
- UUID format validation
- Date/time format validation
- Enum value validation
- Array length limits
```

### 9.4 SQL Injection Prevention

```javascript
// All queries use parameterized statements:
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]  // Parameter passed separately
);
```

### 9.5 Token Security

```javascript
// Token blacklisting on:
- Logout
- Password change
- Security events
- Token refresh (old token blacklisted)

// Blacklist cleanup:
// Expired tokens automatically ignored
// Index on expires_at for efficient queries
```

---

## 10. Performance Considerations

### 10.1 Database Connection Pooling

```javascript
// Pool configuration for optimal performance:
{
  max: 20,                    // Max concurrent connections
  idleTimeoutMillis: 30000,   // Release idle connections
  connectionTimeoutMillis: 2000 // Fail fast on connection issues
}
```

### 10.2 Query Optimization

```javascript
// Pagination on all list endpoints
// Indexes on frequently queried columns
// Selective column fetching (no SELECT *)
// Prepared statements for repeated queries
```

### 10.3 Caching Considerations

```javascript
// Future implementation suggestions:
- Redis for session storage
- Cache class categories
- Cache trainer list
- Rate limit counters in Redis
```

### 10.4 Frontend Optimization

```javascript
// Next.js optimizations:
- App Router with Server Components
- Automatic code splitting
- Image optimization
- Font optimization (next/font)
```

---

## 11. Development Guidelines

### 11.1 Code Style

```javascript
// Backend:
- CommonJS modules (require/module.exports)
- Async/await for asynchronous code
- Consistent error handling with try/catch
- JSDoc comments for functions

// Frontend:
- ES Modules (import/export)
- TypeScript for type safety
- React functional components with hooks
- Tailwind CSS for styling
```

### 11.2 Git Workflow

```bash
# Branch naming:
feature/feature-name
bugfix/bug-description
hotfix/critical-fix

# Commit messages:
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
```

### 11.3 Testing Guidelines

```javascript
// Unit tests for:
- Utility functions
- Validation logic
- Business logic services

// Integration tests for:
- API endpoints
- Database operations
- Authentication flows

// E2E tests for:
- Critical user flows
- Admin operations
```

### 11.4 Environment Management

```bash
# Development
NODE_ENV=development
# - Verbose logging
# - Stack traces in errors
# - CORS permissive

# Production
NODE_ENV=production
# - Minimal logging
# - Generic error messages
# - Strict CORS
# - Required env validation
```

---

## Appendix A: Database Migration Commands

```bash
# Create new migration
npm run migrate:create -- migration_name

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Rollback all migrations
npm run migrate:down -- --all
```

## Appendix B: Useful SQL Queries

```sql
-- Get booking statistics
SELECT
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM bookings;

-- Get popular classes
SELECT c.name, COUNT(b.id) as booking_count
FROM classes c
JOIN schedules s ON c.id = s.class_id
JOIN bookings b ON s.id = b.schedule_id
WHERE b.status IN ('confirmed', 'completed')
GROUP BY c.id
ORDER BY booking_count DESC;

-- Get trainer ratings
SELECT u.full_name, t.rating, t.rating_count
FROM trainers t
JOIN users u ON t.user_id = u.id
ORDER BY t.rating DESC;
```

## Appendix C: Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
   - Ensure PostgreSQL is running
   - Check firewall settings

2. **JWT Errors**
   - Verify JWT_SECRET and JWT_REFRESH_SECRET are set
   - Check token expiration
   - Clear blacklisted tokens if testing

3. **CORS Errors**
   - Verify CORS_ORIGIN matches frontend URL
   - Include protocol (http/https)
   - Check for trailing slashes

4. **Rate Limiting**
   - Wait for window to reset
   - Check rate limit configuration
   - Use different IP for testing

---

*Last Updated: December 2024*
