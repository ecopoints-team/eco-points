# ♻️ EcoPoints – Local Setup Guide

## 🎯 Introduction
Welcome to the **EcoPoints Capstone Project**!  
This guide will walk you through setting up the project on your local machine — covering environment files, dependencies, and database initialization for both the **server** (Flask) and **client** (Next.js).

---

# 📁 Project Structure

```
eco-points/
├── client/          ← Next.js frontend
├── server/          ← Flask backend
├── .env.example     ← Root env template (for Docker)
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

## 3️⃣ Set Up Environment File

Download the example env file in discord General Channel and fill in your values:

```env
# For local development (SQLite - no Postgres needed)
# Leave DATABASE_URL commented out to use the local SQLite file
# DATABASE_URL=postgresql+psycopg2://user:password@host:5432/ecopoints

SECRET_KEY=generate-a-random-key-here
FLASK_APP=run.py
FLASK_ENV=development
CORS_ORIGINS=http://localhost:3000
```

> 💡 **Tip:** Generate a secure `SECRET_KEY` with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

> ⚠️ **SQLite vs PostgreSQL:**  
> - Leave `DATABASE_URL` **commented out** → uses local `ecopoints.db` (SQLite). No Postgres needed. ✅  
> - Uncomment and set `DATABASE_URL` → connects to a PostgreSQL server.

---

## 4️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

If you get a **Windows long path error** during install:

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

**Delete any existing database file first (fresh setup):**
```bash
# Windows
del ecopoints.db

# Mac/Linux
rm -f ecopoints.db
```

**Run migrations to create all tables:**
```bash
python -m flask db upgrade
```

**Seed the database with test data:**
```bash
python seed.py
```

> 🔑 After seeding, all test accounts use the password: **`test123`**

---

## 6️⃣ Run the Server

```bash
python run.py
```

The server will start at **http://localhost:5000**

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

## 3️⃣ Set Up Environment File

Create a `.env.local` file in the `client/` directory:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

Then open `client/.env.local` and configure it:

```env
NEXT_PUBLIC_REWARDS_DOMAIN=http://localhost:5000
```

> For production, replace with your actual API server URL.

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

The app will start at **http://localhost:3000**

---

# ✅ Full Setup Checklist

### Server
- [ ] Python 3.10+ installed
- [ ] `server/.env` created and configured
- [ ] `pip install -r requirements.txt` ran successfully
- [ ] `python -m flask db upgrade` ran successfully
- [ ] `python seed.py` ran successfully
- [ ] `python run.py` starts without errors

### Client
- [ ] Node.js 18+ installed
- [ ] `client/.env.local` created and configured
- [ ] `npm install` ran successfully
- [ ] `npm run dev` starts without errors

---

# 🆘 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `No module named 'flask'` | Dependencies not installed | Run `pip install -r requirements.txt` |
| `'next' is not recognized` | Node modules not installed | Run `npm install` |
| `No module named 'psycopg2'` | `DATABASE_URL` set to PostgreSQL but driver missing | Comment out `DATABASE_URL` in `.env` to use SQLite |
| `table cities already exists` | Old database file out of sync | Delete `ecopoints.db` and re-run `flask db upgrade` |
| Long path error during `pip install` | Windows 260-char path limit | Enable long paths or use a virtual environment |
| `'flask' is not recognized` | Flask not on system PATH | Use `python -m flask` instead of `flask` |

---

# 🎉 Final Note

> Both servers must be running simultaneously for the app to work:  
> - **Backend:** `http://localhost:5000` (Flask)  
> - **Frontend:** `http://localhost:3000` (Next.js)

**Happy Coding! ♻️**
