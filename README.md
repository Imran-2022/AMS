# AMS — Assignment & Submission Management System

**Stack:** ASP.NET Core 10 · Next.js 16 · React 19 · PostgreSQL 17 · Architecture: Layered + DDD

A role-based full-stack web application for schools and colleges. Teachers create and grade assignments, students submit and track their work, and admins manage users, classes, and subjects — with everything guarded by JWT authentication and role-based authorization. Built with ASP.NET Core 10, Next.js 16, React 19, and PostgreSQL, following Clean Architecture and Domain-Driven Design principles.

| | |
| :--- | :--- |
| **Project Type** | Full-stack web application |

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Responsibilities](#user-roles--responsibilities)
3. [Technology Stack](#technology-stack)
4. [Key Features](#key-features)
5. [Architecture Overview](#architecture-overview)
6. [Project Structure](#project-structure)
7. [Quick Start - Local Setup](#quick-start---local-setup)
8. [Database Setup](#database-setup)
9. [Running Tests](#running-tests)
10. [Assumptions & Design Decisions](#assumptions--design-decisions)
11. [Known Limitations](#known-limitations)

---

## Overview

This repository contains a complete full-stack application for managing academic assignments and student submissions in educational institutions. The system supports three primary user roles:

- **Admin**: System administrator with full control over users, classes, subjects, and settings
- **Teacher**: Educator who creates and grades assignments, and reviews student submissions
- **Student**: Learner who views assignments, submits work, and receives feedback

All features are protected by JWT-based authentication and role-based authorization.

## User Roles & Responsibilities

| Role | Responsibilities |
| :--- | :--- |
| **Admin** | Manage users (admins, teachers, students); manage classes/courses and subjects; assign teachers to subjects/classes; view all assignments and submissions across the institution; manage application-level settings (academic years, system configuration). |
| **Teacher** | Create, update, and delete assignments; assign an assignment to a specific class/course and subject; define title, description, deadline, and maximum marks; publish an assignment or keep it as a draft; view student submissions; assign marks and provide feedback; change submission status when necessary (e.g. request a resubmission). |
| **Student** | View assignments assigned to their class/course; view assignment details and deadline; submit an answer (with attachments); update a submission before the deadline; view submission status, marks, and teacher feedback. |

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

## Architecture Overview

The backend is organized into layered projects to separate business rules from persistence and presentation concerns:

| Layer (Project) | Responsibility | Key Contents |
| :--- | :--- | :--- |
| **AMS.Domain** | Core business entities and rules | `User`, `TeacherProfile`, `StudentProfile`, `Assignment`, `Submission`, `ClassCourse`, repository interfaces |
| **AMS.Domain.Shared** | Cross-cutting shared types | `UserRole`, `AssignmentStatus`, `SubmissionStatus`, `NotificationType` enums, domain exceptions |
| **AMS.Application** | Business logic and use cases | App services (`AssignmentAppService`, `SubmissionAppService`, `AuthAppService`, etc.), authorization handlers, validators |
| **AMS.Application.Contracts** | DTOs and service interfaces | Request/response DTOs, `I*AppService` interfaces — the contract between API and business logic |
| **AMS.EntityFrameworkCore** | Data access | `AmsDbContext`, entity configurations, repository implementations, EF Core migrations |
| **AMS.HttpApi** | API controllers | REST controllers per feature area, mapped to application services |
| **AMS.HttpApi.Host** | Composition root | Startup, dependency injection, JWT/auth configuration, Swagger, CORS |
| **AMS.Infrastructure** | External services | Local file storage service for attachments and avatars |
| **AMS.DbMigrator** | Database bootstrap | Applies EF Core migrations and seeds demo data |
| **ClientApp (frontend)** | Presentation | Next.js App Router UI, one route group per role |
| **Tests** | Quality assurance | xUnit projects covering domain rules, application services, and controllers/authorization |

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

Important for local manual runs:
- If environment variables are not exported into the current shell, the backend will fall back to the values in `backend/src/AMS.HttpApi.Host/appsettings.json`
- That file must also match your local PostgreSQL username/password and your local JWT/URL settings
- For example, if your pgAdmin PostgreSQL user is `postgres` and the password is `root`, then the backend connection string must use `Password=root` as well



#### Step 2: Make sure PostgreSQL is running and the database is ready
Before the backend can run, PostgreSQL must be up and reachable on `localhost:5432`.

Then initialize the database schema and seed the demo data before starting the API:

```bash
cd backend
dotnet restore
dotnet run --project src/AMS.DbMigrator
```

This step is required because it:
- creates/updates database tables
- applies EF Core migrations
- seeds demo users and test data
- makes sure login and admin/teacher/student flows work immediately

> If PostgreSQL is not running, start the local PostgreSQL service first. Without a reachable database, the API and tests will fail.

#### Step 3: Start the backend API
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
# - OPTIONAL: change API_PORT, FRONTEND_PORT, POSTGRES_PORT if needed

# Build and start all services
docker compose up --build
```

The actual service URLs depend on the values in the root `.env` file:
- `POSTGRES_PORT` controls where PostgreSQL is exposed on the host
- `API_PORT` controls where the backend API is exposed on the host
- `FRONTEND_PORT` controls where the frontend is exposed on the host
- `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` must match the frontend/backend host URLs used by the app


If you keep the defaults from `.env.example`, the services will be:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger: http://localhost:5000/swagger
- PostgreSQL: localhost:5432

### Demo Credentials

Use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gmail.com` | `Admin123!` |
| Teacher | `teacher@gmail.com` | `Teacher123!` |
| Teacher 2 | `teacher2@gmail.com` | `Teacher123!` |
| Student | `student@gmail.com` | `Student123!` |
| Student 2 | `student2@gmail.com` | `Student123!` |
| Student 3 | `student3@gmail.com` | `Student123!` |

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
- **Classes & Sections** — Hierarchical structure: Academic Year → Class Definition → Group (optional) → Section
- **Subjects** — Defined per class per academic year; teachers assigned to subject+class combinations
- **Assignments** — Created by teachers, assigned to specific classes with deadlines
- **Submissions** — Student work submitted per assignment with status tracking
- **Users** — Three roles with encrypted passwords (BCrypt) and JWT authentication

## Running Tests

Unit tests are organized by layer with focused coverage on business rules and authorization:

```bash
# Run all tests
dotnet test backend/AMS.sln

# Run specific test project
dotnet test tests/AMS.Application.Tests/AMS.Application.Tests.csproj
dotnet test tests/AMS.Domain.Tests/AMS.Domain.Tests.csproj
dotnet test tests/AMS.HttpApi.Tests/AMS.HttpApi.Tests.csproj

```

### Test Coverage
- **Application Tests** — Business logic, authorization checks, submission workflows
- **Domain Tests** — Entity validation, domain rules (e.g., submissions, assignments)
- **Controller Tests** — API endpoints, HTTP status codes, integration scenarios (including a dedicated RBAC integration suite that checks every role/endpoint combination)

## Assumptions & Design Decisions

Since the assignment brief allows a "different but suitable design," the following decisions were made where requirements were not explicit:

- **User model split** — `User` holds shared account fields (name, email, password hash, role, avatar, contact info); `TeacherProfile` and `StudentProfile` are one-to-one extensions holding role-specific fields (employee ID/qualification for teachers, student ID/guardian info for students). The application layer enforces that a `TeacherProfile` can only exist for a `Teacher` and a `StudentProfile` only for a `Student`.
- **Class hierarchy** — Classes are modeled as `AcademicYear → ClassDefinition → Group (optional) → ClassCourse (section)`, with `Subject` scoped to a `ClassCourse`. Teachers are assigned to a `Subject` + `ClassCourse` pair via `TeacherSubjectAssignment`, and students are linked to a `ClassCourse` via `StudentEnrollment` (at most one active enrollment per student at a time).
- **Assignment → Subject, not Assignment → Class directly** — an assignment is created against a `Subject`, which is itself scoped to a class/section, so "assign to a class" is satisfied indirectly and consistently with who teaches what.
- **One submission per student per assignment** — a student's submission is a single row that gets updated (not re-inserted) on resubmission; history of status changes (Submitted → Late/UnderReview → Graded/ResubmissionRequested → Resubmitted) is tracked via the `SubmissionStatus` enum rather than a separate audit table.
- **File attachments are unified** — assignment attachments, submission attachments, and user avatars all go through a single `Attachment` entity (`OwnerType` + `OwnerId`) and a local file storage service, rather than separate upload pipelines per feature.
- **Draft vs. Published assignments** — draft assignments are only visible to the owning teacher and admins; students only see assignments once `AssignmentStatus = Published`.
- **Notifications are in-app only** — the notification system (assignment published, submission received, graded, resubmission requested) is delivered and stored in-app with per-user, per-type preferences; it does not send email/SMS (see Known Limitations).
- **PostgreSQL over MongoDB** — chosen because the domain is inherently relational (users/roles/classes/subjects/assignments/submissions with strict foreign-key relationships), which Entity Framework Core + PostgreSQL models directly with migrations, constraints, and unique indexes.

## Known Limitations

- **No email/SMS notifications** — notifications are in-app only; there is no outbound email or SMS integration for assignment/grading events.
- **No password reset / forgot-password flow** — account creation and password changes are handled by Admin/Auth endpoints; there is no self-service "forgot password" email flow.
- **Local file storage only** — attachments are stored on local disk (`App_Data/Uploads`, or the `ams-uploads` Docker volume) rather than a cloud object store (e.g. S3/Azure Blob); this is fine for local/demo use but would need to change for a multi-instance production deployment.
- **No automated CI pipeline** — tests are run manually via `dotnet test`; the repository does not currently include a CI workflow (e.g. GitHub Actions).
- **Single active enrollment per student** — the data model assumes a student belongs to one class/section at a time; it does not support a student being concurrently enrolled in multiple classes.

## Assignment Requirements Checklist

| Requirement | Status |
| :--- | :--- |
| Frontend: Next.js, React, TypeScript, responsive UI, form validation, API integration | ✅ |
| Backend: ASP.NET Core Web API, C#, RESTful API, validation, error handling, logging, Swagger/OpenAPI | ✅ |
| Database: PostgreSQL with defined relationships | ✅ |
| Authentication: Login, JWT-based auth, role-based authorization | ✅ |
| Testing: Unit tests covering business rules, authorization, submission workflows | ✅ |
| Database files: migrations + seed data, no manual table creation needed | ✅ (`AMS.DbMigrator`) |
| README: overview, features, tech stack, structure, setup, DB setup, run frontend/backend, run tests, assumptions, limitations | ✅ (this document) |
| Demo credentials for Admin, Teacher, Student | ✅ (see [Demo Credentials](#demo-credentials)) |
| `.env.example` with no real secrets | ✅ (root `.env.example` and `frontend/.env.local.example`) |
| Optional: Docker configuration | ✅ (`docker-compose.yml`) |
| Optional: Swagger/API URL | ✅ (`/swagger` in development) |