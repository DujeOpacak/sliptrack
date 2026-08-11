#!/usr/bin/env bash
# Pokreće se NA VPS-u preko GitHub Actions SSH koraka (.github/workflows/deploy.yml)
# nakon svakog pusha/mergea na main. Pretpostavlja da je ~/sliptrack već klonirani
# repo s checkoutanim main branchom i da sliptrack-admin/.env.production već postoji
# (commitan u repo — vidi .gitignore iznimku).
set -euo pipefail

cd ~/sliptrack

echo "=== git pull (main) ==="
git fetch origin
git reset --hard HEAD
git checkout main
git reset --hard origin/main

echo "=== admin build ==="
cd sliptrack-admin
npm ci
npm run build
cd ..

echo "=== docker compose build + up ==="
cd docker
docker compose -f docker-compose.prod.yml up -d --build

echo "=== deploy gotov ==="
docker compose -f docker-compose.prod.yml ps
