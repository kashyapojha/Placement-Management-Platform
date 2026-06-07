# Placera — Premium Career Placement Platform

> Full-stack university placement and internship management platform for **Sir Padampat Singhania University (SPSU)** — role-based portals, faculty verification, application tracking, Cloudinary uploads, and Groq-powered AI career tools.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Web Features](#web-features)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [DevOps & CI/CD](#devops--cicd)
7. [EC2 Deploy Setup (Required)](#ec2-deploy-setup-required)
8. [Troubleshooting Deploy](#troubleshooting-deploy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router 7 |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB (Mongoose) — MongoDB Atlas in production |
| **Auth** | JWT + bcryptjs |
| **File Storage** | Cloudinary (resumes & avatars) + Multer (temp upload) |
| **AI** | Groq API (`llama-3.3-70b-versatile`) |
| **Deploy** | AWS EC2, nginx, PM2, GitHub Actions, DockerHub |

---

## Web Features

### Public landing page
- Animated hero, stats counters, company marquee, and feature showcase
- Browse internship listings without logging in
- Login / Register entry points

### Authentication (4 roles)
| Role | Portal capabilities |
|---|---|
| **Student** | Dashboard metrics, browse/apply to listings, AI placement match score, career chatbot, profile & resume upload, application tracker, messaging |
| **Company** | Post/delete listings, candidate pipeline, update application status (Applied → Interview → Offer → Rejected), automated applicant notifications |
| **Faculty** | Verification desk — vet recruiters (Genuine/Not Genuine), verify student profiles, moderate internship listings, audit applications |
| **Admin** | User management (invite, role change, delete), platform activity logs, full system oversight |

### Dashboard (role-specific)
- **Student** — applications submitted, interviews scheduled, offers received
- **Company** — active listings, total applicants, pipeline breakdown
- **Faculty** — pending verifications, listings awaiting approval, platform metrics
- **Admin** — user counts, recent activity feed

### Internship listings
- Public job board with stipend, location, deadline, skills, and categories
- Recruiters publish listings (pending faculty approval by default)
- Students apply in one click using saved profile + Cloudinary resume
- **AI Placement Match Audit** — Groq-powered match score, strong points, gaps, and bio recommendations per listing

### Application tracker
- Full pipeline view: Applied → Interview → Offer → Rejected
- Company updates status with optional offer details
- Faculty verifies applications (Verified / Unverified with remarks)
- Automated inbox receipt message on application submit

### Faculty verification desk
- **Recruiter vetting** — Genuine / Not Genuine with remarks
- **Student profile verification** — Verified / Unverified
- **Listing moderation** — hide unverified listings from students
- **Application audit** — faculty sign-off on placements

### Messaging inbox
- Threaded conversations by student + internship context
- Unread indicators, bubble UI, auto-scroll
- Live sync via polling

### Profile management
- Avatar upload (Cloudinary, face-centered crop)
- Resume PDF upload (Cloudinary)
- Skills management, bio editor
- **AI Bio Enhancer** — Groq rewrites biography professionally (offline simulation fallback)

### AI Career Advisor (students only)
- Floating chatbot widget — interview prep, GPA tips, cover letter advice
- Powered by Groq with conversation history
- Markdown-formatted AI responses

### Admin panel
- Invite users, change roles, delete accounts
- Activity log viewer

---

## Project Structure

```
Placement-Management-Platform/
├── frontend/                 # React SPA (Vite)
│   └── src/
│       ├── components/       # Landing, Auth, Dashboard, Listings, Tracker,
│       │                     # Profile, Messages, Admin, CareerAdvisorChatbot
│       └── services/api.ts   # REST API client
├── backend/                  # Express API
│   ├── controllers/          # auth, users, internships, applications, messages
│   ├── models/               # User, Internship, Application, Message, ActivityLog
│   ├── routes/
│   └── config/               # db, cloudinary, multer
├── aws/ec2/                  # nginx, PM2, setup & deploy scripts
├── .github/workflows/        # CI/CD pipeline
├── docker-compose.yml        # optional local Docker
└── DEPLOYMENT.md             # full deploy guide
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB local or [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Cloudinary](https://cloudinary.com/) account
- [Groq API key](https://console.groq.com/) (optional)

### Install & run locally

```bash
git clone <repo-url>
cd Placement-Management-Platform
npm run install-all

cp backend/.env.example backend/.env   # fill in values
npm run dev                              # frontend :3000, backend :5000
```

### Build & test

```bash
npm test          # lint + build (CI step 1)
npm run build     # production build
```

### Docker (local only)

```bash
docker compose up --build
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secure_secret
CORS_ORIGINS=http://localhost:3000

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

GROQ_API_KEY=...          # optional
```

### Frontend (`frontend/.env` — optional)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CLOUDINARY_*` | Yes | Resume & avatar uploads |
| `GROQ_API_KEY` | Yes (CI/CD) | AI chat, bio enhancer, match audit |
| `JWT_SECRET` | No | Optional — backend uses built-in default if omitted |
| `CORS_ORIGINS` | No | Optional — auto-set to `http://<EC2_IP>` on deploy if omitted |
| `VITE_API_BASE_URL` | No | `/api` in production behind nginx |

### Cloudinary PDF setup
1. Cloudinary Console → Settings → Security
2. Disable **PDF files delivery** restriction
3. Save — allows browser PDF preview

---

## DevOps & CI/CD

Pipeline runs on push to `main`/`master`:

```
1. Build & Test  →  2. Docker Build & Push  →  3. Deploy to AWS EC2
```

| Step | Action |
|---|---|
| **1** | `npm install` → lint → build |
| **2** | Build & push images to DockerHub |
| **3** | SCP to EC2 → write `.env` → PM2 restart → nginx reload |

### GitHub Secrets

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | DockerHub username |
| `DOCKERHUB_TOKEN` | DockerHub access token |
| `EC2_HOST` | Public IPv4 only (e.g. `54.123.45.67`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_PRIVATE_KEY` | Full `.pem` file contents |
| `MONGODB_URI` | Atlas connection string |
| `GROQ_API_KEY` | Groq API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**Not needed in GitHub Secrets** (handled automatically):
- `JWT_SECRET` — backend code default is used
- `CORS_ORIGINS` — pipeline sets `http://<EC2_HOST>` from your `EC2_HOST` secret

---

## EC2 Deploy Setup (Required)

### Why deploy fails without this

SCP connects via SSH, then copies files into a **fixed target path**. If the folder does not exist or permissions are wrong, step 3 fails silently or with a path error.

**Always use this path — and only this path:**

```
/home/ubuntu/app/
├── frontend/          ← React build (dist)
├── backend/           ← Node.js API + .env
│   └── uploads/       ← temp resume files
├── uploads/           ← shared upload dir
├── ecosystem.config.cjs
└── deploy-remote.sh
```

### Step 1 — SSH into EC2 and create folders (one-time)

```bash
ssh -i your-key.pem ubuntu@<EC2_IP>

mkdir -p /home/ubuntu/app/frontend
mkdir -p /home/ubuntu/app/backend/uploads
mkdir -p /home/ubuntu/app/uploads

sudo chown -R ubuntu:ubuntu /home/ubuntu/app
```

### Step 2 — Install server software (one-time)

```bash
# From your local machine
scp -r aws/ec2 ubuntu@<EC2_IP>:/tmp/placement-ec2

# On EC2
sudo DEPLOY_PATH=/home/ubuntu/app bash /tmp/placement-ec2/setup-server.sh
sudo cp /tmp/placement-ec2/nginx.conf /etc/nginx/sites-available/placement-platform
sudo ln -sf /etc/nginx/sites-available/placement-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Step 3 — CI/CD SCP target (already configured)

The workflow copies to exactly:

```
/home/ubuntu/app/deploy.tar.gz
```

Then extracts into `/home/ubuntu/app/` — **not** `/home/ubuntu/deploy-package`, not `/var/www`, not relative paths.

### EC2 security group

| Port | Source | Purpose |
|---|---|---|
| 22 | `0.0.0.0/0` | SSH (GitHub Actions deploy) |
| 80 | `0.0.0.0/0` | HTTP website |
| 443 | `0.0.0.0/0` | HTTPS (optional) |

Do **not** open port 5000 — backend is internal only.

### MongoDB Atlas

Atlas → Network Access → add EC2 public IP (`x.x.x.x/32`).

---

## Troubleshooting Deploy

### `ssh-keyscan` fails (exit code 1)

Usually means `EC2_HOST` was empty or malformed at runtime. Fix:

1. **EC2_HOST format** — IP only: `3.110.xxx.xxx` (no `http://`, no `:22`, no quotes)
2. **Required secrets for deploy** — `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`, `MONGODB_URI`, `GROQ_API_KEY`, `CLOUDINARY_*`
   - `JWT_SECRET` and `CORS_ORIGINS` are **not required** — omitted on purpose
3. Workflow maps secrets via job `env:` — re-run pipeline after fixing secrets

### SCP / SSH fails

| Check | Fix |
|---|---|
| Wrong `EC2_HOST` | Public IPv4 only, no `http://` prefix |
| SSH blocked | Security group port 22 open to `0.0.0.0/0` |
| Bad SSH key | Full `.pem` in `EC2_SSH_PRIVATE_KEY` secret |
| Folder missing | Run Step 1 folder creation on EC2 |
| Permission denied | `sudo chown -R ubuntu:ubuntu /home/ubuntu/app` |

Test manually:

```bash
ssh -i your-key.pem ubuntu@<EC2_IP>
ls -la /home/ubuntu/app
```

### Site loads but API fails

- CORS is auto-set from `EC2_HOST` — ensure `EC2_HOST` is your correct public IP
- MongoDB Atlas whitelists EC2 IP
- Check backend: `pm2 logs placement-backend`

### Health check

```bash
curl http://<EC2_IP>/health
# → { "status": "ok", "database": "connected" }
```

---

*Placera — SPSU Premium Career Placement Platform*
