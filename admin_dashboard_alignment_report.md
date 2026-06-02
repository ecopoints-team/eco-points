# Admin Dashboard Alignment Report

> **Project:** EcoPoints Admin Dashboard  
> **Date:** June 2, 2026  
> **Scope:** UI consistency, data integrity, build stability, automated testing  
> **Status:** ✅ Complete — all automated checks passing

---

## 🎯 What This Was About

The admin dashboard had grown organically, leading to several issues:

- **Build failures** on Cloudflare Pages caused by leftover test data baked into the app
- **Inconsistent labels** — the same thing called different names in different places
- **Missing input validation** — forms allowed invalid or empty data through
- **No automated safety net** — no way to catch regressions before deploying

This alignment effort fixed all four areas without changing any backend logic or database structure.

---

## 📋 Summary of Changes

### 1. Build Stability — Removed Hardcoded Test Data

**The problem:** Several admin pages imported fake/test data (mock data) that was meant only for development. When the production build ran on Cloudflare, these imports caused the entire site to fail to deploy.

**What we did:**
- Removed all mock data dependencies from three pages: **Leaderboards**, **Locations**, and **User Registration**
- Replaced them with live API calls that pull real data from the server
- The user registration modal now dynamically fetches available groups (departments/strands/sections) from the API instead of using a hardcoded list

**Impact:** The production build now succeeds every time. No more deployment failures.

---

### 2. Consistent Labels — Everything Matches the Data Model

**The problem:** The same data field was called different things on different screens. For example, what the database calls a "Group" was labeled "Department" on one page and "Strand" on another. This confused both users and developers.

**What we changed:**

| Before | After | Where |
|--------|-------|-------|
| "Department" column | **"Group"** column | Users table |
| `joinDate` internal variable | **`memberSince`** | Profile page |
| City dropdown (from hardcoded list) | **City/Municipality** text field | Location forms |

**Impact:** Every label in the admin dashboard now matches the actual database field name. When a developer reads the code or a user reads the screen, they see the same terminology the API uses.

---

### 3. Input Validation — Forms Catch Mistakes Before Submitting

**The problem:** Form validation was inconsistent. Some pages had thorough checks, others had minimal or no validation. Each page implemented its own validation logic differently, making it hard to maintain.

**What we did:**
- Created a **shared validation library** (`validateField.js`) that all forms use
- Defined validation rules for each type of data:

| Entity | Validated Fields |
|--------|-----------------|
| **Location** | Name (required, max 100 chars), Full Name, Org Type, Street Address, City, Contact Person, Email (format check), Phone (10-digit check) |
| **User** | Name (required, max 200 chars), Email (format check), Password (min 6 chars) |
| **Machine** | Machine Name (required, max 200 chars), Location (required) |
| **Reward** | Name (required), Category (required), Points Required (positive integer), Stock Quantity (non-negative integer) |

**Impact:** Users get clear, specific error messages ("Email format is invalid") instead of vague ones ("Please fill in all required fields"). All forms validate the same way.

---

### 4. Empty Data Handling — No More Blank Cells

**The problem:** When the server returned empty or missing data, some table cells showed nothing, some showed "undefined", and others showed "-" or "—". This was inconsistent and looked broken.

**What was already in place:** A utility called `formatField()` that converts any null, undefined, or empty value into a clean em-dash (—). This utility is used in **68 places** across the admin dashboard, so this was already well-covered. We verified it during this alignment and confirmed full coverage.

**Impact:** Every empty cell in every admin table shows the same "—" placeholder. No more "undefined" showing up on screen.

---

## 🧪 Automated Testing

We created two test suites that can be run anytime to verify nothing is broken:

### Frontend Smoke Tests (PowerShell)

```powershell
# Run from the repo root
powershell -ExecutionPolicy Bypass -File scripts\smoke-test-admin.ps1
```

**What it checks (10 tests):**

| # | Check | What It Verifies |
|---|-------|-----------------|
| 1 | No mock data imports | All test/fake data removed from production code |
| 2 | Validation utility exists | `validateField.js` is present |
| 3 | Format utility exists | `formatField.js` is present with correct export |
| 4 | Users page label | Column header says "Group" not "Department" |
| 5 | Location validation | Uses shared validation rules |
| 6 | User modal API | Fetches groups dynamically from API |
| 7 | Profile field name | Uses `memberSince` not `joinDate` |
| 8 | Reward validation | Uses shared validation rules |
| 9 | Machine validation | Uses shared validation rules |
| 10 | Production build | `npm run build` succeeds with zero errors |

### Backend Smoke Tests (Python/pytest)

```bash
# Run from the server directory
cd server && python -m pytest tests/smoke/ -v --tb=short
```

**What it checks (21 tests):**

| Category | Tests | What It Verifies |
|----------|-------|-----------------|
| GET Endpoints | 13 | Every admin API endpoint returns HTTP 200 with `success: true` |
| Response Shapes | 5 | User, Location, Reward, Group, and Machine records have the correct field names |
| CRUD Cycle | 1 | Groups can be created → updated → deleted without errors |
| Access Control | 2 | Regular users are blocked from admin endpoints; superadmins can access everything |

---

## 📁 Files Changed

### New Files

| File | Purpose |
|------|---------|
| [validateField.js](file:///c:/Users/pc/Documents/Github/client/src/lib/validateField.js) | Shared input validation utility with rules for all entities |
| [smoke-test-admin.ps1](file:///c:/Users/pc/Documents/Github/scripts/smoke-test-admin.ps1) | Frontend smoke test script (10 checks) |
| [test_admin_smoke.py](file:///c:/Users/pc/Documents/Github/server/tests/smoke/test_admin_smoke.py) | Backend smoke test suite (21 tests) |

### Modified Files

| File | What Changed |
|------|-------------|
| [leaderboards/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/leaderboards/page.js) | Removed mock data imports |
| [locations/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/locations/page.js) | City dropdown → text fields; shared validation |
| [AddRegularUserModal.jsx](file:///c:/Users/pc/Documents/Github/client/src/components/admin/AddRegularUserModal.jsx) | Dynamic group fetching; shared validation |
| [users/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/users/page.js) | "Department" → "Group" label |
| [profile/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/profile/page.js) | `joinDate` → `memberSince` |
| [machines/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/machines/page.js) | Shared validation in Add/Edit modals |
| [rewards/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/rewards/page.js) | Shared validation with error alerts |

---

## ✅ Verification Results

| Check | Result |
|-------|--------|
| Production build (`npm run build`) | ✅ 25/25 pages generated, zero errors |
| Frontend smoke tests | ✅ 10/10 pass |
| Backend smoke tests | ✅ 21/21 pass |
| Mock data references in source | ✅ Zero remaining |

---

## 🔜 Remaining Steps (Manual)

| Step | Owner | Action |
|------|-------|--------|
| Deploy | Developer | Push to `main` branch → Cloudflare Pages auto-rebuilds |
| Manual QA | Admin | Log in as superadmin, click through each admin page, verify labels and forms |

---

## 💡 For Future Developers

- **Adding a new form?** Import `validateField` and `VALIDATION_RULES` from `client/src/lib/validateField.js`. Add your entity's rules to the `VALIDATION_RULES` object.
- **Displaying a field that might be null?** Wrap it with `formatField(value)` from `client/src/lib/formatField.js`.
- **Adding a new admin page?** Add its GET endpoint to the backend smoke test's `TestGetEndpoints` parametrize list.
- **Running all tests before deploying?** Run both smoke test commands listed above.
