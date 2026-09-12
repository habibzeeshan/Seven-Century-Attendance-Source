#!/usr/bin/env bash
# Run as the app's dedicated system user, e.g.:
#   sudo -u attendance /var/www/attendance/app/scripts/deploy-prod.sh
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

git pull --ff-only origin main

docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d app

docker compose -f docker-compose.prod.yml ps
