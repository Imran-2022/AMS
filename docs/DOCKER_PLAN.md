# AMS — Dockerization Plan

Goal: `docker compose up` from a fresh clone gives a running Postgres + migrated/seeded
database + API + frontend, with zero manual steps.

## 1. Where things go

```
AMS/
├── docker-compose.yml
├── .env                          # secrets/config for compose (gitignored, .env.example committed)
├── backend/
│   ├── Dockerfile                # multi-stage: build once, produce 2 images (api, migrator)
│   ├── .dockerignore
│   └── src/...
└── frontend/
    ├── Dockerfile                # multi-stage Next.js standalone build
    ├── .dockerignore
    └── ...
```

## 2. Services

| Service | Image built from | Role | Depends on |
|---|---|---|---|
| `postgres` | `postgres:17-alpine` | Data store, named volume `pg-data` | — |
| `migrator` | `backend/Dockerfile` (`target: migrator`) | Runs `dotnet ef` migrations + the seeder, then **exits** | `postgres` healthy |
| `api` | `backend/Dockerfile` (`target: api`) | ASP.NET Core Web API on port 8080→5000 | `migrator` completed successfully |
| `frontend` | `frontend/Dockerfile` | Next.js standalone server on port 3000 | `api` started |

`migrator` is not a long-running service — it's the container equivalent of what you do
manually today (`dotnet run` on `AMS.DbMigrator`). Compose's
`condition: service_completed_successfully` makes `api` wait for it to finish and exit 0
before starting, so the API never boots against an un-migrated database.

## 3. Key decisions

- **One Dockerfile, two build targets** for the backend (`api` and `migrator`), since both
  are published from the same solution and share the same restore/build layer — avoids
  duplicating the SDK download and restore step in two separate Dockerfiles.
- **Multi-stage builds** for both backend and frontend: SDK/Node toolchain only exists in
  the build stage; the final images use the slim ASP.NET/Node runtime, not the full SDK.
- **`App_Data/Uploads` becomes a named volume** (`ams-uploads`) mounted into the `api`
  container, so files students/teachers upload survive `docker compose down` /
  container recreation, instead of living inside the (ephemeral) container filesystem.
- **Postgres data is a named volume** (`pg-data`) for the same reason.
- **Config via environment variables**, not baked into the image — `docker-compose.yml`
  reads a `.env` file for the JWT key, Postgres password, and ports, so nothing secret is
  hardcoded in a committed file. `.env.example` (already in your repo) becomes the
  template; `.env` itself stays gitignored.
- **Frontend calls the API from the browser**, not container-to-container (it already uses
  `NEXT_PUBLIC_API_URL`, a build/runtime-injected public env var) — so that var stays as
  `http://localhost:5000` (the host-mapped port), not the Docker service name. Only the
  backend's `FrontendUrl` (used for CORS) and the connection string need Docker's internal
  DNS (`postgres` as hostname).
- **Healthcheck on Postgres** (`pg_isready`) so `migrator` doesn't race a Postgres
  container that's still initializing.

## 4. One-time source changes needed

1. `frontend/next.config.js` — add `output: 'standalone'` so `next build` produces the
   trimmed `.next/standalone` folder the frontend Dockerfile copies (this is what keeps
   the final frontend image small and dependency-free).
2. Nothing else in your source needs to change — the backend already reads
   `ConnectionStrings__DefaultConnection` and `Jwt__*` from environment variables
   (see your existing `.env.example`), which is exactly what compose will inject.

## 5. Run instructions (for the README)

```bash
cp .env.example .env        # fill in a real JWT key + postgres password
docker compose up --build   # first run: builds images, migrates, seeds, starts everything
```

- API: http://localhost:5000 (Swagger at `/swagger`)
- Frontend: http://localhost:3000
- `docker compose down` stops everything; add `-v` to also wipe the Postgres/uploads volumes
  for a totally clean slate (equivalent to your "delete the DB and start fresh" workflow now).
- `docker compose logs -f migrator` to check migration/seed output if `api` doesn't come up.

## 6. Files

See `docker-compose.yml`, `backend/Dockerfile`, `backend/.dockerignore`,
`frontend/Dockerfile`, `frontend/.dockerignore` alongside this plan — copy each into the
matching location in your repo.
