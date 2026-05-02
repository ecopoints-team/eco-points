# EcoPoints — PostgreSQL Migration & Seeding Guide

> **Stack:** Flask + SQLAlchemy + Flask-Migrate (Alembic) + PostgreSQL

---

## Prerequisites

- PostgreSQL installed and running
- Database `ecopoints` created in pgAdmin
- Virtual environment activated (`venv\Scripts\activate`)
- `.env` configured with `DATABASE_URL`

### Required `.env` entries

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ecopoints
SECRET_KEY=your-random-secret-key-here
FLASK_APP=run.py
FLASK_DEBUG=1
```

> Generate a secure `SECRET_KEY`:
> ```powershell
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

## Scenario 1 — First-Time Setup (Empty PostgreSQL Database)

Run this **once** when setting up the project for the first time.

```powershell
cd server
venv\Scripts\activate

# 1. Delete stale old-schema migrations (based on old SQLite schema)
Remove-Item -Recurse -Force migrations\versions\*

# 2. Generate a fresh migration from current models.py (19-table ERD)
flask db migrate -m "Initial 19-table schema"

# 3. Apply migration — creates all tables in PostgreSQL/pgAdmin
flask db upgrade

# 4. Seed the database with sample data
python seed.py
```

After `flask db upgrade`, refresh pgAdmin — all 21 tables will appear.

---

## Scenario 2 — Wipe Data and Re-Seed (Keep Schema)

Use this when you want to **clear all rows and re-populate** without touching the table structure.

```powershell
cd server
venv\Scripts\activate

python seed.py
```

`seed.py` automatically calls `db.drop_all()` → `db.create_all()` → seeds all 19 tables fresh.

### Wipe only (no re-seed, leave tables empty)

```powershell
flask shell
```
```python
from app import db
db.drop_all()
db.create_all()
exit()
```

---

## Scenario 3 — After a pgAdmin Hard Reset (Database Dropped or Recreated Empty)

### If migration file still exists (most common):

```powershell
cd server
venv\Scripts\activate

# Re-apply existing migration to the new empty database
flask db upgrade

# Re-seed
python seed.py
```

### If migration file is missing or corrupted:

```powershell
cd server
venv\Scripts\activate

# Regenerate migration from models.py
Remove-Item -Recurse -Force migrations\versions\*
flask db migrate -m "Initial 19-table schema"
flask db upgrade

python seed.py
```

---

## Scenario 4 — Model Schema Changed (Added/Removed Columns or Tables)

After editing `models.py`, generate and apply a new incremental migration:

```powershell
cd server
venv\Scripts\activate

# Detect changes and generate migration
flask db migrate -m "Describe what changed"

# Apply to database
flask db upgrade
```

> To undo the last migration:
> ```powershell
> flask db downgrade
> ```

---

## Quick Reference Cheatsheet

| Situation | Commands |
|---|---|
| First-time setup | Delete old migrations → `flask db migrate` → `flask db upgrade` → `python seed.py` |
| Wipe data, re-seed | `python seed.py` |
| Wipe only, no re-seed | `flask shell` → `db.drop_all()` + `db.create_all()` |
| pgAdmin hard reset, migration exists | `flask db upgrade` → `python seed.py` |
| pgAdmin hard reset, no migration | Delete migrations → `flask db migrate` → `flask db upgrade` → `python seed.py` |
| Schema changed in models.py | `flask db migrate -m "message"` → `flask db upgrade` |
| Undo last migration | `flask db downgrade` |

---

## Seeded Credentials

After running `python seed.py`:

| Account | Username | Password |
|---|---|---|
| Super Admin | `sysadmin` | `test123` |
| All other users | *(their username)* | `test123` |

---

## Troubleshooting

### `RuntimeError: DATABASE_URL environment variable is not set`
→ Add `DATABASE_URL=postgresql://...` to `server/.env` and restart.

### `ERROR: relation "alembic_version" does not exist`
→ Database was wiped. Run `flask db upgrade` to reapply migrations.

### `Target database is not up to date`
→ Run `flask db upgrade` to apply pending migrations.

### `FATAL: password authentication failed for user "postgres"`
→ Check your password in `DATABASE_URL`. Reset via pgAdmin if needed.

### `Connection refused` on port 5432
→ PostgreSQL service isn't running. Open **Services** on Windows and start **postgresql-x64-XX**.

### `Table already exists` error during migration
→ Run `flask db stamp head` to tell Alembic the DB is already at the latest version.

```powershell
flask db stamp head
```
