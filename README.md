# AMS - Assignment & Submission Management System

A role-based school/college application for evaluating understanding of requirements, system design, API development, frontend implementation, and testing. Built with ASP.NET Core 10, Next.js 16, React 19, and PostgreSQL.

## Overview

This repository contains a complete full-stack application for managing academic assignments and student submissions in educational institutions. The system supports three primary user roles:

- **Admin**: System administrator with full control over users, classes, subjects, and settings
- **Teacher**: Educator who creates and grades assignments, and reviews student submissions
- **Student**: Learner who views assignments, submits work, and receives feedback

All features are protected by JWT-based authentication and role-based authorization.

## Technology Stack

### Backend
| Component | Version |
|-----------|---------|
| .NET Framework | net10.0 (ASP.NET Core 10) |
| Entity Framework Core | 10.0.10 |
| Authentication | JWT Bearer (10.0.10) |
| API Documentation | Swashbuckle.AspNetCore 6.8.1 |
| Validation | FluentValidation 11.4.0 |
| Password Hashing | BCrypt.Net-Next 4.0.3 |
| Database Provider | Npgsql.EntityFrameworkCore.PostgreSQL 10.0.3 |

### Frontend
| Component | Version |
|-----------|---------|
| Framework | Next.js 16.3.0 |
| UI Library | React 19.2.8 |
| Language | TypeScript 5.9.3 |
| Styling | Tailwind CSS 4.3.3 |
| Icons | Lucide React 1.28.0 |
| Linting | ESLint 9.39.5 |

### Infrastructure
| Component | Version |
|-----------|---------|
| Database | PostgreSQL 17-alpine |
| Node.js (Docker) | 22-alpine |
| .NET SDK (Docker) | 10.0 |
| Orchestration | Docker Compose |

## Key Features

### Admin Dashboard
- **User Management** — Create, update, and deactivate users (teachers, students, admins)
- **Class Management** — Manage classes, sections, and groups (hierarchical structure)
- **Subject Management** — Define subjects and assign teachers to subjects per class
- **Academic Year Management** — Activate/manage academic years and system configuration
- **Full System Visibility** — View all assignments and submissions across the institution
- **Account Settings** — Upload profile picture, change password etc.

### Teacher Portal
- **Assignment Creation** — Create, edit, and publish assignments with deadlines
- **Class Assignment** — Assign assignments to specific classes or courses
- **Submission Review** — View all student submissions for assigned classes
- **Grading** — Assign marks and provide feedback to students
- **Status Management** — Change submission status (submitted, graded, resubmission request, etc.)
- **Draft Support** — Save assignments as drafts before publishing
- **Account Settings** — Upload profile picture, change password, manage notification preferences
- **Notification Management** — In-app notifications for new submissions, assignments, and system events
- **Notification Center** — View and manage all notifications with real-time updates

### Student Dashboard
- **Assignment Visibility** — View all active assignments for enrolled classes
- **Submission Management** — Submit answers and upload attachments
- **Deadline Tracking** — See assignment deadlines and remaining time
- **Submission Updates** — Edit submissions before the deadline
- **Feedback Access** — View marks and teacher feedback on graded submissions
- **Status Tracking** — Monitor submission status (pending, submitted, graded)
- **Account Settings** — Upload profile picture, change password, manage notification preferences
- **Notification Management** — In-app notifications for grades, feedback, and deadlines
- **Notification Center** — View and manage all notifications with real-time updates

### Core Features
- **JWT Authentication** — Secure token-based authentication with access and refresh tokens
- **Role-Based Authorization** — Permission policies enforced at controller and application layer
- **File Management** — Upload and store assignment attachments, student submissions, and profile pictures
- **Image Upload** — Upload and manage profile avatars with instant updates across the app
- **Notification System** — Real-time notifications for assignments, submissions, grades, and system events
- **Notification Preferences** — Customize notification channels (email, in-app) per event type
- **Database Seeding** — Pre-populated demo data for quick testing
- **API Documentation** — Interactive Swagger/OpenAPI at `/swagger`(development mode)
- **Responsive Design** — Mobile-friendly UI for all devices with hamburger menu on mobile
- **Error Handling** — Comprehensive validation and error responses
- **Docker Support** — Complete containerization with docker-compose for easy deployment

## Project Structure

```
AMS/
├── backend/
│   ├── src/
│   │   ├── AMS.Domain/                      # Core business entities and interfaces
│   │   ├── AMS.Domain.Shared/               # Shared enums and exceptions
│   │   ├── AMS.Application/                 # Business logic and use cases
│   │   ├── AMS.Application.Contracts/       # DTOs and service interfaces
│   │   ├── AMS.EntityFrameworkCore/         # Database context and repositories
│   │   ├── AMS.HttpApi/                     # API controllers
│   │   ├── AMS.HttpApi.Host/                # Application startup and DI configuration
│   │   ├── AMS.Infrastructure/              # External services (file storage, etc.)
│   │   └── AMS.DbMigrator/                  # Database migration runner
│   ├── Dockerfile                           # Multi-stage build (api + migrator targets)
│   ├── entrypoint-api.sh                    # API startup script
│   └── entrypoint-migrator.sh               # Migrator startup script
│
├── frontend/
│   ├── app/                                 # Next.js app router
│   │   ├── (auth)/                          # Authentication pages
│   │   ├── roles/                           # Role-specific dashboards
│   │   ├── layout.tsx                       # Root layout
│   │   └── page.tsx                         # Home page
│   ├── components/                          # React components
│   │   ├── roles/                           # Role-specific components (admin, teacher, student)
│   │   ├── ui/                              # Reusable UI components
│   │   └── account/                         # Account/profile components
│   ├── shared/                              # Shared utilities and components
│   │   ├── ui/                              # Shared modal and form components
│   │   ├── layout/                          # Layout components (sidebar, header)
│   │   ├── auth/                            # Authentication utilities
│   │   └── constants/                       # Application constants
│   ├── lib/                                 # Utility functions
│   │   ├── api.ts                           # API client and fetch functions
│   │   ├── auth.ts                          # Authentication helpers
│   │   └── roles.ts                         # Role definitions
│   ├── public/                              # Static assets
│   ├── Dockerfile                           # Multi-stage Next.js build
│   └── next.config.js                       # Next.js configuration
│
├── tests/
│   ├── AMS.Application.Tests/               # Application service unit tests
│   ├── AMS.Domain.Tests/                    # Domain entity tests
│   └── AMS.HttpApi.Tests/                   # Controller and integration tests
│
├── docs/                                    # Documentation
│   ├── Ams database design.md
│   ├── DOCKER_PLAN.md                       # Docker implementation details
│   ├── AMS Notification Plan.md
│   └── TEST_PLAN.md
│
├── docker-compose.yml                       # Container orchestration
├── .env.example                             # Environment variables template
└── README.md                                # This file
```

## Quick Start - Local Setup

### Prerequisites
- .NET 10 SDK ([download](https://dotnet.microsoft.com/download))
- Node.js 22+ ([download](https://nodejs.org))
- PostgreSQL 17+ ([download](https://www.postgresql.org/download))
- Docker & Docker Compose (optional, for containerized setup)

### Option 1: Local Development (Manual Setup)

This is the setup for running the app directly on your machine without Docker.

> Important: The project requires environment variables before the backend and frontend can start correctly. The repo includes `.env.example` for the root config and `frontend/.env.local.example` for the frontend.

#### Step 0: Make sure the required tools are installed

Before anything else, install and confirm:
- .NET 10 SDK
- Node.js 22+
- PostgreSQL 17+
- A running PostgreSQL server with database access on `localhost:5432`

You also need a terminal that can load environment variables for the current session.

#### Step 1: Configure the root environment file for backend
From the repository root:

```bash
cp .env.example .env
```

Then edit `.env` and set real values for your local machine. At minimum:

```env
POSTGRES_DB=amsdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

JWT_KEY=YourSecretKeyMustBeAtLeast32CharactersLong!
JWT_ISSUER=http://localhost:5000
JWT_AUDIENCE=http://localhost:5000
JWT_ACCESS_MINUTES=15
JWT_REFRESH_MINUTES=21600

FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

API_PORT=5000
FRONTEND_PORT=3000

Jwt__Key=YourSecretKeyMustBeAtLeast32CharactersLong!
Jwt__Issuer=http://localhost:5000
Jwt__Audience=http://localhost:5000
Jwt__ExpiresMinutes=60
FrontendUrl=http://localhost:3000

ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=amsdb;Username=postgres;Password=postgres
```

Why this is necessary:
- The backend reads `Jwt__*` values for token signing and validation
- It reads `ConnectionStrings__DefaultConnection` to connect to PostgreSQL
- It reads `FrontendUrl` for CORS and cross-origin access
- The root `.env` is also used as a template for Docker/local environment injection

If you are using Bash/macOS/Linux, load the values into your current shell before running backend commands:

```bash
set -a
source .env
set +a
```

If you are using PowerShell on Windows:

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^(.*?)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}
```

#### Step 2: Make sure PostgreSQL is running and the database exists
Before the backend can run, PostgreSQL must be up and reachable on localhost:5432.

Verify it:

```bash
pg_isready -h localhost -p 5432
```

Create the database if needed:

```bash
createdb -h localhost -p 5432 -U postgres amsdb
```

If `createdb` is not available, create it from the PostgreSQL client:

```bash
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE amsdb;"
```

> If PostgreSQL is not running, start the local PostgreSQL service first. Without a reachable database, the API and tests will fail.

#### Step 3: Prepare the backend before `dotnet run`
From the repo root or inside the `backend` folder:

```bash
cd backend
dotnet restore
```

Then apply the database migration and seed the demo users before launching the API:

```bash
dotnet run --project src/AMS.DbMigrator
```

This step is important because it:
- creates/updates database tables
- applies EF Core migrations
- seeds demo users and test data
- makes sure login and admin/teacher/student flows work immediately

After the migrator finishes successfully, start the API:

```bash
dotnet run --project src/AMS.HttpApi.Host
```

The API will be available at `http://localhost:5000` and Swagger at `http://localhost:5000/swagger`.

#### Step 4: Configure the frontend environment before `npm run dev`
The frontend must know where the backend lives.

From the project root:

```bash
cd frontend
cp .env.local.example .env.local
```

Then edit `frontend/.env.local` and confirm:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

That is the value the frontend uses to call the API from the browser.

After that, install dependencies and start the app:

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

#### Step 5: Check the app before using it
Once both services are running, verify:
- Backend health or Swagger: `http://localhost:5000/swagger`
- Frontend main page: `http://localhost:3000`
- Login with demo accounts from the table below

> If the frontend cannot connect to the backend, check that `NEXT_PUBLIC_API_URL` is correct, the backend is running, and CORS `FrontendUrl` matches the frontend URL.

### Option 2: Docker Setup (Recommended)

From the repository root:
```bash
# Copy environment template and configure secrets
cp .env.example .env

# Edit .env to set:
# - POSTGRES_PASSWORD=your_secure_password
# - JWT_KEY=your_secret_key_min_32_chars

# Build and start all services
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger: http://localhost:5000/swagger
- PostgreSQL: localhost:5432

### Demo Credentials

Use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@ams.local` | `Admin123!` |
| Teacher | `teacher@ams.local` | `Teacher123!` |
| Teacher 2 | `teacher2@ams.local` | `Teacher123!` |
| Student | `student@ams.local` | `Student123!` |
| Student 2 | `student2@ams.local` | `Student123!` |
| Student 3 | `student3@ams.local` | `Student123!` |

## Database Setup

### Automatic Setup
The database is automatically created and seeded when running:
```bash
dotnet run --project backend/src/AMS.DbMigrator
```

This will:
1. Create PostgreSQL database (if not exists)
2. Apply all Entity Framework migrations
3. Seed demo users, classes, subjects, and assignments
4. Populate academic years and course structure

### Manual Migration
If you need to apply migrations separately:
```bash
cd backend

# Add a new migration (if you modified domain models)
dotnet ef migrations add MigrationName -p src/AMS.EntityFrameworkCore

# Apply migrations to database
dotnet ef database update -p src/AMS.EntityFrameworkCore
```

### Database Schema Highlights
- **Academic Years** — System operates within academic years; only one can be active at a time
- **Classes & Sections** — Hierarchical structure: Academic Year → Class Definition → Group (optional) → Section
- **Subjects** — Defined per class per academic year; teachers assigned to subject+class combinations
- **Assignments** — Created by teachers, assigned to specific classes with deadlines
- **Submissions** — Student work submitted per assignment with status tracking
- **Users** — Three roles with encrypted passwords (BCrypt) and JWT authentication

## Running Tests

Unit tests are organized by layer with focused coverage on business rules and authorization:

```bash
# Run all tests
dotnet test backend/

# Run specific test project
dotnet test backend/tests/AMS.Application.Tests/
dotnet test backend/tests/AMS.Domain.Tests/
dotnet test backend/tests/AMS.HttpApi.Tests/

# Run with verbose output
dotnet test backend/ --logger "console;verbosity=detailed"

# Run tests matching a pattern
dotnet test backend/ --filter "NamePattern"
```

### Test Coverage
- **Application Tests** — Business logic, authorization checks, submission workflows
- **Domain Tests** — Entity validation, domain rules (e.g., submissions, assignments)
- **Controller Tests** — API endpoints, HTTP status codes, integration scenarios

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
POSTGRES_DB=amsdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432

# JWT Authentication
JWT_KEY=YourSecretKeyMustBeAtLeast32CharactersLong!
JWT_ISSUER=http://localhost:5000
JWT_AUDIENCE=http://localhost:5000
JWT_ACCESS_MINUTES=15
JWT_REFRESH_MINUTES=21600

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Server Ports
API_PORT=5000
FRONTEND_PORT=3000
```

**Important:** 
- Never commit `.env` with real secrets
- `.env.example` documents required variables
- `JWT_KEY` must be at least 32 characters
- Change `POSTGRES_PASSWORD` from default

## Account Management & Notification System

### User Account Settings
All users (Admin, Teacher, Student) can manage their account from the Account Settings page:

**Profile Management:**
- Upload and update profile picture/avatar
- Changes sync instantly across the application (sidebar, headers, etc.)
- Previous avatar cached prevented with automatic timestamp management

**Security:**
- Change password with validation
- Current password verification required
- New password must meet security requirements
- Password hashing with BCrypt for storage

### Notification Management

#### For Teachers:
Access Settings → Notifications to configure:
- **New Submissions** — Notifications when students submit assignments
- **New Assignments** — Alerts for system or admin-created assignments
- **Submission Status** — Updates on resubmissions or deadline extensions
- **Grading Reminders** — Reminders for pending submissions to grade

**Notification Channels:**
- In-app notifications (real-time in notification center)
- Email notifications (configurable per event type)

**Notification Center:**
- View all recent notifications with timestamps
- Click notifications to jump directly to related assignment/submission
- Mark individual or all notifications as read
- Auto-dismissal of read notifications

#### For Students:
Access Settings → Notifications to configure:
- **New Assignments** — Alerts when teachers assign new work
- **Grades Published** — Notifications when assignments are graded
- **Feedback Received** — Updates when teachers add feedback
- **Deadline Reminders** — Reminders for upcoming deadlines
- **Resubmission Requests** — Alerts to resubmit work

**Notification Center:**
- View all notifications including grades and feedback
- Click to navigate directly to assignment or grade details
- Mark notifications as read
- Real-time updates to unread count

#### For Admins:
Access Settings → Notifications to manage system-level notification settings:
- Configure system email for notifications
- Manage notification templates
- View activity notifications

### Notification API Endpoints

Backend provides complete notification management:
- `GET /api/notifications` — Retrieve user notifications with pagination
- `GET /api/notifications/unread-count` — Get count of unread notifications
- `POST /api/notifications/{id}/mark-read` — Mark single notification as read
- `POST /api/notifications/mark-all-read` — Mark all notifications as read
- `GET /api/notification-preferences` — Get user notification preferences
- `PUT /api/notification-preferences/{type}/{channel}` — Update notification preferences

## Assumptions & Design Decisions

### System Assumptions
1. **Academic Year Constraint** — Only one academic year can be active at a time; all operations occur within the active academic year
2. **Class Hierarchy** — Classes may optionally have groups (e.g., Science, Arts groups in grade 9-12), and sections within those
3. **Teacher Assignment** — A subject in a class can have only one assigned teacher; reassigning overwrites the previous assignment
4. **Single Active Year** — Switching the active academic year is an admin-only operation
5. **Stateless API** — The backend is stateless; session data is managed via JWT tokens
6. **File Storage** — Uploaded files (assignments, submissions) are stored locally in `/app/App_Data/Uploads`
7. **Email as Unique Identifier** — User emails must be unique across the system for authentication

### Technical Decisions
1. **JWT over Session Cookies** — Chosen for stateless, scalable API design suitable for both web and mobile clients
2. **Role-Based Authorization** — Implemented at both controller (`[Authorize]`) and service layer for defense in depth
3. **Entity Framework Core** — ORM used for database abstraction and automatic migrations
4. **PostgreSQL** — Chosen for reliability, JSON support, and production-grade features
5. **Next.js Standalone Build** — Minimizes Docker image size and removes Node.js development dependencies
6. **Multi-Stage Dockerfiles** — Separates build environment from runtime for smaller, more secure images
7. **Named Volumes** — Database and upload data persists across container restarts

## Data Validation

### Mobile Number Format
All mobile number fields (teacher phone number and student guardian mobile) follow **Bangladesh format requirements**:

- **Domestic Format**: Exactly 11 digits starting with `01`
  - Example: `01712345678`
  - Represents: 01 (mobile prefix) + 9 additional digits

- **International Format**: `+88` country code followed by 11 digits
  - Example: `+8801712345678`
  - Represents: +88 (country code) + 01 (mobile prefix) + 9 additional digits

- **Flexible Input**: Spaces and hyphens are allowed in input (e.g., `+880 1712-345-678`)

**Validation is enforced on both frontend and backend:**
- Frontend: Real-time validation in add/edit forms with user-friendly error messages
- Backend: API rejects invalid formats with detailed error responses

### Other Input Constraints
- **Email**: Standard RFC 5322 format validation
- **Gender**: Only "Male" or "Female" are accepted
- **Passwords**: Minimum 6 characters (BCrypt hashed)
- **File Names**: Sanitized to prevent directory traversal attacks
- **Text Fields**: Max length constraints enforced at database level

## Known Limitations

1. **Submission Updates** — Students can only update submissions before the deadline; no late submissions are allowed by design
2. **Single Teacher per Subject** — Only one teacher can be assigned to a subject per class (no co-teaching workflow)
3. **File Size Limits** — Large file uploads may be restricted by server configuration (default 100MB)
4. **Real-Time Updates** — The system uses polling; no WebSocket support for real-time notifications
5. **Pagination** — Large lists (assignments, submissions) may need client-side filtering; server-side pagination is not implemented
6. **Timezone Handling** — All timestamps are stored in UTC; client-side timezone conversion uses browser locale
7. **Email Notifications** — Demo doesn't include email notifications; this would require SMTP configuration
8. **Concurrent Operations** — No locking mechanism for concurrent assignment/submission edits by multiple users
9. **Bulk Operations** — No bulk import/export features for users, classes, or assignments (except via database migrations)
10. **Audit Trail** — User action logs are not maintained; this could be added via application/database triggers

## Verification Checklist

After setup, verify everything works:

- [ ] Backend health check: `GET http://localhost:5000/health`
- [ ] Swagger documentation: `http://localhost:5000/swagger`
- [ ] Frontend loads: `http://localhost:3000`
- [ ] Login with admin credentials: `admin@ams.local` / `Admin123!`
- [ ] Create a new assignment as teacher
- [ ] Submit an assignment as student
- [ ] Grade a submission as teacher
- [ ] View submission feedback as student
- [ ] Tests pass: `dotnet test backend/`

## Security Notes

- **JWT Tokens** — Stored in localStorage on frontend (vulnerable to XSS); consider using secure httpOnly cookies in production
- **Password Storage** — User passwords are hashed with BCrypt, never stored in plain text
- **CORS** — Configured to accept requests from frontend URL only; change for production
- **HTTPS** — Required for production; local dev uses HTTP
- **Secret Management** — Use `.env` for secrets; never commit sensitive values
- **SQL Injection** — Protected via Entity Framework's parameterized queries
- **Authorization** — Enforced at controller and service layer; deletion/modification verifies ownership
