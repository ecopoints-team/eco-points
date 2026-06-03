# EcoPoints — Manual Test Plan (Per-Role Smoke Walkthrough)

> **Purpose**: Walk a human operator through the post-hardened EcoPoints platform once per role, exercising every Admin_UI page, every redirect path, and every per-role authorization boundary documented in `docs/phase-status.md` and `api_routes_documentation.md`.
>
> **Scope**: Web + Admin Dashboard. RPI / RVM hardware flows are intentionally **out of scope** under the rpi-carveout (Phase 4A is `deferred`).
>
> **Estimated duration**: ~25 minutes per admin role, ~10 minutes per non-admin role. Total: **≈2 hours** for a full pass.

---

## 0. Prerequisites

### 0.1 Environment

| Item | Value |
| --- | --- |
| Server URL | `http://localhost:5000` (default Flask dev server) |
| Client URL | `http://localhost:3000` (default Next.js dev server) |
| Server start | `cd server && .venv\Scripts\python.exe run.py` |
| Client start | `cd client && npm run dev` |
| Seed command | `cd server && .venv\Scripts\python.exe -c "from app import create_app; from app.seeder.seed import run_seed; app = create_app(); ctx = app.app_context(); ctx.push(); run_seed()"` |

> **Tip**: keep one terminal per service open. The client must point at the server via `NEXT_PUBLIC_API_BASE=http://localhost:5000/api/web` (set in `client/.env.local`).

### 0.2 Seeded credentials

After running the seeder, every role has a deterministic login:

| Role | Email | Password | Expected post-login redirect |
| --- | --- | --- | --- |
| superadmin | `superadmin@ecopoints.local` | `SeedPass!23` | `/admin` |
| head_admin | `head_admin@ecopoints.local` | `SeedPass!23` | `/admin` |
| auditor | `auditor@ecopoints.local` | `SeedPass!23` | `/admin` |
| technician | `technician@ecopoints.local` | `SeedPass!23` | `/admin` |
| inventory_officer | `inventory_officer@ecopoints.local` | `SeedPass!23` | `/admin` |
| user | `user@ecopoints.local` | `SeedPass!23` | `/rewards` |
| dependent | `dependent@ecopoints.local` | `SeedPass!23` | `/rewards` |

> The password defaults to `SeedPass!23`. Override with `SEED_PASSWORD=...` in the environment before running the seed command if you need a different value (it must satisfy the policy: ≥8 chars, ≥1 upper, ≥1 lower, ≥1 digit).

### 0.3 Cookie / DevTools setup

1. Open the browser **DevTools → Application → Cookies → `http://localhost:3000`** before logging in.
2. After every login, you should see two cookies:
   - `token` — `HttpOnly: ✓`, `Secure: ✓` (or `✗` on localhost), `SameSite: Strict`
   - `csrf_token` — `HttpOnly: ✗`, `SameSite: Strict`
3. Confirm via DevTools → Application → Local Storage that **no `ecopoints_token` key exists**. (Property Q invariant.)

---

## 1. Cross-role pre-flight (do this once)

| # | Action | Expected | Phase |
| --- | --- | --- | --- |
| 1.1 | `curl http://localhost:5000/api/web/health` | `{ "status": "healthy" }` | 1 |
| 1.2 | `curl http://localhost:5000/health` | `{ "status": "healthy" }` | 1 |
| 1.3 | Open `http://localhost:3000`. Landing page renders without console errors. | Landing page visible. | 5 |
| 1.4 | Click **Login**. Login modal opens. | Modal renders email + password fields. | 4B |
| 1.5 | Submit empty credentials. | Modal shows a validation error inline; no network 500. | 4E |
| 1.6 | Submit a non-existent email. | "Invalid credentials" error; HTTP 401 in DevTools network tab. | 4B |

If any of 1.1–1.6 fails, stop and report before proceeding.

---

## 2. Per-role walkthrough

For each role, perform Sections **A** (login), **B** (access matrix), **C** (mutation tests), and **D** (logout). Use the role-specific tables in Section 3 to know which pages should render and which should redirect.

### A. Login

| # | Action | Expected |
| --- | --- | --- |
| A.1 | Open the login modal at `http://localhost:3000`. | Modal renders. |
| A.2 | Enter the role's email + `SeedPass!23`. Submit. | HTTP 200; `Set-Cookie: token=…; HttpOnly` and `Set-Cookie: csrf_token=…` in response. |
| A.3 | Browser navigates to the role's expected redirect target (see table in Section 0.2). | URL matches; no `/profile` redirect. |
| A.4 | DevTools → Application → Local Storage. | No `ecopoints_token` key. |
| A.5 | DevTools → Network → first authenticated request. | `Cookie: token=…` is sent automatically. No `Authorization: Bearer …` header. |

### B. Access matrix (visit each Admin_UI page)

For each row in the role-specific table in **Section 3**:

1. Type the URL into the address bar (don't use sidebar navigation yet).
2. Verify the **Expected behavior** matches.

Then:

3. Open the admin sidebar. The **only** links visible should be those for which the role has the matching category. Categories the role lacks must be hidden.
4. Confirm: the count of visible sidebar entries equals the count of "RENDER" rows in the role's access matrix (excluding `/admin` overview, `/profile`, and Sign Out which are always visible).

### C. Mutation tests (admin roles only; skip for `user` / `dependent`)

For each mutation listed in the role-specific table:

1. Perform the action via the Admin_UI form.
2. Verify HTTP 200 and a UI confirmation.
3. Open `Admin → Logs → Access Logs`. Confirm exactly **one new row** for your action with `actor` matching the logged-in user, the correct `action` string, and ISO-8601 `timestamp`.
4. Try one **forbidden** mutation per role (per the table). Verify HTTP 403 with `error.code` matching the expected value.

### D. Logout

| # | Action | Expected |
| --- | --- | --- |
| D.1 | Click **Sign Out** in the sidebar (admin) or profile menu (non-admin). | Redirects to `/`. |
| D.2 | DevTools → Cookies. | `token` and `csrf_token` cookies cleared (or `Max-Age=0`). |
| D.3 | Try to navigate to `/admin` directly. | Redirects to landing page; no protected content rendered. |
| D.4 | Open Admin → Logs → Access Logs as superadmin afterward. | A `logout` audit row exists for the user. |

---

## 3. Per-role access matrix

Use the legend below. Categories are drawn from `ROLE_PERMISSIONS` in `server/app/middleware.py`.

| Symbol | Meaning |
| --- | --- |
| ✅ RENDER | Page renders fully; sidebar link visible. |
| ❌ FORBIDDEN | Page redirects to `/admin` (admin role missing category). Sidebar link hidden. |
| 🚫 NON-ADMIN | Page redirects to `/rewards` (non-admin role). Sidebar not shown. |

**Categories per role** (from `middleware.py` `ROLE_PERMISSIONS`):

| Role | Categories |
| --- | --- |
| superadmin | users, machines, rewards, locations, logs, analytics, settings, groups, sessions, leaderboard, dashboard |
| head_admin | users, machines, rewards, locations, logs, analytics, settings, groups, sessions, leaderboard, dashboard |
| auditor | logs, analytics, sessions, settings, leaderboard, dashboard |
| technician | machines, logs, settings, dashboard |
| inventory_officer | rewards, logs, settings, dashboard |
| user | (none) — non-admin |
| dependent | (none) — non-admin |

### 3.1 superadmin

All pages should render. This role is the "happy-path baseline" — anything that fails for superadmin will fail for everyone.

| URL | Required category | Expected |
| --- | --- | --- |
| `/admin` | dashboard | ✅ RENDER (overview) |
| `/admin/analytics` | analytics | ✅ RENDER |
| `/admin/bulk-sessions` | sessions | ✅ RENDER |
| `/admin/leaderboards` | leaderboard | ✅ RENDER |
| `/admin/locations` | locations | ✅ RENDER |
| `/admin/logs/access` | logs | ✅ RENDER |
| `/admin/logs/bottles` | logs | ✅ RENDER |
| `/admin/logs/machines` | logs | ✅ RENDER |
| `/admin/logs/rewards` | logs | ✅ RENDER |
| `/admin/logs/transactions` | logs | ✅ RENDER |
| `/admin/machines` | machines | ✅ RENDER |
| `/admin/rewards` | rewards | ✅ RENDER |
| `/admin/settings` | settings | ✅ RENDER |
| `/admin/users` | users | ✅ RENDER |
| `/admin/users/permissions` | users | ✅ RENDER |
| `/admin/profile` | (open) | ✅ RENDER |

**Mutations to perform**:

| # | Action | Endpoint | Expected |
| --- | --- | --- | --- |
| 3.1.M1 | Create a new user with role `head_admin` | `POST /api/web/users` | HTTP 200; audit row written. |
| 3.1.M2 | Update that user's last name | `PUT /api/web/users/<id>` | HTTP 200; `before` / `after` JSON in audit row. |
| 3.1.M3 | Try to update that user's role to `superadmin` | `PUT /api/web/users/<id>` with `role: "superadmin"` | **HTTP 403** `ROLE_HIERARCHY_VIOLATION` (you cannot promote at-or-above your own level). |
| 3.1.M4 | Create a location | `POST /api/web/locations` | HTTP 200. |
| 3.1.M5 | Create a reward | `POST /api/web/rewards` | HTTP 200. |
| 3.1.M6 | Force-logout all users in your org (Settings → Security) | `POST /api/web/settings/security/force-logout` | HTTP 200; `organizations.force_logout_at` updated; audit row `settings.force_logout` written. After this, log in again to continue. |
| 3.1.M7 | Submit a malformed POST body (e.g., add `extraField: "x"` via DevTools console) to any mutation endpoint | any | **HTTP 400** with `error.code: "UNKNOWN_FIELD"` and `field: "extraField"`. |

### 3.2 head_admin

Same access as superadmin, but role-hierarchy applies:

- Same access matrix as 3.1.
- **Cannot** create or update users with role `head_admin` or `superadmin`. Try it: HTTP 403 `ROLE_HIERARCHY_VIOLATION`.
- Can create users at level `auditor` and below.
- Force-logout (3.1.M6) is allowed.

### 3.3 auditor

| URL | Required category | Expected |
| --- | --- | --- |
| `/admin` | dashboard | ✅ RENDER |
| `/admin/analytics` | analytics | ✅ RENDER |
| `/admin/bulk-sessions` | sessions | ✅ RENDER |
| `/admin/leaderboards` | leaderboard | ✅ RENDER |
| `/admin/locations` | locations | ❌ FORBIDDEN |
| `/admin/logs/access` | logs | ✅ RENDER |
| `/admin/logs/bottles` | logs | ✅ RENDER |
| `/admin/logs/machines` | logs | ✅ RENDER |
| `/admin/logs/rewards` | logs | ✅ RENDER |
| `/admin/logs/transactions` | logs | ✅ RENDER |
| `/admin/machines` | machines | ❌ FORBIDDEN |
| `/admin/rewards` | rewards | ❌ FORBIDDEN |
| `/admin/settings` | settings | ✅ RENDER |
| `/admin/users` | users | ❌ FORBIDDEN |
| `/admin/users/permissions` | users | ❌ FORBIDDEN |
| `/admin/profile` | (open) | ✅ RENDER |

**Mutations to attempt** (all should fail per RBAC):

| # | Action | Expected |
| --- | --- | --- |
| 3.3.M1 | `POST /api/web/users` (via Postman or curl with auditor token) | HTTP 403 `FORBIDDEN`, `missing: "users"`. |
| 3.3.M2 | `PUT /api/web/machines/<id>` | HTTP 403 `FORBIDDEN`, `missing: "machines"`. |
| 3.3.M3 | `POST /api/web/rewards` | HTTP 403 `FORBIDDEN`, `missing: "rewards"`. |
| 3.3.M4 | View `/admin/logs/access` and confirm the three 403s above appear as audit rows. | Three rows visible. |

### 3.4 technician

| URL | Required category | Expected |
| --- | --- | --- |
| `/admin` | dashboard | ✅ RENDER |
| `/admin/analytics` | analytics | ❌ FORBIDDEN |
| `/admin/bulk-sessions` | sessions | ❌ FORBIDDEN |
| `/admin/leaderboards` | leaderboard | ❌ FORBIDDEN |
| `/admin/locations` | locations | ❌ FORBIDDEN |
| `/admin/logs/access` | logs | ✅ RENDER |
| `/admin/logs/bottles` | logs | ✅ RENDER |
| `/admin/logs/machines` | logs | ✅ RENDER |
| `/admin/logs/rewards` | logs | ✅ RENDER |
| `/admin/logs/transactions` | logs | ✅ RENDER |
| `/admin/machines` | machines | ✅ RENDER |
| `/admin/rewards` | rewards | ❌ FORBIDDEN |
| `/admin/settings` | settings | ✅ RENDER |
| `/admin/users` | users | ❌ FORBIDDEN |
| `/admin/users/permissions` | users | ❌ FORBIDDEN |
| `/admin/profile` | (open) | ✅ RENDER |

**Mutations to perform** (allowed):

| # | Action | Expected |
| --- | --- | --- |
| 3.4.M1 | `PUT /api/web/machines/<id>` — update a machine's `name` | HTTP 200; audit row. |
| 3.4.M2 | `POST /api/web/logs/machines` — log a maintenance event | HTTP 200. |

**Mutations that should fail** (forbidden):

| # | Action | Expected |
| --- | --- | --- |
| 3.4.M3 | `POST /api/web/users` | HTTP 403 `FORBIDDEN`, `missing: "users"`. |
| 3.4.M4 | `POST /api/web/rewards` | HTTP 403 `FORBIDDEN`, `missing: "rewards"`. |

### 3.5 inventory_officer

| URL | Required category | Expected |
| --- | --- | --- |
| `/admin` | dashboard | ✅ RENDER |
| `/admin/analytics` | analytics | ❌ FORBIDDEN |
| `/admin/bulk-sessions` | sessions | ❌ FORBIDDEN |
| `/admin/leaderboards` | leaderboard | ❌ FORBIDDEN |
| `/admin/locations` | locations | ❌ FORBIDDEN |
| `/admin/logs/access` | logs | ✅ RENDER |
| `/admin/logs/bottles` | logs | ✅ RENDER |
| `/admin/logs/machines` | logs | ✅ RENDER |
| `/admin/logs/rewards` | logs | ✅ RENDER |
| `/admin/logs/transactions` | logs | ✅ RENDER |
| `/admin/machines` | machines | ❌ FORBIDDEN |
| `/admin/rewards` | rewards | ✅ RENDER |
| `/admin/settings` | settings | ✅ RENDER |
| `/admin/users` | users | ❌ FORBIDDEN |
| `/admin/users/permissions` | users | ❌ FORBIDDEN |
| `/admin/profile` | (open) | ✅ RENDER |

**Mutations to perform** (allowed):

| # | Action | Expected |
| --- | --- | --- |
| 3.5.M1 | `POST /api/web/rewards` — create a reward | HTTP 200; audit row. |
| 3.5.M2 | `PUT /api/web/rewards/<id>` — update reward stock | HTTP 200. |

**Mutations that should fail** (forbidden):

| # | Action | Expected |
| --- | --- | --- |
| 3.5.M3 | `PUT /api/web/machines/<id>` | HTTP 403 `FORBIDDEN`, `missing: "machines"`. |
| 3.5.M4 | `POST /api/web/users` | HTTP 403 `FORBIDDEN`, `missing: "users"`. |

### 3.6 user (non-admin)

| URL | Expected |
| --- | --- |
| `/` | ✅ RENDER (landing) |
| `/rewards` | ✅ RENDER |
| `/my-rewards` | ✅ RENDER |
| `/leaderboard` | ✅ RENDER |
| `/profile` | ✅ RENDER |
| `/qr` | ✅ RENDER (QR display only — no signed payload until Phase 4A) |
| `/admin` | 🚫 redirects to `/rewards` |
| `/admin/users` | 🚫 redirects to `/rewards` |
| any `/admin/*` | 🚫 redirects to `/rewards` |

**API attempts** (all should fail):

| # | Action | Expected |
| --- | --- | --- |
| 3.6.A1 | `GET /api/web/users` (with user's token) | HTTP 403 `ADMIN_REQUIRED`. |
| 3.6.A2 | `POST /api/web/rewards/<id>/redeem` for a reward you can afford | HTTP 200 (this is allowed for non-admins). |
| 3.6.A3 | `GET /api/web/rewards/my-redemptions` | HTTP 200; redemption from A2 visible. |

### 3.7 dependent (non-admin)

Same as 3.6 (`user`). Confirm:

- Any `/admin/*` redirects to `/rewards`.
- `GET /api/web/users` returns HTTP 403 `ADMIN_REQUIRED`.

---

## 4. Cross-cutting checks (do once at the end)

| # | Check | Expected | Phase |
| --- | --- | --- | --- |
| 4.1 | Open DevTools → Network. Submit a state-changing form without the `csrf_token` cookie (e.g., delete the cookie manually then retry). | HTTP 403 `CSRF_INVALID`. | 4B |
| 4.2 | Submit a state-changing form with a tampered `X-CSRF-Token` header (use DevTools → Network → "Edit and Resend"). | HTTP 403 `CSRF_INVALID`. | 4B |
| 4.3 | Force-logout was performed in 3.1.M6. After force-logout, any request bearing a JWT issued before `force_logout_at` returns HTTP 401 `FORCED_LOGOUT`. | Confirmed. | 4C |
| 4.4 | View HTTP response headers from any `http://localhost:3000` page. (Note: in dev, nginx is bypassed; this check is meaningful in staging.) | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy`, `Content-Security-Policy-Report-Only`. | 4D |
| 4.5 | Submit a registration with a weak password (e.g., `abc`) | HTTP 400 `WEAK_PASSWORD`. | 4G |
| 4.6 | Run `flask cleanup-tokens` from the server venv. | Logs `deleted=<int> duration_s=<float>`. | 4I |
| 4.7 | After completing a per-role walk, view `/admin/logs/access` as superadmin. | Each role's actions appear as audit rows with the correct `actor`, `action`, and `timestamp`. | 2 |

---

## 5. Reporting

For each role, fill out:

```
Role: __________________
Date / time: __________________
Tester: __________________

A. Login                  [ PASS / FAIL ]   Notes: ____________
B. Access matrix          [ PASS / FAIL ]   Failed pages: ____________
C. Mutation tests         [ PASS / FAIL ]   Failed mutations: ____________
D. Logout                 [ PASS / FAIL ]   Notes: ____________

Cross-cutting checks (run once after final role):
4.1 CSRF missing          [ PASS / FAIL ]
4.2 CSRF tampered         [ PASS / FAIL ]
4.3 Forced logout         [ PASS / FAIL ]
4.4 Security headers      [ PASS / FAIL / N/A in dev ]
4.5 Weak password         [ PASS / FAIL ]
4.6 Token cleanup         [ PASS / FAIL ]
4.7 Audit completeness    [ PASS / FAIL ]
```

If any **PASS / FAIL** is `FAIL`, file the issue against the relevant phase in `docs/phase-status.md` and re-run the affected role(s) after the fix lands.

---

## 6. Out of scope

These flows are **not** covered by this plan and require Phase 4A to resume:

- `/api/rpi/*` endpoints (RPI controller).
- HMAC-signed QR payloads (`<display_id>.<hmac_suffix>`) on the `/qr` page.
- Per-RVM API keys (`X-API-Key` header).
- `docs/rpi-api-contract.md` (not yet authored).

The smoke test at `tools/smoke/whole_system_smoke.py` (companion document) automates as much of Sections 1, 2, and 4 as possible. Use the manual plan when human-in-the-loop UI verification is required (e.g., redirect timing, sidebar filtering, empty-state placeholders).
