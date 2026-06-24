# EcoPoints — System Architecture Report

> **Generated:** 2026-06-24  
> **Status:** All hardening phases 0–5 + 4A closed (`docs/phase-status.md`)  
> **Repo:** monorepo — `client/`, `server/`, `eco-points-rpi/`, `nginx/`, `tools/`

---

## 1. System Context & Data Flow

EcoPoints is a three-plane system: a **browser/PWA client**, a **Flask REST API**, and a **Raspberry Pi 5 edge node**. All three converge on a single Supabase PostgreSQL database, with an optional Redis cache layer sitting in front of expensive reads.

### Planes and Protocols

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 1 — EDGE (Raspberry Pi 5)                                                │
│                                                                                 │
│  User taps Kiosk touchscreen (React Native / Expo Web — http://localhost:8081)  │
│       ↓ WebSocket ws://localhost:8765                                           │
│  Firmware daemon (main.py) receives QR_SCANNED action                           │
│       ↓ REST/HTTPS  X-API-Key header (BCrypt-hashed server-side)               │
│  POST /api/rpi/authenticate  →  POST /api/rpi/session/start                    │
│       ↓ (user deposits bottle)                                                  │
│  HardwareInterface.verify_bottle() — picamera2/USB → YOLOv11 best.pt           │
│  10-frame majority vote, conf ≥ 0.55 → (is_valid, brand, size, confidence)     │
│       ↓                                                                         │
│  stepper motor spins (GPIO 12/16/17) · homing sensor (GPIO 6)                  │
│       ↓ REST/HTTPS                                                              │
│  POST /api/rpi/session/{id}/deposit  →  POST /api/rpi/session/{id}/end         │
│  Heartbeat thread: POST /api/rpi/machine/heartbeat every 30 s                  │
│  Bin-full monitor: curtain sensor (GPIO 5) → POST /api/rpi/machine/status      │
└─────────────────────────────────────────────────────────────────────────────────┘
                               │ REST/HTTPS  (all via api.ecopoints.org)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GATEWAY                                                                        │
│                                                                                 │
│  Cloudflare DNS (ecopoints.org → Vercel, api.ecopoints.org → Render)           │
│  Nginx reverse proxy (nginx/default.conf):                                      │
│    api.ecopoints.org  → Flask Gunicorn :8000                                   │
│    ecopoints.org      → Next.js :3000                                          │
│  Security headers applied at Nginx: HSTS, X-Frame-Options: DENY,               │
│  CSP-Report-Only, Referrer-Policy, X-Content-Type-Options                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌──────────────────────────┐   ┌───────────────────────────────────────────────┐
│  PLANE 2 — CLIENT        │   │  PLANE 3 — API (Flask 3.1 / Gunicorn)         │
│  Next.js 16 App Router   │   │                                               │
│  (Vercel — auto-deploy)  │   │  Blueprints:                                  │
│                          │   │    auth_bp  /api/auth/*                       │
│  REST/HTTPS ←→ /api/*    │   │    web_bp   /api/web/*  (11 domain ctrlrs)    │
│  HttpOnly JWT cookies    │   │    rpi_bp   /api/rpi/*                        │
│  CSRF double-submit      │   │                                               │
│  reCAPTCHA v2 on login   │   │  Middleware stack per request:                │
│                          │   │    @token_required                            │
│  14 per-domain API svc   │   │    → @permission_required(category)           │
│  modules, single         │   │    → controller fn                            │
│  request() layer         │   │  RPI routes: @rpi_auth_required → ctrl fn     │
│  (src/services/api/)     │   │                                               │
│                          │   │  Services: captcha · notification (Resend)    │
│  RequirePermission.jsx   │   │             otp · password_policy             │
│  mirrors server RBAC     │   │                                               │
└──────────────────────────┘   └──────────────────┬────────────────────────────┘
                                                  │ psycopg3 / TLS
                               ┌──────────────────┴──────────────────┐
                               │                                      │
                               ▼                                      ▼
               ┌───────────────────────────┐         ┌───────────────────────┐
               │  Supabase PostgreSQL      │         │  Redis (optional)     │
               │  aws-1-ap-northeast-1     │         │  server/app/cache.py  │
               │  Session pooler :6543     │         │                       │
               │  Direct :5432 (migrations)│         │  Leaderboard sorted   │
               │  14-table schema          │         │  set · dashboard stats │
               │  Fernet-encrypted         │         │  · analytics TTL      │
               │  qr_hmac_secret_enc       │         │  cache_invalidate() on│
               └───────────────────────────┘         │  every write          │
                                                      │  Fallback: direct DB  │
                                                      │  on ConnectionError   │
                                                      └───────────────────────┘
```

### Protocol Summary

| Connection | Protocol | Auth mechanism |
|---|---|---|
| Browser ↔ Nginx | HTTPS (Cloudflare TLS) | HttpOnly JWT cookie + CSRF token |
| RVM ↔ Nginx | HTTPS | `X-API-Key` header (BCrypt-verified) |
| Kiosk UI ↔ Firmware | WebSocket `ws://localhost:8765` | Local loopback (no auth needed) |
| Flask ↔ Supabase | psycopg3 / TLS | `DATABASE_URL` in env |
| Flask ↔ Redis | TCP (redis-py) | `REDIS_URL` in env |
| Flask ↔ Resend | HTTPS REST | `RESEND_API_KEY` in env |
| Browser ↔ Google reCAPTCHA | HTTPS | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` |

---

## 2. Actual Directory Structure

The repository is a **monorepo** with four primary workloads: frontend (`client/`), backend (`server/`), edge hardware (`eco-points-rpi/`), and shared infrastructure (`nginx/`, `tools/`, `docs/`).

```
Github/                                  ← repo root
│
├── .github/
│   └── workflows/
│       └── ci.yml                       ← 3-job CI (pytest + tools + vitest+build)
│
├── nginx/
│   └── default.conf                     ← Nginx reverse proxy config (Phase 4D security headers)
│
├── docker-compose.yml                   ← Local stack: backend + frontend + nginx (no Redis service yet)
│
├── supabase/
│   └── config.toml                      ← Supabase local config
│
├── tools/
│   ├── tests/
│   │   └── test_secret_hygiene.py       ← 45 tests — scans for hardcoded secrets in CI
│   └── smoke/
│       └── whole_system_smoke.py
│
├── docs/
│   ├── deployment-pipeline.md           ← CI/CD pipeline documentation
│   ├── rpi-api-contract.md              ← RVM API spec (Phase 4A)
│   ├── phase-status.md                  ← Phase closure ledger (all phases closed)
│   ├── system-architecture.html         ← Visual architecture diagram
│   ├── system-architecture-report.md    ← This file
│   └── runbooks/
│       ├── secret-rotation.md
│       ├── db-backup-restore.md
│       └── origin-tls.md
│
├── client/                              ← Next.js 16 App Router (deployed: Vercel)
│   ├── app/
│   │   ├── admin/                       ← Org-staff dashboard (analytics, users, machines, logs…)
│   │   │   ├── analytics/page.js
│   │   │   ├── bulk-sessions/page.js
│   │   │   ├── leaderboards/page.js
│   │   │   ├── locations/page.js
│   │   │   ├── logs/                    ← access / bottles / machines / rewards / transactions
│   │   │   ├── machines/page.js
│   │   │   ├── rewards/page.js
│   │   │   ├── settings/page.js
│   │   │   ├── users/page.js + permissions/page.js
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   ├── leaderboard/page.js
│   │   ├── login/page.js
│   │   ├── profile/page.js
│   │   ├── qr/page.js
│   │   ├── redeem-history/page.js
│   │   ├── rewards/page.js
│   │   ├── layout.js
│   │   └── providers.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                   ← AdminLayout, Sidebar, RequirePermission, modals
│   │   │   ├── pages/                   ← Leaderboard, LogIn, Rewards, Profile, RecentActivity
│   │   │   ├── shared/                  ← skeletons, SlotCounter
│   │   │   └── website/                 ← Landing page: NavBar, Hero, Features, HowItWorks
│   │   ├── context/
│   │   │   ├── AuthContext.js           ← JWT/cookie session + permission_categories
│   │   │   └── ThemeContext.js
│   │   ├── data/
│   │   │   ├── mockData.js
│   │   │   └── roleConfig.js
│   │   ├── services/
│   │   │   └── api/                     ← 14 per-domain modules + client.js + index.js
│   │   │       ├── client.js            ← single request() layer
│   │   │       ├── index.js             ← barrel re-export
│   │   │       ├── auth.js  dashboard.js  users.js  locations.js
│   │   │       ├── machines.js  rewards.js  logs.js  leaderboard.js
│   │   │       ├── groups.js  analytics.js  settings.js  sessions.js
│   │   ├── lib/
│   │   └── utils/
│   │       ├── formatDate.js
│   │       └── useDebounce.js
│   ├── tests/
│   │   ├── property/                    ← page-guards · login-redirect · page-field-coverage
│   │   ├── static/                      ← api-hygiene · no-jwt-in-localstorage
│   │   └── unit/
│   ├── public/                          ← manifest.json, sw.js (PWA), brand assets
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                              ← Flask 3.1 API (deployed: Render, Gunicorn)
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── _shared.py               ← log_action(), level(), serialize helpers
│   │   │   ├── auth_controller.py       ← /api/auth/* (login, OTP, /me, reCAPTCHA)
│   │   │   ├── web_controller.py        ← web_bp parent + /health (25 lines)
│   │   │   ├── rpi_controller.py        ← /api/rpi/* (@rpi_auth_required)
│   │   │   ├── dashboard_controller.py
│   │   │   ├── users_controller.py
│   │   │   ├── locations_controller.py
│   │   │   ├── machines_controller.py
│   │   │   ├── rewards_controller.py
│   │   │   ├── reward_categories_controller.py
│   │   │   ├── logs_controller.py
│   │   │   ├── leaderboard_controller.py
│   │   │   ├── groups_controller.py
│   │   │   ├── analytics_controller.py
│   │   │   ├── settings_controller.py
│   │   │   └── sessions_controller.py
│   │   ├── services/
│   │   │   ├── captcha_service.py       ← reCAPTCHA v2 server-side verify
│   │   │   ├── notification_service.py  ← Resend email (OTP, alerts)
│   │   │   ├── otp_service.py
│   │   │   └── password_policy.py
│   │   ├── seeder/
│   │   │   ├── seed.py                  ← deterministic dev seed (Phase 5)
│   │   │   └── cleanup.py
│   │   ├── schemas/                     ← Pydantic validation schemas
│   │   ├── __init__.py                  ← Flask app factory, blueprint registration
│   │   ├── cache.py                     ← Redis client, @cached_endpoint decorator, sorted-set leaderboard
│   │   ├── constants.py
│   │   ├── middleware.py                ← @token_required, @rpi_auth_required,
│   │   │                                   @permission_required, ROLE_PERMISSIONS,
│   │   │                                   _require_admin_or_403, CSRF, rate-limit
│   │   ├── models.py                    ← SQLAlchemy 2.0 models (14-table schema)
│   │   ├── permissions.py               ← ROLE_PERMISSIONS map
│   │   └── routes.py                    ← blueprint registration shim
│   ├── migrations/                      ← Alembic / Flask-Migrate
│   │   └── versions/
│   ├── tests/
│   │   ├── property/                    ← Hypothesis PBT (221+ tests across all phases)
│   │   ├── static/                      ← AST decorator-stacking checks
│   │   ├── unit/                        ← focused unit tests
│   │   ├── integration/                 ← migration reversibility, DB round-trips
│   │   ├── smoke/
│   │   ├── fixtures/
│   │   └── conftest.py
│   ├── scripts/
│   │   ├── check_prod_users.py
│   │   └── diagnose_prod_login.py
│   ├── Dockerfile
│   ├── gunicorn.conf.py                 ← workers = cpu_count * 2 + 1, sync, timeout 30s
│   ├── requirements.txt                 ← pinned exact versions
│   ├── requirements-dev.txt
│   └── run.py
│
└── eco-points-rpi/                      ← Raspberry Pi 5 edge client
    ├── rvm_edge_client/
    │   ├── main.py                      ← Firmware daemon: state machine, UIBridge, HardwareInterface
    │   ├── models/
    │   │   └── best.pt                  ← YOLOv11 trained weights (on-device inference)
    │   ├── ui/                          ← Kiosk UI: React Native / Expo Web
    │   │   ├── App.tsx
    │   │   ├── src/                     ← screens, components, WebSocket client
    │   │   └── package.json
    │   ├── tests/
    │   │   ├── test_prop_bin_status.py
    │   │   ├── test_prop_confidence.py
    │   │   ├── test_prop_heartbeat.py
    │   │   ├── test_prop_points_fallback.py
    │   │   ├── test_prop_timeout.py
    │   │   └── integration/
    │   │       ├── test_integration_heartbeat.py
    │   │       ├── test_integration_session.py
    │   │       └── test_integration_session_timeout.py
    │   ├── deploy/
    │   │   ├── install.sh               ← systemd installer (run as root on Pi)
    │   │   ├── ecopoints-backend.service
    │   │   ├── ecopoints-frontend.service
    │   │   └── ecopoints-kiosk.service  ← Chromium --kiosk http://localhost:8081
    │   ├── .env.example
    │   └── requirements.txt             ← requests, python-dotenv, Flask, websockets,
    │                                       ultralytics, opencv-python, RPi.GPIO
    ├── Informations/                    ← Reference copies of server controllers for Pi dev
    │   ├── models.py
    │   ├── rpi_controller.py
    │   ├── sessions_controller.py
    │   └── logs_controller.py
    ├── integration_guide.md
    └── README.md
```

---

## 3. Resiliency & Failure Modes

### Failure 1: RVM loses network mid-session — ⚠️ Open Gap

**What breaks:** The firmware daemon calls the backend directly for every event — `session/start`, each `deposit`, `session/end`. A network drop mid-session causes HTTP exceptions and the deposit loop breaks. Points are lost.

**Current state:** No SQLite offline buffer or replay queue exists in `main.py`. The `fetch_points_config` function and heartbeat both have `try/except` with fallback values, but the session flow itself has no retry or queue mechanism.

**Required mitigation (not yet implemented):**
1. Add a local SQLite write before every API call (session row + deposit rows)
2. On `requests.exceptions.ConnectionError`, buffer to SQLite and set a `pending_sync` flag
3. Background thread monitors connectivity (ping `/api/rpi/machine/heartbeat`)
4. On reconnect, replay buffered rows in chronological order with HMAC-signed batch endpoint
5. Server-side: add idempotency key on `session/start` — dedup on `(machine_uuid, session_started_at)` to prevent double wallet credits on replay

---

### Failure 2: Redis unavailable — handled, no action needed

**What breaks:** Leaderboard, dashboard stats, analytics reads fail to hit cache.

**Current mitigation (`server/app/cache.py`):**
- `init_redis()` pings on startup; sets `_redis_available = False` on any error
- `cache_get()`, `cache_set()`, `cache_delete()`, `cache_invalidate()` all check `get_redis()` first and silently no-op when Redis is down
- `@cached_endpoint` decorator falls through to the controller function on cache miss
- `leaderboard_top()` returns `None` on Redis failure — callers fall back to direct Postgres query
- Result: ~200–500ms latency increase on cache miss, zero errors, zero data loss
- `REDIS_URL` is intentionally unset in `server/.env` by default — app runs in pure-DB mode until Redis is provisioned on Render

---

### Failure 3: Supabase connection pool exhaustion — partially mitigated

**What breaks:** All writes fail — session commits, wallet credits, reward redemptions.

**Current mitigations:**
- `DATABASE_URL` uses the **session pooler** (port `6543`) which multiplexes connections server-side — prevents the Pi farm + Gunicorn workers from exhausting Postgres `max_connections`
- `gunicorn.conf.py`: `workers = cpu_count * 2 + 1`, `worker_class = "sync"` — each worker holds one connection; no unbounded connection growth
- Supabase pooler handles connection reuse transparently
- `GET /api/web/health` exists for readiness probing

**Open gap:** No circuit breaker pattern. If Supabase returns `5xx` or times out, Gunicorn workers will queue and eventually return `503` to clients after `timeout = 30s`. A future improvement is a health-check endpoint that Render can use to pull a dyno before the queue backs up.

**For migrations:** Switch `DATABASE_URL` port from `6543` to `5432` (direct connection) before running `flask db upgrade`. The transaction pooler breaks DDL statements.

---

### Failure 4: RVM bin sensor false positive — handled by firmware

**What breaks:** Curtain sensor reads a transient block and incorrectly marks the machine full, locking out users.

**Current mitigation (`HardwareInterface._monitor_bin_full`):**
- Requires **5.0 seconds of continuous HIGH** signal (50 × 100ms polls) before declaring the bin full
- Requires **0.5 seconds of continuous LOW** signal (5 × 100ms polls) before clearing the full state
- Both transitions fire `POST /api/rpi/machine/status` and broadcast `SET_BIN_FULL` / `CLEAR_BIN_FULL` over WebSocket to the Kiosk UI

---

## 4. Next Steps — Terminal Commands

### 4.1 Backend (server/)

```cmd
rem Install Python deps
cd server
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\pip install -r requirements-dev.txt

rem Copy and configure environment
copy .env.example .env
rem Edit server/.env — set DATABASE_URL, SECRET_KEY, RESEND_API_KEY

rem Run database migrations (use direct port 5432 for DDL)
rem Update DATABASE_URL to port 5432 first, then:
.venv\Scripts\flask db upgrade

rem Seed development data
.venv\Scripts\python seed.py

rem Start Flask dev server
.venv\Scripts\python run.py
```

### 4.2 Frontend (client/)

```cmd
cd client
npm ci

rem Copy and configure environment
copy .env.example .env.local
rem Edit client/.env.local — set NEXT_PUBLIC_API_URL, NEXT_PUBLIC_RECAPTCHA_SITE_KEY

rem Start Next.js dev server
rem (run manually — do not use Kiro terminal for long-running processes)
npm run dev
```

### 4.3 Edge Hardware (eco-points-rpi/) — Development simulation on Windows

```cmd
cd eco-points-rpi\rvm_edge_client
python -m venv venv
call venv\Scripts\activate
pip install requests python-dotenv websockets ultralytics opencv-python Flask

rem Configure environment
copy .env.example .env
rem Edit .env — set BACKEND_URL, MACHINE_ID, API_KEY, DISABLE_GPIO=true, CLI_MODE=false

rem Start firmware daemon (Terminal A)
python main.py

rem Start Kiosk UI (Terminal B)
cd ui
npm install
npm run web
rem Open browser at http://localhost:8081
```

### 4.4 Edge Hardware — Raspberry Pi 5 production deployment

```bash
# On the Pi (via SSH or terminal)
cd ~/eco-points-rpi/rvm_edge_client

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
cp .env.example .env
nano .env
# Set BACKEND_URL=https://api.ecopoints.org
# Set MACHINE_ID=RVM-<SITE>-<UNIT>
# Set API_KEY=<key from POST /api/web/machines/<id>/rotate-api-key>
# Set DISABLE_GPIO=false
# Set UHUBCTL_LOCATIONS=1,2 (adjust for your Pi 5 hub topology)

# Install Node for Kiosk UI
cd ui
npm install

# Install systemd services (auto-start on boot)
cd ../deploy
sudo bash install.sh

# Verify services
systemctl status ecopoints-backend.service
systemctl status ecopoints-frontend.service
systemctl status ecopoints-kiosk.service

# View firmware logs live
journalctl -u ecopoints-backend.service -f
```

### 4.5 Verify full CI suite locally before pushing

```cmd
rem Server tests
cd server
.venv\Scripts\python -m pytest -m "not integration" -q

rem Tools / secret hygiene
cd ..
python -m pytest tools\tests -q

rem Client tests + build
cd client
npm test
npm run build
```

### 4.6 Add Redis to docker-compose (currently missing)

Add to `docker-compose.yml` under `services:`:

```yaml
  redis:
    image: redis:7-alpine
    restart: always
    expose:
      - "6379"
```

Add to `backend` service `environment:`:

```yaml
      - REDIS_URL=redis://redis:6379/0
```

---

## Open Gaps Summary

| Gap | Severity | Owner | Notes |
|---|---|---|---|
| No SQLite offline buffer in RVM firmware | High | Hardware team | Network drop mid-session = lost deposit |
| No server-side idempotency on `/api/rpi/session/start` | High | Backend team | Required before offline replay is added |
| Redis not in `docker-compose.yml` | Medium | Backend team | Dev stack silently runs DB-only |
| No circuit breaker for Supabase timeouts | Low | Backend team | Gunicorn `timeout=30s` is current backstop |
| `best.pt` model not in CI | Low | Hardware team | No regression test for YOLOv11 accuracy |
| `eco-points-rpi` has separate `.git` | Low | Lead Dev | Consider flattening into monorepo subdir |
