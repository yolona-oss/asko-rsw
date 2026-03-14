#!/bin/sh

set -e

cd /home/deploy/apps/asko

git fetch origin main
git reset --hard origin/main

docker compose pull
docker compose up -d --remove-orphans
docker image prune -f

echo "DEPLOY OK"
