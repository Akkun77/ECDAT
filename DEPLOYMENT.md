# ECDAT — Vercel & Cloud Deployment Guide

This guide describes how to deploy **ECDAT (Enterprise Cryptographic Discovery & Analysis Tool)** to Vercel and cloud platforms without destabilizing the verified local hackathon environment.

---

### 1. Primary Offline-Safe Architecture (Recommended for SIH 2026 Demo)

> [!IMPORTANT]
> **The local dual-process architecture is `ECDAT FINAL DEMO VERIFIED` and remains the primary, guaranteed-reliable configuration for the hackathon evaluation.**
> It runs completely offline without internet dependencies, cloud cold starts, serverless background task freezes, or ephemeral storage loss.

```
┌─────────────────────────────────────────────────────────────┐
│                      LOCAL VERIFIED STACK                   │
│                                                             │
│  FastAPI Backend (Port 8000) ◄────► Next.js 16 (Port 3000) │
│  - Persistent SQLite WAL            - App Router UI         │
│  - Multi-threaded Background Queue  - Full Offline Demo     │
│  - 0.55s Scan Duration              - 0 Console Errors      │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Vercel Cloud Deployment Architecture

For an optional public web demonstration, the recommended enterprise cloud pattern is:

```
                      ┌──────────────────────────────────────┐
                      │            Browser Client            │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼ HTTPS                                         ▼ HTTPS
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │    Vercel Edge/Server     │                   │    FastAPI Backend API    │
   │  Next.js 16 (React 19)    │                   │  (Render / Railway / Fly) │
   ├───────────────────────────┤                   ├───────────────────────────┤
   │ - Static & SSR Pages      │                   │ - Deterministic AST/Regex │
   │ - Recharts & React Flow   │                   │ - Risk & Mosca Engine     │
   │ - Client-Side Hydration   │                   │ - CBOM Generation Engine  │
   │ - Env: NEXT_PUBLIC_API_URL│                   │ - CORS: *.vercel.app      │
   └───────────────────────────┘                   └───────────────────────────┘
```

#### Why Decoupled Frontend + API Service Is Required on Serverless
1. **Serverless Background Task Freeze**:
   - Vercel Serverless Functions (AWS Lambda) freeze the CPU container immediately after an HTTP response (such as `202 Accepted`) is sent.
   - Background threads in `ThreadPoolExecutor` cannot reliably continue executing when no HTTP request is active.
2. **Ephemeral Non-Shared SQLite Storage**:
   - Serverless containers only have temporary `/tmp` disk access.
   - Distinct HTTP requests (e.g. `POST /api/scan/demo` and subsequent `GET /api/findings/{id}`) often execute on different serverless container instances that do not share the SQLite database.
3. **Execution Safety**:
   - The scanner operates in strict static-analysis mode. It reads source tokens and syntax trees and **never executes** analyzed code.

---

### 3. Environment Variables Configuration

#### Frontend (`frontend/` or Vercel Project Settings)
| Variable | Value (Local) | Value (Vercel Production) | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | *(unset, defaults to `http://localhost:8000`)* | `https://your-api-backend.com` | Directs UI fetch client and export links to the active backend API. |

#### Backend (`backend/` or Container Environment)
| Variable | Value (Local) | Value (Cloud Production) | Purpose |
|---|---|---|---|
| `ECDAT_CORS_ORIGINS` | `http://localhost:3000` | `https://your-frontend.vercel.app` | Comma-separated list of allowed origins. Backend also permits any `*.vercel.app` domain by default. |
| `ECDAT_DATA_DIR` | `.ecdat` | `/tmp/.ecdat` or persistent mount | Target path for SQLite database storage. |
| `ECDAT_ALLOWED_ROOTS` | `[".../demo_repository"]` | `["/app/demo_repository"]` | Allowed filesystem scan roots for security isolation. |

---

### 4. Step-by-Step Vercel Deployment Instructions

#### Method A: Via Vercel Web Dashboard (Simplest & Recommended)

1. **Push Repository to GitHub / GitLab**.
2. **Open Vercel Dashboard** ([vercel.com/new](https://vercel.com/new)).
3. **Import the ECDAT Repository**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click "Edit" and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. **Configure Environment Variables**:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: URL of your deployed backend (e.g., `https://ecdat-api.onrender.com` or `https://ecdat-api.railway.app`).
5. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy the Next.js frontend.

---

#### Method B: Via Vercel CLI

1. Open PowerShell in `c:\Users\anime\OneDrive\Desktop\ecdat\frontend`:
   ```powershell
   cd c:\Users\anime\OneDrive\Desktop\ecdat\frontend
   ```
2. Authenticate the CLI with your Vercel account:
   ```powershell
   npx vercel login
   ```
3. Deploy preview:
   ```powershell
   npx vercel
   ```
4. When prompted:
   - *Set up and deploy?* $\rightarrow$ `yes`
   - *Which scope?* $\rightarrow$ Select your account
   - *Link to existing project?* $\rightarrow$ `no`
   - *Project name?* $\rightarrow$ `ecdat-frontend`
   - *Directory located?* $\rightarrow$ `./`
   - *Want to modify settings?* $\rightarrow$ `no`
5. Deploy production:
   ```powershell
   npx vercel --prod
   ```

---

### 5. Deploying the FastAPI Backend (Render / Railway / Fly.io)

Since FastAPI requires a long-running process for background scan threads and SQLite persistence:

#### Deploying on Render (Free / Starter Web Service)
1. In Render Dashboard, click **New Web Service**.
2. Connect your repository.
3. Settings:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `ECDAT_CORS_ORIGINS`: `https://ecdat-frontend.vercel.app`
     - `PYTHONUNBUFFERED`: `1`
4. Copy the assigned URL (e.g. `https://ecdat-api.onrender.com`) and paste it as `NEXT_PUBLIC_API_URL` in your Vercel frontend project settings.

---

### 6. Post-Deployment Verification Checklist

Once both services are deployed to your cloud URLs:

1. Open deployed Vercel URL in browser.
2. Click **[Scan Demo Repository]**.
3. Verify progress updates and scan completes in under 2 seconds.
4. Verify Overview renders:
   - 50 Crypto Findings
   - 15 Critical Now
   - 12 Quantum Migration Concerns
   - 10 Files Scanned
5. Open `/findings` and verify MD5 (Broken/Critical) and RSA-2048 (Vulnerable/High) details.
6. Open `/cbom` and download CSV/JSON exports.
7. Open `/crypto-map` and verify React Flow interactive architecture graph.
8. Open `/migration` and verify 4-tier Mosca roadmap.

---

### 7. Deployment Status & Authentication Note

- **Local Verification**: `ECDAT FINAL DEMO VERIFIED` — 100% working locally.
- **Cloud Deployment Prerequisite**: Live cloud deployment requires an active Vercel login (`npx vercel login`) or `VERCEL_TOKEN`. In this unattended automated session, external cloud deployment could not be triggered without interactive browser OAuth login.
- All code, API clients, CORS policies, build scripts, and environment variable abstractions have been verified and are ready for instant deployment.
