# EcoPoints — Backend Integration Plan

**Date:** March 1, 2026  
**Scope:** Replace all `mockData.js` imports with real API calls to the Flask backend

---

## 1. Current State (What We Have)

### Backend (`server/`)

| Component             | Status      | Notes                                                                                                                                                                                  |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **models.py**         | ✅ Complete | 14 tables — City, Organization, CommunityGroup, Account, User, AccessCredential, RVM, RecyclingSession, RecyclingItem, MaintenanceLog, Transaction, Reward, RewardRedemption, AdminLog |
| **seed.py**           | ✅ Complete | 655 lines, populates all 14 tables with realistic test data                                                                                                                            |
| **Migration**         | ✅ Applied  | Alembic migration matches models.py                                                                                                                                                    |
| **web_controller.py** | ⚠️ Minimal  | Only 3 routes: `GET /api/web/users`, `GET /api/web/users/<id>`, `GET /api/web/health`                                                                                                  |
| **rpi_controller.py** | ✅ Good     | 8 routes for RVM hardware flow: scan, authenticate, session start/deposit/end, status, log, health                                                                                     |
| **Auth (JWT)**        | ❌ Missing  | No login endpoint, no token handling, no middleware                                                                                                                                    |

### Frontend (`client/`)

| Component          | Status                | Notes                                                                                                                                                            |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **mockData.js**    | 654 lines             | All data: CITIES, LOCATIONS, DEPARTMENTS, ADMIN_USERS, MACHINES, REWARDS, USERS (200), BOTTLE_LOGS, MACHINE_LOGS, ADMIN_LOGS, REWARDS_LOGS + 20 helper functions |
| **userService.js** | ⚠️ Minimal            | Only `getAll()`, `getById()`, `create()`, `healthCheck()` — shape matches existing backend                                                                       |
| **rpiService.js**  | ✅ Good               | `getStatus()`, `authenticate()`, `scanBottle()`, `logEvent()`, `healthCheck()`                                                                                   |
| **AuthContext.js** | ⚠️ Mock-based         | Hardcoded to `ADMIN_USERS[0]` (Super Admin), loads from mockData                                                                                                 |
| **Admin Pages**    | 9 pages + 4 log pages | All import from `mockData.js` directly                                                                                                                           |

### Infrastructure

| Component         | Status                                                               |
| ----------------- | -------------------------------------------------------------------- |
| Docker Compose    | ✅ Postgres + Flask + Next.js + Nginx                                |
| Next.js API Proxy | ✅ `rewrites()` → `/api/:path*` → `http://127.0.0.1:5000/api/:path*` |
| CORS              | ✅ Configured for localhost:3000 + production domains                |
| Nginx             | ✅ Reverse proxy configured                                          |

---

## 2. What Needs To Be Built

### Phase A — Backend API Routes (~25 endpoints)

All routes go under `web_controller.py` at prefix `/api/web/`.

#### Auth

| #   | Method | Endpoint       | Purpose                         |
| --- | ------ | -------------- | ------------------------------- |
| 1   | POST   | `/auth/login`  | Admin login → returns JWT token |
| 2   | POST   | `/auth/logout` | Invalidate session              |
| 3   | GET    | `/auth/me`     | Get current user from token     |

#### Dashboard

| #   | Method | Endpoint           | Purpose                                                                   |
| --- | ------ | ------------------ | ------------------------------------------------------------------------- |
| 4   | GET    | `/dashboard/stats` | Aggregated counts (users, machines, bottles, points) filtered by location |

#### Locations (Organizations)

| #   | Method | Endpoint          | Purpose                |
| --- | ------ | ----------------- | ---------------------- |
| 5   | GET    | `/locations`      | List all organizations |
| 6   | POST   | `/locations`      | Create organization    |
| 7   | PUT    | `/locations/<id>` | Update organization    |
| 8   | DELETE | `/locations/<id>` | Delete organization    |

#### Users

| #   | Method | Endpoint      | Purpose                                             |
| --- | ------ | ------------- | --------------------------------------------------- |
| 9   | GET    | `/users`      | List all users (with filters: role, location, type) |
| 10  | POST   | `/users`      | Create user (regular or admin)                      |
| 11  | PUT    | `/users/<id>` | Update user                                         |
| 12  | DELETE | `/users/<id>` | Deactivate user                                     |

#### Machines (RVMs)

| #   | Method | Endpoint         | Purpose          |
| --- | ------ | ---------------- | ---------------- |
| 13  | GET    | `/machines`      | List all RVMs    |
| 14  | POST   | `/machines`      | Register new RVM |
| 15  | PUT    | `/machines/<id>` | Update RVM       |
| 16  | DELETE | `/machines/<id>` | Decommission RVM |

#### Rewards

| #   | Method | Endpoint        | Purpose                  |
| --- | ------ | --------------- | ------------------------ |
| 17  | GET    | `/rewards`      | List all rewards         |
| 18  | POST   | `/rewards`      | Create reward            |
| 19  | PUT    | `/rewards/<id>` | Update reward            |
| 20  | DELETE | `/rewards/<id>` | Delete/deactivate reward |

#### Logs (Read-Only)

| #   | Method | Endpoint         | Purpose                                              |
| --- | ------ | ---------------- | ---------------------------------------------------- |
| 21  | GET    | `/logs/bottles`  | Bottle/recycling logs (RecyclingItem + Session data) |
| 22  | GET    | `/logs/machines` | Maintenance logs                                     |
| 23  | GET    | `/logs/access`   | Admin action logs                                    |
| 24  | GET    | `/logs/rewards`  | Reward redemption logs                               |

#### Leaderboard & Settings

| #   | Method | Endpoint       | Purpose                              |
| --- | ------ | -------------- | ------------------------------------ |
| 25  | GET    | `/leaderboard` | Top users/groups ranked by points    |
| 26  | GET    | `/settings`    | System config (bottle pricing, etc.) |
| 27  | PUT    | `/settings`    | Update system config                 |

**All endpoints** support `?location_id=<id>` query param for multi-tenant filtering.

---

### Phase B — Frontend API Service Layer

Replace `mockData.js` imports with a unified `apiService.js` that calls real endpoints.

**New file: `client/src/services/apiService.js`**

```
apiService
├── auth.login(email, password)        → POST /api/web/auth/login
├── auth.logout()                      → POST /api/web/auth/logout
├── auth.me()                          → GET  /api/web/auth/me
├── dashboard.getStats(locationId?)    → GET  /api/web/dashboard/stats
├── locations.getAll()                 → GET  /api/web/locations
├── locations.create(data)             → POST /api/web/locations
├── locations.update(id, data)         → PUT  /api/web/locations/:id
├── locations.delete(id)               → DELETE /api/web/locations/:id
├── users.getAll(filters?)             → GET  /api/web/users
├── users.create(data)                 → POST /api/web/users
├── users.update(id, data)             → PUT  /api/web/users/:id
├── users.delete(id)                   → DELETE /api/web/users/:id
├── machines.getAll(locationId?)       → GET  /api/web/machines
├── machines.create(data)              → POST /api/web/machines
├── machines.update(id, data)          → PUT  /api/web/machines/:id
├── machines.delete(id)                → DELETE /api/web/machines/:id
├── rewards.getAll(locationId?)        → GET  /api/web/rewards
├── rewards.create(data)               → POST /api/web/rewards
├── rewards.update(id, data)           → PUT  /api/web/rewards/:id
├── rewards.delete(id)                 → DELETE /api/web/rewards/:id
├── logs.getBottles(locationId?)       → GET  /api/web/logs/bottles
├── logs.getMachines(locationId?)      → GET  /api/web/logs/machines
├── logs.getAccess(locationId?)        → GET  /api/web/logs/access
├── logs.getRewards(locationId?)       → GET  /api/web/logs/rewards
├── leaderboard.get(locationId?)       → GET  /api/web/leaderboard
└── settings.get() / settings.update() → GET/PUT /api/web/settings
```

---

### Phase C — Frontend Wiring (Page-by-Page)

Each page currently imports from `mockData.js`. Here's what changes:

| Page                                                | Current mockData Imports                                                           | Replacement                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Dashboard** (`admin/page.js`)                     | MACHINES, USERS, REWARDS, LOCATIONS, BOTTLE_LOGS + filter helpers                  | `apiService.dashboard.getStats()` + individual list calls         |
| **Users** (`admin/users/page.js`)                   | USERS, getUsersByLocation, getDepartmentName                                       | `apiService.users.getAll({ locationId })`                         |
| **Permissions** (`admin/users/permissions/page.js`) | ADMIN_USERS, LOCATIONS, ROLES                                                      | `apiService.users.getAll({ role: 'admin' })`                      |
| **Machines** (`admin/machines/page.js`)             | MACHINES, LOCATIONS, getMachinesByLocation, ADMIN_USERS, BOTTLE_LOGS, MACHINE_LOGS | `apiService.machines.getAll()`                                    |
| **Locations** (`admin/locations/page.js`)           | LOCATIONS, BOTTLE_LOGS, USERS, getUsersByLocation, CITIES, getCityName             | `apiService.locations.getAll()`                                   |
| **Rewards** (`admin/rewards/page.js`)               | REWARDS, getRewardsByLocation                                                      | `apiService.rewards.getAll()`                                     |
| **Settings** (`admin/settings/page.js`)             | BOTTLE_PRICING                                                                     | `apiService.settings.get()`                                       |
| **Leaderboards** (`admin/leaderboards/page.js`)     | Multiple exports (users, departments, locations)                                   | `apiService.leaderboard.get()`                                    |
| **Profile** (`admin/profile/page.js`)               | LOCATIONS                                                                          | `apiService.auth.me()` (user's own data)                          |
| **Logs: Bottles** (`admin/logs/bottles/page.js`)    | BOTTLE_LOGS, LOCATIONS                                                             | `apiService.logs.getBottles()`                                    |
| **Logs: Machines** (`admin/logs/machines/page.js`)  | MACHINE_LOGS, LOCATIONS, getLocationName                                           | `apiService.logs.getMachines()`                                   |
| **Logs: Access** (`admin/logs/access/page.js`)      | ADMIN_LOGS, ADMIN_USERS, getLocationName, LOCATIONS                                | `apiService.logs.getAccess()`                                     |
| **Logs: Rewards** (`admin/logs/rewards/page.js`)    | REWARDS_LOGS, REWARDS, LOCATIONS, getLocationName                                  | `apiService.logs.getRewards()`                                    |
| **Login** (`Components/LogIn.jsx`)                  | ADMIN_USERS                                                                        | `apiService.auth.login()`                                         |
| **AuthContext** (`context/AuthContext.js`)          | ADMIN_USERS, LOCATIONS, filterByLocation, isSuperAdmin                             | `apiService.auth.me()` + `apiService.locations.getAll()` on mount |
| **AdminLayout** (`Components/AdminLayout.jsx`)      | ROLES, ADMIN_LOGS                                                                  | `apiService.logs.getAccess()` (for recent activity)               |

---

### Phase D — Auth Flow (JWT)

```
[Login Page]
     │
     ▼ POST /api/web/auth/login { email, password }
     │
     ▼ Server validates → returns { token, user }
     │
     ▼ Frontend stores token in localStorage
     │
     ▼ AuthContext loads user from token on mount
     │
     ▼ All subsequent API calls include: Authorization: Bearer <token>
     │
     ▼ Protected routes check token via middleware
```

**Backend additions needed:**

- `PyJWT` package (add to requirements.txt)
- `@token_required` decorator for protected routes
- Login endpoint with password verification
- Token refresh mechanism (optional, can add later)

---

## 3. Implementation Order

We'll work in this sequence to keep things testable at every step:

```
Step 1: Backend Auth (JWT login + middleware)
    └── So we can test with real credentials

Step 2: Backend CRUD Routes (all 27 endpoints)
    └── Full API surface for the admin panel

Step 3: Frontend apiService.js
    └── Unified service layer replacing userService.js/rpiService.js

Step 4: AuthContext → Real Auth
    └── Login page → JWT → protected routes

Step 5: Page-by-Page Wiring (13 pages)
    └── Replace mockData imports one page at a time
    └── Order: Dashboard → Users → Locations → Machines → Rewards → Logs → Settings → Leaderboards

Step 6: Cleanup
    └── Remove mockData.js (or keep as fallback)
    └── Add loading/error states to all pages
    └── Test full data flow
```

---

## 4. Risks & Decisions

| Risk                                  | Mitigation                                                               |
| ------------------------------------- | ------------------------------------------------------------------------ |
| **Breaking change during transition** | Keep mockData as fallback import, swap incrementally                     |
| **No auth = all data exposed**        | Auth is Step 1, all routes protected from the start                      |
| **Frontend field names vs backend**   | Service layer handles `camelCase ↔ snake_case` conversion                |
| **Pagination**                        | API returns all records initially; add pagination params later if needed |
| **File uploads (reward images)**      | Defer to Phase 2; use placeholder URLs for now                           |

---

## 5. Files That Will Change

### New Files

| File                                        | Purpose                                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| `server/app/controllers/auth_controller.py` | JWT auth endpoints                                      |
| `server/app/middleware.py`                  | `@token_required` decorator                             |
| `client/src/services/apiService.js`         | Unified API service (replaces userService + rpiService) |

### Modified Files

| File                                         | Change                                     |
| -------------------------------------------- | ------------------------------------------ |
| `server/app/__init__.py`                     | Register auth blueprint, add JWT config    |
| `server/app/controllers/web_controller.py`   | Add ~24 new routes                         |
| `server/requirements.txt`                    | Add `PyJWT`                                |
| `client/src/context/AuthContext.js`          | Replace mockData with API calls            |
| `client/src/Components/LogIn.jsx`            | Real login POST instead of mockData lookup |
| `client/src/Components/AdminLayout.jsx`      | Fetch recent logs from API                 |
| `client/app/admin/page.js`                   | Dashboard → API stats                      |
| `client/app/admin/users/page.js`             | Users → API                                |
| `client/app/admin/users/permissions/page.js` | Permissions → API                          |
| `client/app/admin/machines/page.js`          | Machines → API                             |
| `client/app/admin/locations/page.js`         | Locations → API                            |
| `client/app/admin/rewards/page.js`           | Rewards → API                              |
| `client/app/admin/settings/page.js`          | Settings → API                             |
| `client/app/admin/leaderboards/page.js`      | Leaderboard → API                          |
| `client/app/admin/profile/page.js`           | Profile → API                              |
| `client/app/admin/logs/bottles/page.js`      | Bottle logs → API                          |
| `client/app/admin/logs/machines/page.js`     | Machine logs → API                         |
| `client/app/admin/logs/access/page.js`       | Access logs → API                          |
| `client/app/admin/logs/rewards/page.js`      | Reward logs → API                          |

### Kept (Unchanged)

| File                                       | Reason                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| `server/app/controllers/rpi_controller.py` | Already production-ready for hardware flow           |
| `server/seed.py`                           | Kept for re-seeding test data                        |
| `client/src/data/mockData.js`              | Kept as reference/fallback until all pages are wired |

---

## 6. Quick Reference — Data Shape Mapping

How mockData field names map to the backend model columns:

### LOCATIONS[] → Organization

| Frontend (camelCase)    | Backend (snake_case) | DB Column                      |
| ----------------------- | -------------------- | ------------------------------ |
| `id`                    | `id`                 | `organizations.id`             |
| `name`                  | `name`               | `organizations.name`           |
| `fullName`              | `full_name`          | `organizations.full_name`      |
| `orgType`               | `org_type`           | `organizations.org_type`       |
| `cityId`                | `city_id`            | `organizations.city_id`        |
| `streetAddress`         | `street_address`     | `organizations.street_address` |
| `barangay`              | `barangay`           | `organizations.barangay`       |
| `zipCode`               | `zip_code`           | `organizations.zip_code`       |
| `contactPerson`         | `contact_person`     | `organizations.contact_person` |
| `contactEmail`          | `contact_email`      | `organizations.contact_email`  |
| `contactPhone`          | `contact_phone`      | `organizations.contact_phone`  |
| `status`                | `status`             | `organizations.status`         |
| `joinDate`              | `join_date`          | `organizations.join_date`      |
| `machineCount`          | _(computed)_         | `COUNT(rvms)`                  |
| `userCount`             | _(computed)_         | `COUNT(users)`                 |
| `totalBottlesCollected` | _(computed)_         | `SUM(recycling_items)`         |

### USERS[] → User + Account

| Frontend        | Backend          | DB Column                                  |
| --------------- | ---------------- | ------------------------------------------ |
| `id`            | `id`             | `users.id`                                 |
| `name`          | `name`           | `users.name`                               |
| `username`      | `username`       | `users.username`                           |
| `email`         | `email`          | `users.email`                              |
| `phone`         | `phone`          | `users.phone`                              |
| `role`          | `role`           | `users.role`                               |
| `userType`      | `user_type`      | `users.user_type`                          |
| `yearLevel`     | `year_level`     | `users.year_level`                         |
| `isActive`      | `is_active`      | `users.is_active`                          |
| `pointsBalance` | `points_balance` | `accounts.points_balance`                  |
| `locationId`    | _(derived)_      | `accounts.community_group.organization_id` |

### MACHINES[] → RVM

| Frontend              | Backend                 | DB Column                    |
| --------------------- | ----------------------- | ---------------------------- |
| `id`                  | `id`                    | `rvms.id`                    |
| `name`                | `name`                  | `rvms.name`                  |
| `locationId`          | `organization_id`       | `rvms.organization_id`       |
| `locationName`        | `location_name`         | `rvms.location_name`         |
| `isOnline`            | `is_online`             | `rvms.is_online`             |
| `maxCapacity`         | `max_capacity`          | `rvms.max_capacity`          |
| `currentCapacity`     | `current_capacity`      | `rvms.current_capacity`      |
| `totalItemsCollected` | `total_items_collected` | `rvms.total_items_collected` |

### REWARDS[] → Reward

| Frontend         | Backend           | DB Column                 |
| ---------------- | ----------------- | ------------------------- |
| `id`             | `id`              | `rewards.id`              |
| `name`           | `name`            | `rewards.name`            |
| `description`    | `description`     | `rewards.description`     |
| `category`       | `category`        | `rewards.category`        |
| `pointsRequired` | `points_required` | `rewards.points_required` |
| `stockQuantity`  | `stock_quantity`  | `rewards.stock_quantity`  |
| `isActive`       | `is_active`       | `rewards.is_active`       |
| `locationId`     | `organization_id` | `rewards.organization_id` |

---

_This document will be updated as each phase is completed._
