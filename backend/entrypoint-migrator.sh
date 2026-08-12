#!/bin/bash
set -e

# Wait for Postgres TCP port to be available before running migrations
host=${DB_HOST:-postgres}
port=${DB_PORT:-5432}

echo "Waiting for ${host}:${port}..."
while ! bash -c "cat < /dev/tcp/${host}/${port} > /dev/null 2>&1"; do
  sleep 1
done

echo "Postgres is available, running migrator"
exec dotnet AMS.DbMigrator.dll
