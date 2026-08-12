# AMS

Assignment & Submission Management System.

## Overview

This repository contains a .NET backend and a Next.js frontend for an assignment and submission management system.

## Backend

### Projects
- `backend/src/AMS.Domain.Shared` — shared enums and exception types.
- `backend/src/AMS.Domain` — domain entities, repository interfaces.
- `backend/src/AMS.Application.Contracts` — DTOs and service interfaces.
- `backend/src/AMS.Application` — application services and use case logic.
- `backend/src/AMS.EntityFrameworkCore` — EF Core DbContext, migrations, repository implementations.
- `backend/src/AMS.HttpApi` — API controllers.
- `backend/src/AMS.HttpApi.Host` — host startup, JWT auth, Swagger, DI wiring.
- `backend/src/AMS.DbMigrator` — migration and seed runner.

### Running backend

1. Open a terminal in `backend`.
2. Restore packages:
   ```bash
   dotnet restore
   ```
3. Apply migrations and seed demo data:
   ```bash
   dotnet run --project src/AMS.DbMigrator
   ```
4. Run the API host:
   ```bash
   dotnet run --project src/AMS.HttpApi.Host
   ```

By default, the API listens on `http://localhost:5000` and exposes Swagger at `http://localhost:5000/swagger`.

### Demo credentials

- Admin: `admin@ams.local` / `Admin123!`
- Teacher: `teacher@ams.local` / `Teacher123!`
- Teacher 2: `teacher2@ams.local` / `Teacher123!`
- Student: `student@ams.local` / `Student123!`
- Student 2: `student2@ams.local` / `Student123!`
- Student 3: `student3@ams.local` / `Student123!`

## Frontend

### Running frontend

1. Open a terminal in `frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

### Environment

Create `frontend/.env.local` with:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## How to verify

- Backend health: `http://localhost:5000/health`
- Swagger: `http://localhost:5000/swagger`
- Frontend: `http://localhost:3000`
- Login using one of the demo accounts.
- After login, navigate to the role dashboard.
- Verify protected API calls work by loading assignments or submissions in the UI.

## Notes

- The backend uses JWT bearer tokens for authentication.
- The frontend stores the JWT in local storage and sends it in the `Authorization` header.
- API endpoints are protected by `[Authorize]` and enforce role/ownership rules in the application layer.

## Docker

Quick start (from repository root):

```bash
cp .env.example .env   # edit secrets (JWT_KEY, POSTGRES_PASSWORD)
docker compose up --build
```

Services:
- API: http://localhost:5000 (Swagger at `/swagger`)
- Frontend: http://localhost:3000

To bring everything down:

```bash
docker compose down
# Add -v to remove volumes: docker compose down -v
```
