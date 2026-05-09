# ♻️ EcoPoints — Local Setup Guide

## 🎯 Introduction
Welcome to the **EcoPoints Capstone Project**!
This guide walks you through setting up the project on your local machine — environment files, dependencies, and database initialization for both the **server** (Flask) and **client** (Next.js).

> **Database**: EcoPoints uses **Supabase** (hosted PostgreSQL). There is no local database to install — all teammates connect to the same shared cloud database.

---

# 📁 Project Structure

```
eco-points/
├── client/          ← Next.js frontend
├── server/          ← Flask backend
├── .env.example     ← Env variable reference (no real values)
└── Guides/          ← You are here
```

---

# 🖥️ Server Setup (Flask / Python)

## 1️⃣ Prerequisites
Make sure you have **Python 3.10+** installed:
```bash
python --version
```

---

## 2️⃣ Navigate to the Server Directory
```bash
cd server
```

---

## 3️⃣ Set Up the Server Environment File

Get the `server/.env` file from the team (shared via Discord).  
Place it inside the `server/` directory.

The file contains these required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SECRET_KEY` | Flask JWT signing key (same for all teammates) |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email notification config |
| `TWILIO_*` | SMS notification config (optional) |

> 💡 **Reference:** See `.env.example` at the project root for the full list of variables and their format.

---

### 🔑 About the SECRET_KEY

The `SECRET_KEY` is used to sign and verify JWT tokens. **All teammates must use the same key** — if keys differ, logged-in users will get 401 errors when requests hit different instances.

The shared `.env` already has a generated key. If you ever need to generate a new one (e.g. rotating after a security incident):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as the value of `SECRET_KEY` in `server/.env`.  
**Then share the updated `.env` with all teammates** — everyone must use the same key.

---

## 4️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

**If you get a Windows long path error:**

**Option A** — Enable long paths (run PowerShell as Administrator):
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```
Then restart and retry.

**Option B** — Use a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
```

---

## 5️⃣ Initialize the Database

> ⚠️ **This step connects to Supabase.** Make sure `server/.env` has the correct `DATABASE_URL` before running these commands.

**Run migrations** (creates all tables in Supabase):
```bash
flask db upgrade
```

**Seed the database** with test data:
```bash
python seed.py
```

> 🔑 After seeding, all test accounts use the password: **`test123`**

> ⚠️ **Only run `seed.py` once** on a fresh database. Running it again on a populated database will cause errors. See the [Re-migration section](#-re-migrating-the-database-fresh-reset) below if you need a clean slate.

---

## 6️⃣ Run the Server

```bash
python run.py
```

The server starts at **http://localhost:5000**

---

# 🌐 Client Setup (Next.js)

## 1️⃣ Prerequisites
Make sure you have **Node.js 18+** installed:
```bash
node --version
npm --version
```

---

## 2️⃣ Navigate to the Client Directory
```bash
cd client
```

---

## 3️⃣ Set Up the Client Environment File

Get the `client/.env.local` file from the team (shared via Discord).  
Place it inside the `client/` directory.

The file contains:

```env
# Points Next.js to the Flask backend
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000

# Google reCAPTCHA (test key — always passes in dev)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

---

## 4️⃣ Install Node Dependencies

```bash
npm install
```

---

## 5️⃣ Run the Client

```bash
npm run dev
```

The app starts at **http://localhost:3000**

---

# 🔄 Re-migrating the Database (Fresh Reset)

> Use this when the database schema has changed, or you need a completely clean slate.
> **This wipes ALL data in Supabase** — coordinate with the team before doing this.

---

## Step 1 — Drop all tables in Supabase

Go to **Supabase Dashboard** → your project → **SQL Editor** → run this query:

```sql
-- Drop all tables in the correct order (respects foreign keys)
DROP TABLE IF EXISTS
  token_blacklist,
  login_attempts,
  notification_logs,
  notification_settings,
  admin_logs,
  bulk_deposits,
  reward_redemptions,
  reward_variants,
  rewards,
  transactions,
  maintenance_logs,
  recycling_items,
  recycling_sessions,
  rvms,
  otp_codes,
  user_security,
  wallet,
  users,
  community_groups,
  org_contact,
  org_address,
  organizations,
  org_types,
  alembic_version
CASCADE;
```

Click **Run** (▶).

---

## Step 2 — Reset the Alembic migration state locally

```bash
cd server
```

```bash
# Windows
rmdir /s /q migrations\versions\__pycache__
```

> This forces Alembic to treat the next `flask db upgrade` as a fresh migration.

---

## Step 3 — Re-run migrations

```bash
flask db upgrade
```

This recreates all tables in Supabase from the current model definitions.

---

## Step 4 — Re-seed the database

```bash
python seed.py
```

> 🔑 All seeded accounts use the password: **`test123`**

---

## ✅ Re-migration checklist

- [ ] Communicated with the team (data wipe affects everyone)
- [ ] Dropped all tables in Supabase SQL Editor
- [ ] Ran `flask db upgrade` — no errors
- [ ] Ran `python seed.py` — completed successfully
- [ ] Verified login works at `http://localhost:3000`

---

# ✅ Full Setup Checklist

### Server
- [ ] Python 3.10+ installed
- [ ] `server/.env` received from team and placed in `server/`
- [ ] `pip install -r requirements.txt` ran successfully
- [ ] `flask db upgrade` ran successfully
- [ ] `python seed.py` ran successfully
- [ ] `python run.py` starts without errors at `http://localhost:5000`

### Client
- [ ] Node.js 18+ installed
- [ ] `client/.env.local` received from team and placed in `client/`
- [ ] `npm install` ran successfully
- [ ] `npm run dev` starts without errors at `http://localhost:3000`

---

# 🆘 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `No module named 'flask'` | Dependencies not installed | Run `pip install -r requirements.txt` |
| `'next' is not recognized` | Node modules not installed | Run `npm install` |
| `could not connect to server` | Wrong `DATABASE_URL` | Check `server/.env` — confirm Supabase connection string is correct |
| `relation "users" already exists` | Tables already exist in Supabase | Drop all tables (see Re-migration section) then re-run `flask db upgrade` |
| `SSL connection required` | Missing `?sslmode=require` in URL | Add `?sslmode=require` to the end of `DATABASE_URL` |
| Long path error during `pip install` | Windows 260-char path limit | Enable long paths or use a virtual environment |
| `'flask' is not recognized` | Flask not on system PATH | Use `python -m flask` instead of `flask` |
| `seed.py fails / duplicate key` | Database already seeded | Drop all tables and re-run (see Re-migration section) |

---

# 🎉 Final Note

> Both servers must run simultaneously for the app to work:
> - **Backend:** `http://localhost:5000` (Flask)
> - **Frontend:** `http://localhost:3000` (Next.js)

**Happy Coding! ♻️**
