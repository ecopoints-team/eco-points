# QA Manual Test Guide — Admin Dashboard Fixes (2026-06-22)

**Branch:** `dev`  
**Server:** `http://localhost:5000`  
**Client:** `http://localhost:3000`  
**Date:** June 22, 2026

---

## How to Use This Document

Each section maps to a fix that was implemented. For every test:
- ✅ = expected pass (working correctly)
- ❌ = bug (report with screenshot + server terminal output)

Mark each checkbox as you go. The server terminal must be running (`cd server ; python run.py`) so you can observe real-time logs.

---

## Phase 1 — Rewards Create/Edit 500 Fix

### Test 1.1 — Add a reward WITH an image

**Steps:**
1. Log in as Head Admin or Superadmin
2. Go to Rewards Inventory → click **Add Reward**
3. Fill in: Name = `Test Reward`, Points = `50`, Stock = `10`, Category = `Merchandise`
4. Click the image upload area and pick any `.png` or `.jpg` file from your computer
5. Wait for the image preview to appear (should be instant, ~1-2 seconds)
6. Click **Create**

**Expected:**
- [ ] A spinner/progress overlay appears while saving
- [ ] "Reward created" success tick appears briefly
- [ ] The new reward appears in the table with the image showing
- [ ] Server terminal shows `POST /api/web/rewards/image HTTP/1.1" 200` then `POST /api/web/rewards HTTP/1.1" 201`
- [ ] No 500 error in the terminal

**Was broken:** Previously crashed with INTERNAL SERVER ERROR because base64 image overflowed the database column.

---

### Test 1.2 — Edit a reward and change its image

**Steps:**
1. Click Edit on any existing reward
2. Pick a new image file
3. Click Save

**Expected:**
- [ ] Image preview updates immediately after selection
- [ ] Progress overlay shows while saving
- [ ] No 500 error in terminal
- [ ] Image updates in the table

---

### Test 1.3 — Add a reward WITHOUT an image

**Steps:**
1. Add Reward, fill in all fields, leave image empty
2. Click Create

**Expected:**
- [ ] Reward created successfully (201 in terminal)
- [ ] No error

---

## Phase 2 — Progress Modals

### Test 2.1 — Locations: Add / Edit / Delete

**Steps:**
1. Go to **Locations** menu
2. Click **Add Location**, fill in required fields, click Create
3. Observe while the request is in flight
4. Click **Edit** on any location, change the name, save
5. Click **Delete** on any non-critical location

**Expected for each action:**
- [ ] A full-screen modal overlay with a green spinner and label (e.g. "Creating location...") appears while the action is processing
- [ ] Overlay switches to a green checkmark with "Location created" for ~700ms then disappears
- [ ] Page does NOT go stale/frozen without any feedback

---

### Test 2.2 — Machines: Add / Edit / Delete / Add Maintenance / Delete Maintenance

**Steps:**
1. Go to **Machines**
2. Add a machine, edit it, delete it
3. Click **Add Maintenance** on a machine, fill in, save
4. Click **Delete** on a maintenance entry (beside Edit)

**Expected:**
- [ ] Each action shows the correct progress label (e.g. "Adding machine...", "Logging maintenance...")
- [ ] Success tick appears after each one

---

### Test 2.3 — Manage Users: Add / Edit / Points Adjustment / Deactivate / Delete

**Steps:**
1. Go to **Manage Users**
2. Add a user, edit a user, adjust points, deactivate a user, delete a user

**Expected:**
- [ ] Each action shows a progress spinner with its label
- [ ] No silent freezes

---

### Test 2.4 — Manage Admins (Permissions page): Add / Edit / Delete / Deactivate

**Steps:**
1. Go to **Users → Permissions** (or Manage Admins)
2. Add admin, edit admin, delete admin, deactivate admin

**Expected:**
- [ ] Progress overlay on each action

---

### Test 2.5 — Rewards Inventory: Add / Edit / Deactivate / Delete

**Steps:**
1. Go to **Rewards Inventory**
2. Add, Edit, Deactivate, Delete a reward

**Expected:**
- [ ] Progress overlay with the correct label on each action

---

### Test 2.6 — Export buttons (All Log pages + Analytics)

**Go to each of these pages and click the Export button:**
- [ ] Bottle Logs — "Preparing export..." → CSV downloads
- [ ] Machine Logs — "Preparing export..." → CSV downloads
- [ ] Reward Logs — "Preparing export..." → CSV downloads
- [ ] Transaction Logs — "Preparing export..." → CSV downloads
- [ ] Admin Logs — "Preparing export..." → CSV downloads
- [ ] Analytics — "Preparing export..." → file downloads

**Expected:** Each shows the overlay, then the file downloads. No silent nothing.

---

### Test 2.7 — Bulk Sessions: Create

**Steps:**
1. Go to **Bulk Sessions**
2. Click Add Bulk Session, fill it in, submit

**Expected:**
- [ ] "Creating bulk session..." overlay
- [ ] "Bulk session created" on success

---

### Test 2.8 — Sign Out

**Steps:**
1. Click the profile dropdown → Sign Out

**Expected:**
- [ ] "Signing out..." overlay appears briefly
- [ ] Redirected to login page
- [ ] Server terminal shows the logout log entry

---

### Test 2.9 — Removed redundant controls

**Machine Logs page:**
- [ ] Confirm there is NO "Create Log" button on this page (it was removed — use Machines page for that)

**Reward Logs page:**
- [ ] Confirm there is NO "Scan QR Code" button on this page (it was removed — use Claim Scanner menu for that)

---

## Phase 3 — Notifications

### Test 3.1 — Test Notification with Resend not configured

**Steps:**
1. Go to **Settings → Notifications**
2. Scroll to the Test Notification section
3. Enter any email address
4. Click Send Test

**Expected (if `RESEND_API_KEY` is NOT set in `.env`):**
- [ ] Error message shown: something like "Failed to send: Resend not configured (RESEND_API_KEY required)"
- [ ] Server terminal shows `POST .../notifications/test HTTP/1.1" 502` (NOT 500)

**Was broken:** Previously returned 500 making it look like a server crash. Now returns 502 with a clear reason.

---

### Test 3.2 — Test Notification with Resend configured

**Pre-condition:** `RESEND_API_KEY` and `EMAIL_FROM` must be set in `server/.env`

**Steps:**
1. Settings → Notifications → Test section
2. Enter a real email you can check
3. Click Send

**Expected:**
- [ ] Email arrives in your inbox with the EcoPoints branded template
- [ ] Server terminal: `200` status

---

### Test 3.3 — Create a user: notification doesn't crash the page

**Steps:**
1. Go to Manage Users → Add User
2. Create a valid user

**Expected:**
- [ ] User created successfully (201 in terminal)
- [ ] Even if email notifications are not configured, the page does NOT error
- [ ] Server terminal shows `new_user_registered alert failed (non-fatal)` in the logs IF notifications aren't configured — this is expected and correct

---

### Test 3.4 — Unresolved Maintenance sweep (`flask check-maintenance`)

**Pre-condition:** At least one maintenance log in "Pending" status older than the configured threshold

**Steps:**
1. Go to Settings → Notifications → find "Unresolved Maintenance"
2. Set it to Active, threshold = `1` (hour), add a recipient email, Save
3. Create a maintenance log on a machine (or find an existing Pending one)
4. In a separate terminal: `cd server ; flask check-maintenance`

**Expected:**
- [ ] Terminal prints `Maintenance sweep complete.`
- [ ] If there is a stale pending log, an email is sent (check inbox)
- [ ] A `NotificationLog` row appears in the notification logs section of Settings

---

### Test 3.5 — Superadmin logs NOT visible in org notification bell

**Steps:**
1. Log in as Head Admin (not superadmin)
2. Click the notification bell in the top header

**Expected:**
- [ ] The bell only shows actions performed by admins within THIS organization
- [ ] No "Super Admin Login", "Super Admin Logout", or any superadmin activity entries

**Was broken:** Superadmin login/logout events were leaking into per-org notification feeds.

---

### Test 3.6 — Superadmin logs NOT visible in Admin Logs page (per org)

**Steps:**
1. Log in as Head Admin
2. Go to **Admin Logs** page

**Expected:**
- [ ] No rows with `adminRole = superadmin` appear

---

## Phase 4 — Security Tab

### Test 4.1 — 2FA Method: SMS OTP removed

**Steps:**
1. Log in as Head Admin
2. Go to **Settings → Security**
3. Enable "Require 2FA for all admins"
4. Look at the **Default 2FA Method** dropdown

**Expected:**
- [ ] Only "Email OTP" is available in the dropdown
- [ ] There is NO "SMS OTP" option

**Was broken:** SMS OTP was listed but not functional (SMS was removed from the system).

---

### Test 4.2 — 2FA Email flow (manual)

**Pre-condition:** `RESEND_API_KEY` and `EMAIL_FROM` configured, user has email set

**Steps:**
1. Settings → Security → Enable 2FA, method = Email OTP, Save
2. Log out
3. Log back in with valid credentials

**Expected:**
- [ ] After entering password, shown an OTP challenge screen (not immediately logged in)
- [ ] An email arrives with a 6-digit code
- [ ] Entering the correct code → logged in successfully
- [ ] Entering a wrong code → rejected with error
- [ ] The OTP expires after a few minutes if unused

---

### Test 4.3 — Login Lockout

**Steps:**
1. Settings → Security → set Max Login Attempts = `3`, Lockout Duration = `15 minutes`, Save
2. Log out
3. Try to log in with a WRONG password 3 times (using the admin's email)
4. On the 4th attempt, use the CORRECT password

**Expected:**
- [ ] 4th attempt is blocked with a message like "Account is temporarily locked. Try again in X minute(s)."
- [ ] Terminal shows the lockout response (429 status)
- [ ] After waiting 15 minutes (or reducing the lockout in settings), login works again

---

### Test 4.4 — Session Timeout

**Steps:**
1. Settings → Security → set Session Timeout = `5 minutes`, Save
2. Log in fresh
3. Stay idle for 6+ minutes
4. Try to navigate to any admin page

**Expected:**
- [ ] Redirected to login page
- [ ] Terminal shows `401` response as the expired token is rejected

---

### Test 4.5 — Force Logout All Sessions

**Steps:**
1. Open the admin dashboard in **two different browsers** (or incognito), both logged in
2. In Browser A: Settings → Security → click **Force Logout All Sessions**
3. In Browser B: click any link or make any action

**Expected:**
- [ ] Browser B is immediately redirected to login (session invalidated)
- [ ] Browser A may also be kicked (the actor's own session is also terminated)
- [ ] Terminal shows `401 FORCED_LOGOUT` for the rejected request from Browser B

---

### Test 4.6 — Security settings are org-scoped (multi-tenant)

**Steps:**
1. Log in as Head Admin of Org A
2. Change the Session Timeout in Settings → Security
3. Log in as Head Admin of Org B

**Expected:**
- [ ] Org B's security settings are unchanged — each org has independent settings
- [ ] Org B's admins are NOT affected by Org A's timeout change

---

## Phase 5 — Quick Actions Per Role

### Test 5.1 — Head Admin quick actions

**Steps:**
1. Log in as Head Admin
2. Look at the **Quick Actions** section on the dashboard

**Expected:**
- [ ] Shows exactly: **Rewards**, **Manage Users**, **Machines**, **Admin Logs**
- [ ] Each shortcut navigates to the correct page when clicked

---

### Test 5.2 — Auditor quick actions

**Steps:**
1. Log in as Auditor

**Expected Quick Actions:**
- [ ] **User Management** → `/admin/users`
- [ ] **Analytics** → `/admin/analytics`
- [ ] **System Logs** → `/admin/logs/access`
- [ ] **Bulk Sessions** → `/admin/bulk-sessions`

---

### Test 5.3 — Inventory Officer quick actions

**Expected Quick Actions:**
- [ ] **Rewards Inventory** → `/admin/rewards`
- [ ] **Bulk Sessions** → `/admin/bulk-sessions`
- [ ] **System Logs** → `/admin/logs/access`

---

### Test 5.4 — Technician quick actions

**Expected Quick Actions:**
- [ ] **Machines** → `/admin/machines`
- [ ] **Bulk Sessions** → `/admin/bulk-sessions`
- [ ] **Session Logs** → `/admin/logs/bottles`

---

### Test 5.5 — Superadmin sees head_admin set

**Steps:**
1. Log in as Superadmin (no "View as" filter applied)

**Expected Quick Actions:**
- [ ] Shows: **Rewards**, **Manage Users**, **Machines**, **Admin Logs**
  (same as head_admin — the broadest curated set)

---

## Terminal Log Health Check

While running the tests above, the terminal output should look like this for healthy operations:

```
200  - GET  /api/web/auth/me          ← normal auth check
201  - POST /api/web/rewards/image    ← image upload
201  - POST /api/web/rewards          ← reward created
200  - PUT  /api/web/rewards/X        ← reward updated
200  - POST /api/web/settings/notifications/test  ← test notif (or 502 if unconfigured)
401  -                                ← expected when session expires or force-logout
429  -                                ← expected when account is locked
```

**Red flags to report:**
- Any `500` response that is NOT for an expected test (e.g. 500 on notifications/test is now fixed → should be 502)
- `create_reward failed` in the logs (means something broke the reward creation, not just image)
- `new_user_registered alert failed (non-fatal)` is OK if Resend is not configured — it's intentionally logged at WARNING level and does not fail the user creation

---

## Known Pre-Existing Warnings (Not Bugs)

These appear in the terminal and are safe to ignore:

```
SAWarning: Coercing Subquery object into a select() for use in IN()
```
→ In `rewards_controller.py`. Pre-existing SQLAlchemy deprecation warning. Harmless, flagged for a future cleanup.

```
403 - GET /api/web/locations
```
→ Expected when a role without `locations` permission hits that endpoint. Not a bug.

```
[RATELIMIT] REDIS_URL not set — using in-memory storage (per-worker)
[CACHE] REDIS_URL not set — caching disabled, using DB fallback
```
→ Expected in local dev. Redis is optional.
