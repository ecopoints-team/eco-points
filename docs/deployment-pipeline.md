# EcoPoints Deployment Pipeline

## Overview

EcoPoints uses a fully automated CI/CD pipeline. Every change goes through
automated testing before reaching production. Deployments are triggered
automatically on merge to `main`.

---

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────┘
                               │
                    Write code on feature branch
                               │
                         git push
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CI — GitHub Actions                              │
│                  (runs on every push/PR)                            │
│                                                                     │
│   ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│   │  Server Tests   │  │  Tools Tests     │  │  Client Tests   │  │
│   │  (pytest)       │  │  (secret hygiene)│  │  + Next.js Build│  │
│   │                 │  │                  │  │  (vitest)       │  │
│   │  221+ tests     │  │  45 tests        │  │  8 tests        │  │
│   │  Hypothesis     │  │  Scans for       │  │  + build check  │  │
│   │  property tests │  │  leaked secrets  │  │                 │  │
│   └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘  │
│            │                   │                       │           │
│            └───────────────────┴───────────────────────┘           │
│                               │                                     │
│                    All 3 must pass ✅                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    Open PR → merge to main
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CD — Auto Deploy                                 │
│                  (triggers on merge to main)                        │
│                                                                     │
│   ┌─────────────────────────┐    ┌─────────────────────────────┐   │
│   │   Render                │    │   Cloudflare Pages          │   │
│   │   Flask Backend         │    │   Next.js Frontend          │   │
│   │                         │    │                             │   │
│   │   Auto-pulls from main  │    │   Auto-builds from main     │   │
│   │   Runs gunicorn         │    │   Serves static + SSR       │   │
│   │   Port 8000             │    │                             │   │
│   └───────────┬─────────────┘    └──────────────┬──────────────┘   │
│               │                                  │                  │
│               └──────────────┬───────────────────┘                  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                                  │
│                                                                     │
│   ┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│   │   Cloudflare    │    │   Supabase   │    │   Resend         │  │
│   │   DNS + CDN     │    │   PostgreSQL │    │   Email API      │  │
│   │   TLS (Flexible)│    │   Database   │    │   Notifications  │  │
│   └─────────────────┘    └──────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Services

| Layer | Service | What it does | Deploy trigger |
| --- | --- | --- | --- |
| Frontend | Cloudflare Pages | Serves the Next.js app | Auto on push to `main` |
| Backend | Render | Runs Flask via gunicorn | Auto on push to `main` |
| Database | Supabase (PostgreSQL) | Stores all app data | Manual (`flask db upgrade`) |
| Email | Resend API | Sends notification emails | N/A (API call at runtime) |
| DNS + CDN | Cloudflare | Routes traffic, TLS | N/A (always on) |

---

## CI Jobs

| Job | Command | What it checks |
| --- | --- | --- |
| Server tests | `python -m pytest -m "not integration" -q` | All backend logic, security, RBAC, auth |
| Tools tests | `python -m pytest tools/tests -q` | No hardcoded secrets in source code |
| Client tests + build | `npm test` + `npm run build` | Frontend logic + Next.js compiles clean |

Defined in: `.github/workflows/ci.yml`
Dependencies: `server/requirements-dev.txt` (pytest, hypothesis)

---

## Branch Strategy

```
main        ← production (auto-deploys to Render + Cloudflare)
  ↑
dev         ← integration branch (all features merge here first)
  ↑
feature/*   ← individual feature branches
ci/*        ← CI/infrastructure branches
fix/*       ← bug fix branches
```

---

## Status

| Component | Status |
| --- | --- |
| CI — Server tests | ✅ Active |
| CI — Tools tests | ✅ Active |
| CI — Client tests + build | ✅ Active |
| CD — Render auto-deploy | ⚙️ Enable in Render dashboard |
| CD — Cloudflare Pages auto-deploy | ⚙️ Verify in Cloudflare dashboard |
| Branch protection on `main` | ⚙️ Requires GitHub Team plan |

---

## Enabling CD (one-time setup)

### Render (Flask backend)
1. Render dashboard → your backend service → **Settings**
2. **Auto-Deploy** → set to **Yes**
3. **Branch** → set to `main`

### Cloudflare Pages (Next.js frontend)
1. Cloudflare dashboard → **Pages** → your project
2. **Settings** → **Builds & deployments**
3. Confirm **Production branch** is `main` (auto-deploy is on by default)

### Database migrations
Supabase does not auto-migrate. When you have schema changes, run manually:
```bash
cd server
flask db upgrade
```

---

## Local Development

```bash
# Backend
cd server
python run.py          # starts Flask at http://localhost:5000

# Frontend
cd client
npm run dev            # starts Next.js at http://localhost:3000

# Run tests locally
cd server
python -m pytest -m "not integration" -q   # server tests
cd ..
python -m pytest tools/tests -q            # tools tests
cd client
npm test                                   # client tests
```
