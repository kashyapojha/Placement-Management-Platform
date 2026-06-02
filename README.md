# 🎓 Incipio — Premium Internship Management Platform

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
Create `backend/.env` (using `.env.example` as a baseline) and fill in your coordinates:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq Setup
GROQ_API_KEY=your_groq_key
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

---

*Built with ❤️ — Incipio Premium Platform*
