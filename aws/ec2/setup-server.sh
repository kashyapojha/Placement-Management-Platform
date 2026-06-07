#!/usr/bin/env bash
# One-time EC2 bootstrap (Ubuntu 22.04 / 24.04)
# Run as: sudo bash setup-server.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/home/ubuntu/app}"
APP_USER="${APP_USER:-ubuntu}"

echo "==> Installing system packages..."
apt-get update
apt-get install -y curl nginx

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "==> Installing PM2..."
npm install -g pm2

echo "==> Creating deploy directory..."
mkdir -p "$DEPLOY_PATH/backend/uploads"
chown -R "$APP_USER:$APP_USER" "$DEPLOY_PATH"

echo "==> Configuring nginx..."
cp "$DEPLOY_PATH/nginx.conf" /etc/nginx/sites-available/placement-platform 2>/dev/null || \
  cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/placement-platform

ln -sf /etc/nginx/sites-available/placement-platform /etc/nginx/sites-enabled/placement-platform
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Configuring PM2 startup..."
sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
sudo -u "$APP_USER" pm2 save

echo "==> EC2 server setup complete."
echo "    Deploy path: $DEPLOY_PATH"
echo "    Next: add GitHub secrets and push to main to trigger CI/CD."
