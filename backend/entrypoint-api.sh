#!/bin/bash
set -e

# Render (and similar platforms) inject PORT at runtime and expect the app to
# bind to it. Locally (docker-compose), PORT is never set, so this falls back
# to 8080 — matching the container-internal port docker-compose.yml already maps.
export ASPNETCORE_URLS="http://+:${PORT:-8080}"

echo "Starting API on ${ASPNETCORE_URLS}"
exec dotnet AMS.HttpApi.Host.dll
