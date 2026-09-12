#!/usr/bin/env bash
# Rebuilds and restarts the production app from whatever is currently on
# disk in this directory, without touching git. For direct-edit workflows.
# Run as the app's dedicated system user, e.g.:
#   sudo -u attendance /var/www/attendance/app/scripts/rebuild-prod.sh
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d app

docker compose -f docker-compose.prod.yml ps
