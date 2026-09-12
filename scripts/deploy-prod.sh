#!/usr/bin/env bash
# Run as the app's dedicated system user, from the app directory, e.g.:
#   sudo -u attendance bash -c 'cd /var/www/attendance/app && bash scripts/deploy-prod.sh'
set -euo pipefail

git pull --ff-only origin main

docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d app

docker compose -f docker-compose.prod.yml ps
