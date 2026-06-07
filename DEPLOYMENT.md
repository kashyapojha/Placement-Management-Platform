# DevOps & AWS EC2 Deployment Guide

This project deploys to an **AWS EC2 instance** via GitHub Actions. No Docker registry (DockerHub/ECR) is used in production CI/CD.

## Pipeline Overview

```
Push to main/master
    │
    ▼
┌─────────────────┐
│  Build & Test   │  npm install → lint → build
└────────┬────────┘
         ▼
┌─────────────────┐
│  Build Prod     │  frontend (VITE_API_BASE_URL=/api) + backend
└────────┬────────┘
         ▼
┌─────────────────┐
│  Package        │  tar.gz with dist folders + PM2 config
└────────┬────────┘
         ▼
┌─────────────────┐
│  SCP → EC2      │  copy artifact over SSH
└────────┬────────┘
         ▼
┌─────────────────┐
│  Deploy on EC2  │  write .env → npm ci → PM2 restart → nginx reload
└─────────────────┘
```

## Architecture on EC2

```
Internet → EC2 (port 80)
              │
              ├── nginx → serves frontend/dist (React SPA)
              │
              └── nginx /api/* → proxy → Node.js backend (PM2, port 5000)
                                              │
                                              └── MongoDB Atlas (external)
```

| Component | Role |
|---|---|
| **nginx** | Serves static frontend + reverse-proxies `/api` to backend |
| **PM2** | Keeps the Node.js backend running and auto-restarts on crash |
| **MongoDB Atlas** | Production database (not installed on EC2) |

## 1. One-Time EC2 Setup

### Launch EC2 instance

- **AMI:** Ubuntu 22.04 or 24.04
- **Instance type:** `t3.small` or larger
- **Security group inbound rules:**
  - SSH (22) — your IP only
  - HTTP (80) — `0.0.0.0/0`
  - HTTPS (443) — `0.0.0.0/0` (when you add SSL)

### Bootstrap the server

SSH into the instance and run:

```bash
# Copy setup files to the server (from your local machine)
scp -r aws/ec2 ubuntu@<EC2_IP>:/tmp/placement-ec2

# On the EC2 instance
sudo DEPLOY_PATH=/opt/placement-platform bash /tmp/placement-ec2/setup-server.sh
sudo cp /tmp/placement-ec2/nginx.conf /etc/nginx/sites-available/placement-platform
sudo nginx -t && sudo systemctl reload nginx
```

This installs **Node.js 20**, **nginx**, **PM2**, and creates `/opt/placement-platform`.

## 2. GitHub Actions Secrets

Add these in **Settings → Secrets and variables → Actions**:

### EC2 connection

| Secret | Example | Description |
|---|---|---|
| `EC2_HOST` | `54.123.45.67` | EC2 public IP or DNS |
| `EC2_USER` | `ubuntu` | SSH username |
| `EC2_SSH_PRIVATE_KEY` | `-----BEGIN RSA...` | Private key (.pem) contents |
| `EC2_DEPLOY_PATH` | `/opt/placement-platform` | Deploy directory on EC2 |

### Application credentials (injected as `backend/.env` on each deploy)

| Secret | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Strong random JWT signing secret |
| `CORS_ORIGINS` | Public site URL, e.g. `http://54.123.45.67` or `https://yourdomain.com` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GROQ_API_KEY` | Groq API key (optional) |

> **Note:** App API keys go in GitHub Secrets and are written to EC2 at deploy time. They are never committed to the repo.

## 3. What Happens on Each Deploy

1. CI builds frontend with `VITE_API_BASE_URL=/api` (same-origin API calls through nginx)
2. CI builds backend TypeScript → JavaScript
3. Artifacts are packaged into `deploy.tar.gz`
4. Package is copied to EC2 via SCP
5. `backend/.env` is created from GitHub Secrets
6. `deploy-remote.sh` runs on EC2:
   - `npm ci --omit=dev` in backend
   - `pm2 startOrRestart` backend
   - `nginx reload`

## 4. Local Development

```bash
npm run install-all
cp backend/.env.example backend/.env
npm run dev    # frontend :3000, backend :5000
```

## 5. Build & Test (CI step)

```bash
npm run install-all
npm test
```

## 6. Optional: Docker for Local Dev Only

Docker Compose is available for local containerized testing. It is **not** used in the production CI/CD pipeline.

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

## 7. Manual Deploy (without CI)

```bash
# Build locally
VITE_API_BASE_URL=/api npm run build --prefix frontend
npm run build --prefix backend

# Package
mkdir -p deploy-package/frontend deploy-package/backend/uploads
cp -r frontend/dist deploy-package/frontend/
cp -r backend/dist deploy-package/backend/
cp backend/package.json backend/package-lock.json deploy-package/backend/
cp aws/ec2/ecosystem.config.cjs aws/ec2/deploy-remote.sh deploy-package/
tar -czf deploy.tar.gz -C deploy-package .

# Copy and deploy on EC2
scp deploy.tar.gz ubuntu@<EC2_IP>:/opt/placement-platform/
ssh ubuntu@<EC2_IP> "cd /opt/placement-platform && tar -xzf deploy.tar.gz && DEPLOY_PATH=/opt/placement-platform ./deploy-remote.sh"
```

Ensure `backend/.env` exists on EC2 before manual deploy.

## 8. SSL / Custom Domain (recommended for production)

1. Point your domain A-record to the EC2 public IP
2. Install Certbot on EC2:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

3. Update `CORS_ORIGINS` GitHub secret to `https://yourdomain.com`

## 9. Health Checks

| Endpoint | Expected |
|---|---|
| `GET /health` | `{ "status": "ok", "database": "connected" }` |
| `GET /` | React SPA loads |

## 10. Useful EC2 Commands

```bash
pm2 status                          # backend process status
pm2 logs placement-backend          # backend logs
sudo nginx -t                       # test nginx config
sudo systemctl status nginx         # nginx status
cat /opt/placement-platform/backend/.env   # verify env (careful — contains secrets)
```
