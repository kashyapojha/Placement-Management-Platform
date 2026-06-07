# 🎓 Incipio — Premium Place Management Platform

> A high-fidelity, full-stack university internship coordination and career pipeline management system with real-time synchronization, role-based access, Cloudinary secure PDF/image uploads, Groq AI bio enhancement, and a rich messaging inbox.

---

## 📋 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Features](#-features)
3. [Cloudinary Storage Pipeline — How It Works](#-cloudinary-storage-pipeline--how-it-works)
4. [Application Code Flow](#-application-code-flow)
5. [Project Structure](#-project-structure)
6. [API Reference](#-api-reference)
7. [Getting Started](#-getting-started)
8. [Environment Variables](#-environment-variables)
9. [DevOps & CI/CD](#-devops--cicd)
10. [Troubleshooting Deploy](#-troubleshooting-deploy)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Bundler / Dev Server** | Vite 6 |
| **Styling** | Tailwind CSS v4 (custom HSL palette — Forest Obsidian, Pristine Teal, Warm Linen) |
| **Icons** | Lucide React |
| **Backend Runtime** | Node.js + Express |
| **Database** | MongoDB via Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs password hashing |
| **Cloud Storage** | **Cloudinary** (secure cloud-hosting for resumes and profile picture avatars) |
| **AI Integration** | **Groq API** (`llama-3.3-70b-versatile` model for profile bio enhancement) |
| **File Uploads** | Multer (temporary server-side stream validation, JPEG/PNG/WEBP and PDF filters) |
| **Concurrency** | `concurrently` — runs frontend + backend in one terminal |

---

## ✨ Features

### 🔐 Authentication & Session System
- **Register** as a `Student`, `Company` (Recruiter), `Faculty`, or `Admin`.
- Passwords hashed with **bcrypt (salt rounds: 10)** before database persistence.
- Session tokens generated via **JWT (7-day expiry)**, stored securely in `localStorage`.
- Requests automatically authenticated via `Authorization: Bearer <token>` header.

### 🏢 Role-Based Portal Views
Four distinct user roles, each with a custom interface and capabilities:

| Role | Capabilities |
|---|---|
| **Student** | Browse & apply to listings, track application status, upload resume PDF, manage skills, use AI bio enhancer, manage profile |
| **Company** | Post/delete listings, track candidates in pipeline, update application statuses, trigger automatic update notices |
| **Faculty** | Vett recruiters/students, review/approve new internship listings, track platform metrics, manage pending queues |
| **Admin** | Full system coordinates, platform logs access, user management (invite, change roles, delete accounts) |

---

### 🎓 Faculty Verification Desk (NEW)
A centralized panel allowing university faculty to maintain platform security:
- **Recruiter Vetting**: Verify company profiles as `Genuine` or `Not Genuine` with customizable remarks.
- **Student Profile Verification**: Review student dossiers and mark them as `Verified` or `Unverified` to maintain academic standards.
- **Internship Moderation**: Review posted internship listings. Unverified listings are temporarily hidden from students until flagged as `Verified`.
- **Intelligent Filtering**: Prevents unverified recruiters or non-genuine entities from publishing listings to students.

---

### 📋 Internship Listings & Application Flow
- **Public Browsing**: Explore active listings without needing to log in.
- **Listing Publisher**: Recruiters can post listings via a modal with stipend, location, deadline, skills, and categories.
- **One-Click Apply**: Instantly submit an application using pre-configured profiles and Cloudinary resumes.
- **Inbox Receipt**: Submitting an application automatically triggers an automated receipt message from the company's "Talent Team".

---

### 💬 Messaging System
- **Threaded Inbox**: Conversations are dynamically grouped by student ID and internship context.
- **Premium Chat UI**: Colored bubble alignments, micro-animations, and unread notification indicators.
- **Auto-Scroll & Sync**: Snap-to-bottom scroll logs and a active 3-second polling sync interval keeps messages live.

---

### 👤 Profile Management & AI Integrations (NEW)
- **Profile Photo uploads**: Interactive circle avatar frame with drag-and-drop file picker. Photos are cropped dynamically to a face-centered 250x250 square and uploaded to Cloudinary.
- **AI Bio Enhancer**: Sparkle-themed button that proxies text to Groq (`llama-3.3-70b-versatile`) to professionally rewrite biographies in the first-person, featuring a simulated offline mode fallback.
- **Initial Fallbacks**: If no profile picture is uploaded, both the header and profile circles render the user's first letter (e.g. **N** for Nitin) automatically.

---

## 📄 Cloudinary Storage Pipeline — How It Works

### The Secure File Pipeline

```
Student / Recruiter
    │
    │  multipart/form-data (PDF Resume or Image Avatar)
    ▼
POST /api/upload  or  POST /api/users/upload-avatar
    │
    │  Multer Middleware (backend/config/multer.ts)
    │  ┌────────────────────────────────────────────────────────┐
    │  │ 1. Validates File Type (PDF-only for resumes;          │
    │  │    JPEG/PNG/WEBP/mimetype-check for avatars)           │
    │  │ 2. Enforces Size Limits (5MB for PDF, 2MB for Image)    │
    │  │ 3. Writes temp file on server disk                     │
    │  └────────────────────────────────────────────────────────┘
    │
    │  Uploader Handler (controllers/applicationController.ts / userController.ts)
    │  ┌────────────────────────────────────────────────────────┐
    │  │ 4. Verifies Cloudinary coordinates                     │
    │  │ 5. Uploads to Cloudinary:                              │
    │  │    • Resumes: uploaded as "resource_type: image" to    │
    │  │      preserve .pdf extensions and Content-Type headers │
    │  │    • Avatars: face-centered 250x250 transformation     │
    │  │ 6. fs.unlinkSync() deletes local server temp file      │
    │  └────────────────────────────────────────────────────────┘
    │
    ▼
JSON Response { success: true, url: "https://res.cloudinary.com/..." }
    │
    ├─► Saves Cloudinary secure URL to User document in MongoDB
    │
    └─► Student / Recruiter views asset inline in browser tab
        (Content-Type correctly serves PDF or image preview)
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Create account |
| `POST` | `/api/auth/login` | None | Login, receive JWT |
| `GET` | `/api/auth/me` | Bearer Token | Validate session + get profile |

### Users & Profiles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users` | Bearer Token | Get all users |
| `POST` | `/api/users` | Admin | Create user |
| `PUT` | `/api/users/:id` | Bearer Token | Update profile |
| `POST` | `/api/users/upload-avatar` | Bearer Token | Upload profile picture to Cloudinary (field: `avatar`) |
| `POST` | `/api/users/enhance-bio` | Bearer Token | Proxies professional bio rewrite to Groq |

### Internships
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/internships` | None | List all internships (filters unverified if student) |
| `POST` | `/api/internships` | Company / Admin | Post new listing (defaults to pending approval) |
| `PUT` | `/api/internships/:id` | Faculty / Admin | Moderate listing (update verification/approval states) |
| `DELETE` | `/api/internships/:id` | Company / Admin | Delete listing |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- MongoDB running locally **or** a MongoDB Atlas URI string
- A [Cloudinary Account](https://cloudinary.com/) (free tier works perfectly)
- An [Groq API Key](https://console.groq.com/) (optional, falls back to local simulation)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd internship-management-platform

# Install dependencies for all directories
npm run install-all
```

### Configuration
Copy the example env file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
CORS_ORIGINS=http://localhost:3000

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq Setup (optional)
GROQ_API_KEY=your_groq_key
```

Frontend (optional for local dev):

```bash
cp frontend/.env.example frontend/.env
# VITE_API_BASE_URL=http://localhost:5000/api
```

### ⚡ Critical Cloudinary Security Setup
To prevent Cloudinary from blocking browser previews of your uploaded PDF resumes:
1. Open your **Cloudinary Console**.
2. Go to **Settings (Gear Icon)** ➔ **Security**.
3. Scroll to **Restricted media types** (or **PDF and ZIP files delivery**).
4. **Uncheck** or **Disable** the restriction for **PDF files**.
5. Save changes.

### Run Development Servers
```bash
# Runs frontend (port 3000) and backend (port 5000) concurrently
npm run dev
```

### Build & Test
```bash
npm test          # lint + build (used in CI)
npm run build     # production build
```

### Docker (local)
```bash
docker compose up --build
# App: http://localhost:3000
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas in production) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CORS_ORIGINS` | Yes | Comma-separated allowed frontend URLs |
| `CLOUDINARY_*` | Yes | Cloudinary credentials for uploads |
| `GROQ_API_KEY` | No | AI features (simulates offline if missing) |
| `VITE_API_BASE_URL` | No | Frontend API URL (default: `http://localhost:5000/api`) |

See `backend/.env.example` and `frontend/.env.example` for full templates.

---

## 🚀 DevOps & CI/CD

Pipeline runs on push to `main`/`master` in **3 sequential steps**:

```
1. Build & Test  →  2. Docker Build & Push  →  3. Deploy to AWS (EC2)
```

| Step | What it does |
|---|---|
| **1. Build & Test** | `npm install` → lint → build |
| **2. Docker Build & Push** | Builds images, pushes to DockerHub |
| **3. Deploy to AWS** | SCP artifact to EC2 → PM2 + nginx reload |

### GitHub Secrets required

**DockerHub**
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

**EC2 SSH**
- `EC2_HOST` — public IP only, e.g. `54.123.45.67` (no `http://`)
- `EC2_USER` — `ubuntu`
- `EC2_SSH_PRIVATE_KEY` — full `.pem` file contents

**Application**
- `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GROQ_API_KEY` (optional)

### One-time EC2 setup

```bash
sudo mkdir -p /home/ubuntu/app
sudo chown -R ubuntu:ubuntu /home/ubuntu/app

# Install Node 20, nginx, PM2 (see DEPLOYMENT.md)
sudo DEPLOY_PATH=/home/ubuntu/app bash aws/ec2/setup-server.sh
sudo cp aws/ec2/nginx.conf /etc/nginx/sites-available/placement-platform
sudo ln -sf /etc/nginx/sites-available/placement-platform /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### EC2 security group (inbound)

| Port | Source | Purpose |
|---|---|---|
| 22 | `0.0.0.0/0` | SSH (required for GitHub Actions deploy) |
| 80 | `0.0.0.0/0` | HTTP website |
| 443 | `0.0.0.0/0` | HTTPS (optional) |

Do **not** open port 5000 publicly — backend is internal only.

Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🐛 Troubleshooting Deploy

### SCP / SSH step hangs or fails at "scp file to server"

This usually means GitHub Actions **cannot reach your EC2 on port 22**. Check:

1. **`EC2_HOST` is correct** — use the public IPv4 address only (not private IP, no `http://`)
2. **Security group allows SSH from `0.0.0.0/0`** — GitHub Actions runners use dynamic IPs, so restricting SSH to your home IP will break CI/CD
3. **EC2 instance is running** and has a public IP assigned
4. **`EC2_USER` is `ubuntu`** (for Ubuntu AMI)
5. **`EC2_SSH_PRIVATE_KEY` format** — paste the entire `.pem` file including:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   ...
   -----END RSA PRIVATE KEY-----
   ```
   No extra spaces before/after. If using OpenSSH format (`BEGIN OPENSSH PRIVATE KEY`), that also works.
6. **Deploy directory exists** on EC2:
   ```bash
   sudo mkdir -p /home/ubuntu/app
   sudo chown -R ubuntu:ubuntu /home/ubuntu/app
   ```
7. **Test SSH manually** from your machine:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2_IP>
   ```

### Site loads but API fails

- Set `CORS_ORIGINS` GitHub secret to your public URL: `http://<EC2_IP>`
- In MongoDB Atlas → Network Access, whitelist your EC2 public IP

### Docker push fails

- Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets
- Create token at [DockerHub Security Settings](https://hub.docker.com/settings/security)

---

*Built with ❤️ — Placement Management Platform*
