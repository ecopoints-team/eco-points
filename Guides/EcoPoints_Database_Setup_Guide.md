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
| `RESEND_API_KEY` / `EMAIL_FROM` | Email notification config (Resend API) |
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

### Check if Tables Exist and Have Data

Before running migrations or seeding, check your database status:

**Option 1: Supabase Dashboard**
- Go to **Supabase Dashboard** → **Table Editor**
- Look for tables: `users`, `locations`, `machines`, `rewards`, etc.

**Option 2: SQL Query** (Supabase Dashboard → SQL Editor)
```sql
-- Check if tables exist and count rows
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'machines', COUNT(*) FROM machines
UNION ALL
SELECT 'rewards', COUNT(*) FROM rewards;
```

### Based on Your Database Status:

**Scenario A: No tables exist (fresh database)**
```bash
# Create tables
flask db upgrade

# Add test data
python seed.py
```

**Scenario B: Tables exist but are empty**
```bash
# Skip migration (tables already exist)
# Just add test data
python seed.py
```

**Scenario C: Tables exist with data**
```bash
# Don't run anything - you already have data!
# Or use the cleanup script if you want to start fresh
```

> 🔑 After seeding, all test accounts use the password: **`test123`**

> ⚠️ **Only run `seed.py` once** on a fresh/empty database. Running it again on a populated database will cause duplicate key errors.

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

# 💻 Database Configuration Guide

This section explains the two ways to work with your database: **Cloud Supabase** (recommended for team development) and **Local Supabase** (for experimentation).

---

## 🌐 Cloud Supabase (Recommended for Team Development)

> [!TIP]
> **Use this for daily development.**
> Everyone on the team connects to the same shared cloud database. No Docker required!

### Advantages:
- ✅ No Docker Desktop needed
- ✅ Everyone sees the same data
- ✅ Simpler setup and workflow
- ✅ No need to sync databases between teammates
- ✅ Visible in Supabase Dashboard at supabase.com

### Setup:

**1. Get your cloud connection string**

Your team lead should provide the `DATABASE_URL`. It looks like:
```
postgresql+psycopg://postgres.xxxxx:PASSWORD@aws-x-region.pooler.supabase.com:5432/postgres?sslmode=require
```

**2. Configure `server/.env`**
```env
# Cloud Supabase (Production/Shared)
DATABASE_URL=postgresql+psycopg://postgres.fribbifjqylrrrgrquso:team8.ecopoints_2526@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require

# Other config...
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=1
FRONTEND_URL=http://localhost:3000
```

**3. Initialize database (if needed)**
```bash
cd server

# Only if tables don't exist yet:
flask db upgrade

# Only if database is empty:
python seed.py
```

**4. View your data**

Go to **Supabase Dashboard** → **Table Editor** to see all your data.

### When to use Cloud Supabase:
- Daily development work
- Testing features with the team
- When you need to share data with teammates
- Production deployment

---

## 💻 Local Supabase (For Experimentation)

> [!TIP]
> **Use this for safe experimentation.**
> Runs a **completely separate local database** on your machine using Docker.
> Does **NOT** affect the cloud database and is **NOT visible** in your Supabase dashboard.

### Advantages:
- ✅ Safe to experiment without affecting the team
- ✅ Test risky migrations before running on cloud
- ✅ Work offline
- ✅ Fast reset and cleanup

### Prerequisites:
- **Docker Desktop** must be installed and running
- Download: https://docs.docker.com/desktop/install/windows-install/

### Setup:

**1. Start Docker Desktop**
- Open Docker Desktop application
- Wait for it to fully start (whale icon in system tray should be steady)

**2. Initialize Local Supabase**
```bash
# From the root directory (not inside server/ or client/)
npx supabase init
npx supabase start
```

This will output URLs including:
- **API URL**: http://localhost:54321
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323 ← **Open this to view your local data!**

**3. Configure `server/.env` for local**

Update your `DATABASE_URL` temporarily:
```env
# Local Supabase (Experimentation)
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres

# Other config stays the same...
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=1
FRONTEND_URL=http://localhost:3000
```

> [!IMPORTANT]
> You must add `+psycopg` to the URL so Flask can use the correct driver.

**4. Initialize local database**
```bash
cd server
flask db upgrade
python seed.py
```

**5. View your local data**

**Option A: Supabase Studio (Recommended)**
Open **http://localhost:54323** in your browser. This is a local version of the Supabase dashboard!

**Option B: Database GUI Tools**
Use pgAdmin, DBeaver, or TablePlus with these credentials:
- Host: `127.0.0.1`
- Port: `54322`
- User: `postgres`
- Password: `postgres`
- Database: `postgres`

**6. Stop Local Supabase (When Done)**
```bash
npx supabase stop
```

**7. Switch back to Cloud**

When you're done experimenting, update `server/.env` back to the cloud URL:
```env
DATABASE_URL=postgresql+psycopg://postgres.fribbifjqylrrrgrquso:team8.ecopoints_2526@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### When to use Local Supabase:
- Testing risky database migrations
- Experimenting with breaking changes
- Learning and exploring without affecting the team
- Working offline

### Local Supabase Commands:

```bash
# Start local Supabase
npx supabase start

# Check status and get URLs
npx supabase status

# Stop local Supabase
npx supabase stop

# Reset local database (delete all data and start fresh)
npx supabase db reset

# View logs
npx supabase logs
```

---

## 🔄 Switching Between Cloud and Local

### Quick Reference:

**To use Cloud Supabase:**
```env
# server/.env
DATABASE_URL=postgresql+psycopg://postgres.fribbifjqylrrrgrquso:...@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**To use Local Supabase:**
```env
# server/.env
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres
```

> [!NOTE]
> After changing `DATABASE_URL`, restart your Flask server (`python run.py`) for changes to take effect.

---

## 📊 Database Comparison

| Feature | Cloud Supabase | Local Supabase |
|---------|----------------|----------------|
| **Setup** | Simple - just connection string | Requires Docker Desktop |
| **Data Sharing** | Shared with team | Only on your machine |
| **Visible in Dashboard** | ✅ Yes | ❌ No (use localhost:54323) |
| **Internet Required** | ✅ Yes | ❌ No |
| **Safe for Experiments** | ⚠️ Affects team | ✅ Completely isolated |
| **Best For** | Daily development | Testing & experimentation |

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
| `relation "users" already exists` | Tables already exist in DB | Run `flask db upgrade` on a clean DB |
| `SSL connection required` | Missing `?sslmode=require` in URL | Add `?sslmode=require` to the end of `DATABASE_URL` |
| Long path error during `pip install` | Windows 260-char path limit | Enable long paths or use a virtual environment |
| `'flask' is not recognized` | Flask not on system PATH | Use `python -m flask` instead of `flask` |
| `seed.py fails / duplicate key` | Database already seeded | Only run seed script on an empty database |

---

# 🎉 Final Note

> Both servers must run simultaneously for the app to work:
> - **Backend:** `http://localhost:5000` (Flask)
> - **Frontend:** `http://localhost:3000` (Next.js)

**Happy Coding! ♻️**


---

# 🧹 Cleaning Test Data (Preparing for Real Data)

> [!WARNING]
> **DANGER ZONE**: These commands will **permanently delete all data** from your database tables.
> Only use this when you're ready to transition from test data to real production data.

## When to Use This

- Transitioning from development/testing phase to production
- Removing all seeded test data before real users start using the system
- Cleaning up after testing to start fresh with real data

## ⚠️ Before You Run This Script

1. **Backup your database** (if there's any data you want to keep)
2. **Coordinate with your team** - make sure everyone knows you're cleaning the database
3. **Verify you're connected to the correct database** - check your Supabase dashboard URL
4. **Double-check** - there's no undo button!

---

## Using Supabase SQL Editor

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the following SQL script:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- EcoPoints Database Cleanup Script
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ⚠️  WARNING: This will DELETE ALL DATA from all tables!
-- 
-- Use this when transitioning from test data to production data.
-- Make sure you have a backup before running this script.
--
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- Group 6: Token Management & Security (No foreign keys - clean first)
-- ═══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE token_blacklist CASCADE;
TRUNCATE TABLE login_attempts CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Group 5: Notifications & Alerts
-- ═══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE notification_logs CASCADE;
TRUNCATE TABLE notification_settings CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Group 4: Audit Trail
-- ═══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE admin_logs CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Group 3: Economy (Points & Rewards) - Child tables first
-- ═══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE bulk_deposits CASCADE;
TRUNCATE TABLE reward_redemptions CASCADE;
TRUNCATE TABLE reward_variants CASCADE;
TRUNCATE TABLE rewards CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Group 2: Hardware & IoT (RVM Operations) - Child tables first
-- ═══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE recycling_items CASCADE;
TRUNCATE TABLE recycling_sessions CASCADE;
TRUNCATE TABLE maintenance_logs CASCADE;
TRUNCATE TABLE rvms CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Group 1: Multi-Tenant Identity (The Core) - Child tables first
-- ═══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE otp_codes CASCADE;
TRUNCATE TABLE user_security CASCADE;
TRUNCATE TABLE wallet CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE community_groups CASCADE;
TRUNCATE TABLE org_contact CASCADE;
TRUNCATE TABLE org_address CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE org_types CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Reset Auto-Increment Sequences (Optional - starts IDs from 1 again)
-- ═══════════════════════════════════════════════════════════════════════════

-- Group 1: Identity
ALTER SEQUENCE org_types_id_seq RESTART WITH 1;
ALTER SEQUENCE organizations_id_seq RESTART WITH 1;
ALTER SEQUENCE org_address_id_seq RESTART WITH 1;
ALTER SEQUENCE org_contact_id_seq RESTART WITH 1;
ALTER SEQUENCE community_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE wallet_id_seq RESTART WITH 1;
ALTER SEQUENCE user_security_id_seq RESTART WITH 1;
ALTER SEQUENCE otp_codes_id_seq RESTART WITH 1;

-- Group 2: Hardware & IoT
ALTER SEQUENCE rvms_id_seq RESTART WITH 1;
ALTER SEQUENCE recycling_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE recycling_items_id_seq RESTART WITH 1;
ALTER SEQUENCE maintenance_logs_id_seq RESTART WITH 1;

-- Group 3: Economy
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE rewards_id_seq RESTART WITH 1;
ALTER SEQUENCE reward_variants_id_seq RESTART WITH 1;
ALTER SEQUENCE reward_redemptions_id_seq RESTART WITH 1;
ALTER SEQUENCE bulk_deposits_id_seq RESTART WITH 1;

-- Group 4: Audit Trail
ALTER SEQUENCE admin_logs_id_seq RESTART WITH 1;

-- Group 5: Notifications
ALTER SEQUENCE notification_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE notification_logs_id_seq RESTART WITH 1;

-- Group 6: Security
ALTER SEQUENCE token_blacklist_id_seq RESTART WITH 1;
ALTER SEQUENCE login_attempts_id_seq RESTART WITH 1;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification: Check all tables are empty
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'org_types' AS table_name, COUNT(*) AS row_count FROM org_types
UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL SELECT 'org_address', COUNT(*) FROM org_address
UNION ALL SELECT 'org_contact', COUNT(*) FROM org_contact
UNION ALL SELECT 'community_groups', COUNT(*) FROM community_groups
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'wallet', COUNT(*) FROM wallet
UNION ALL SELECT 'user_security', COUNT(*) FROM user_security
UNION ALL SELECT 'otp_codes', COUNT(*) FROM otp_codes
UNION ALL SELECT 'rvms', COUNT(*) FROM rvms
UNION ALL SELECT 'recycling_sessions', COUNT(*) FROM recycling_sessions
UNION ALL SELECT 'recycling_items', COUNT(*) FROM recycling_items
UNION ALL SELECT 'maintenance_logs', COUNT(*) FROM maintenance_logs
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'rewards', COUNT(*) FROM rewards
UNION ALL SELECT 'reward_variants', COUNT(*) FROM reward_variants
UNION ALL SELECT 'reward_redemptions', COUNT(*) FROM reward_redemptions
UNION ALL SELECT 'bulk_deposits', COUNT(*) FROM bulk_deposits
UNION ALL SELECT 'admin_logs', COUNT(*) FROM admin_logs
UNION ALL SELECT 'notification_settings', COUNT(*) FROM notification_settings
UNION ALL SELECT 'notification_logs', COUNT(*) FROM notification_logs
UNION ALL SELECT 'token_blacklist', COUNT(*) FROM token_blacklist
UNION ALL SELECT 'login_attempts', COUNT(*) FROM login_attempts
ORDER BY table_name;
```

4. Click **Run** or press `Ctrl+Enter`
5. Check the results - all tables should show `row_count = 0`

---

## After Cleaning

Once the database is clean, you can:

1. **Keep the tables** - they're ready for real data
2. **Add production data** - through the app or admin panel
3. **Re-seed if needed** - run `python seed.py` to add test data back

---

**🎉 Your database is now clean and ready for production data!**
