#!/bin/sh

set -e

cd /home/asko-rws/apps/asko

echo "backup current commit"
OLD=$(git rev-parse HEAD)

git fetch origin main
git reset --hard origin/main

if ! docker compose build; then
  echo "BUILD FAILED"
  git reset --hard $OLD
  exit 1
fi

if ! docker compose up -d --remove-orphans; then
  echo "UP FAILED"
  git reset --hard $OLD
  docker compose up -d
  exit 1
fi

docker image prune -f

echo "DEPLOY OK"
