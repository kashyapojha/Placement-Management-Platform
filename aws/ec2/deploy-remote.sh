#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/home/ubuntu/app}"

echo "==> Installing backend production dependencies..."
cd "$DEPLOY_PATH/backend"
npm ci --omit=dev

echo "==> Restarting backend with PM2..."
cd "$DEPLOY_PATH"
export DEPLOY_PATH
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save

echo "==> Reloading nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "==> Deployment complete."
pm2 status
