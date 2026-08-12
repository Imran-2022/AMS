#!/bin/bash
set -e

# Only wait for a local Postgres TCP port when DB_HOST is explicitly provided
# (this is set for the local docker-compose "postgres" service). On managed
# hosts like Render + Neon, DB_HOST is not set — the database is already up,
# so there's nothing to poll for; skip straight to running the migrator.
if [ -n "${DB_HOST:-}" ]; then
  host="${DB_HOST}"
  port="${DB_PORT:-5432}"

  echo "Waiting for ${host}:${port}..."
  while ! bash -c "cat < /dev/tcp/${host}/${port} > /dev/null 2>&1"; do
    sleep 1
  done
  echo "Postgres is available."
else
  echo "DB_HOST not set — skipping TCP wait (assuming managed/remote database is already reachable)."
fi

echo "Running migrator"
exec dotnet AMS.DbMigrator.dll