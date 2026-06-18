# Operational Runbooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write practical operational runbooks — database backup/restore, secret rotation, and staging environment setup — so the team can recover from incidents and onboard safely without tribal knowledge.

**Architecture:** Pure documentation, no application code. Each runbook is a focused Markdown file under `docs/runbooks/`. The "test" for a documentation plan is verification that the documented commands are real and correct for this stack (Render + Cloudflare Pages + Supabase + Resend). Each task verifies its commands against the actual tooling where possible before committing.

**Tech Stack:** Markdown. Underlying ops stack: Supabase (PostgreSQL), Render (Flask backend), Cloudflare Pages (Next.js frontend), Resend (email), GitHub (source + CI).

---

## Background the engineer needs

- Hosting: backend on **Render**, frontend on **Cloudflare Pages**, database on **Supabase** (managed PostgreSQL), email via **Resend**.
- Secrets live in `server/.env` locally (gitignored) and as environment variables in the Render dashboard. Current secrets: `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `TWILIO_*`.
- Migrations are run with `flask db upgrade` from the `server/` directory (Flask-Migrate / Alembic).
- There is an existing destructive cleanup SQL script documented in `Guides/EcoPoints_Database_Setup_Guide.md`. Runbooks should reference, not duplicate, it.
- `psql` and `pg_dump` are the standard PostgreSQL CLI tools; Supabase connection strings work with them directly.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `docs/runbooks/README.md` | Index of all runbooks + when to use each | Create |
| `docs/runbooks/db-backup-restore.md` | Back up and restore the Supabase database | Create |
| `docs/runbooks/secret-rotation.md` | Rotate each secret safely without downtime | Create |
| `docs/runbooks/staging-environment.md` | Stand up a staging copy of the stack | Create |

---

### Task 1: Database backup & restore runbook

**Files:**
- Create: `docs/runbooks/db-backup-restore.md`

- [ ] **Step 1: Verify `pg_dump` is available and the connection string format**

Run: `pg_dump --version`
Expected: prints a version like `pg_dump (PostgreSQL) 16.x`. If not installed, the runbook will note the install step (`Supabase Dashboard → Database → Backups` is the no-CLI alternative).

- [ ] **Step 2: Create `docs/runbooks/db-backup-restore.md`**

Create the file with exactly this content:

```markdown
# Runbook: Database Backup & Restore

**Database:** Supabase (managed PostgreSQL). Supabase takes automatic daily
backups on paid plans, but take a manual backup before any risky operation
(migrations, bulk deletes, schema changes).

## Take a manual backup (CLI)

1. Get the connection string from Supabase → Project → Settings → Database →
   Connection string (use the **Direct** connection, port 5432, not the pooler).
2. Dump to a timestamped file:
   ```bash
   pg_dump "postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require" \
     --no-owner --no-privileges \
     -f "ecopoints-backup-$(date +%Y%m%d-%H%M%S).sql"
   ```
3. Store the `.sql` file somewhere safe and OFF your laptop (it contains all
   user data). Never commit it to git.

## Take a backup (no CLI)

Supabase Dashboard → Database → Backups → **Download** the latest backup.

## Restore

> WARNING: Restoring overwrites current data. Take a fresh backup first.

1. (Recommended) Restore into a NEW Supabase project or a local Postgres first
   to verify the dump is good.
2. Restore:
   ```bash
   psql "postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require" \
     -f ecopoints-backup-YYYYMMDD-HHMMSS.sql
   ```
3. Run any pending migrations afterward:
   ```bash
   cd server
   flask db upgrade
   ```

## When to use this

- Before running `flask db upgrade` in production.
- Before the destructive cleanup script in
  `Guides/EcoPoints_Database_Setup_Guide.md`.
- On a fixed schedule if not on a Supabase plan with automatic backups.
```

- [ ] **Step 3: Commit**

```bash
git add docs/runbooks/db-backup-restore.md
git commit -m "docs: add database backup/restore runbook"
```

---

### Task 2: Secret rotation runbook

**Files:**
- Create: `docs/runbooks/secret-rotation.md`

- [ ] **Step 1: Create `docs/runbooks/secret-rotation.md`**

Create the file with exactly this content:

```markdown
# Runbook: Secret Rotation

Rotate a secret when it may have leaked, when a team member with access leaves,
or on a periodic schedule. Secrets live in two places: the Render dashboard
(production) and each developer's local `server/.env` (gitignored).

## General procedure

1. Generate/obtain the new secret value.
2. Update it in Render → your service → Environment → edit the variable → Save.
   Render redeploys automatically with the new value.
3. Update local `server/.env` for every developer (share via your secure channel,
   never via git or chat).
4. Verify the app still works (login, send a test email, etc.).
5. Revoke/disable the OLD secret at its source so it can no longer be used.

## Per-secret notes

### SECRET_KEY (JWT signing)
- Generate: `python -c "import secrets; print(secrets.token_hex(32))"`
- Rotating this **invalidates all existing JWTs** — every user is logged out.
  Do it during low traffic and tell the team.

### RESEND_API_KEY
- Create a new key in the Resend dashboard → API Keys.
- Update Render + local `.env`, verify a test email sends, then DELETE the old
  key in Resend.

### DATABASE_URL (Supabase password)
- Reset the database password in Supabase → Settings → Database.
- Update the full `DATABASE_URL` in Render + local `.env` immediately (the old
  password stops working the moment you reset it — expect brief downtime).

### TWILIO_AUTH_TOKEN
- Rotate in the Twilio console → Account → Auth Tokens (use the secondary-token
  flow to avoid downtime), update Render + local `.env`, then promote.

## After any rotation

- Confirm CI still passes (the secret-hygiene test ensures no secret is
  hardcoded in source): `python -m pytest tools/tests -q`
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbooks/secret-rotation.md
git commit -m "docs: add secret rotation runbook"
```

---

### Task 3: Staging environment runbook

**Files:**
- Create: `docs/runbooks/staging-environment.md`

- [ ] **Step 1: Create `docs/runbooks/staging-environment.md`**

Create the file with exactly this content:

```markdown
# Runbook: Staging Environment

A staging environment is a production-like copy used to test changes before they
reach real users. Mirror the production stack: Render (backend), Cloudflare Pages
(frontend), Supabase (database).

## One-time setup

### Database (Supabase)
- Create a SECOND Supabase project named `ecopoints-staging`.
- Run migrations + seed against it:
  ```bash
  cd server
  # point DATABASE_URL at the staging project for this shell only
  flask db upgrade
  python seed.py
  ```

### Backend (Render)
- Create a second Render service from the same repo, tracking the `dev` branch.
- Set its environment variables to the STAGING values (staging `DATABASE_URL`,
  a separate `SECRET_KEY`, a Resend test key, etc.).
- Enable Auto-Deploy on `dev` so staging always reflects the latest integration
  branch.

### Frontend (Cloudflare Pages)
- Cloudflare Pages already builds **preview deployments** for non-production
  branches automatically. Confirm the `dev` branch produces a preview URL, and
  set its `NEXT_PUBLIC_API_URL` (Pages → Settings → Environment variables, the
  Preview scope) to the staging backend URL.

## Promotion flow

```
feature branch → dev (auto-deploys to STAGING) → test on staging → main (PROD)
```

## Rules

- Staging uses its OWN database and secrets — never point staging at the
  production Supabase project.
- Use Resend's test/sandbox sender for staging so test emails never hit real
  users.
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbooks/staging-environment.md
git commit -m "docs: add staging environment runbook"
```

---

### Task 4: Runbook index

**Files:**
- Create: `docs/runbooks/README.md`

- [ ] **Step 1: Create `docs/runbooks/README.md`**

Create the file with exactly this content:

```markdown
# Operational Runbooks

Step-by-step procedures for operating and recovering the EcoPoints platform.

| Runbook | Use when |
| --- | --- |
| [db-backup-restore.md](db-backup-restore.md) | Before risky DB operations; to recover lost data |
| [secret-rotation.md](secret-rotation.md) | A secret leaked, a team member left, or on schedule |
| [staging-environment.md](staging-environment.md) | Standing up or using the pre-production environment |

## Stack reference

| Layer | Service |
| --- | --- |
| Frontend | Cloudflare Pages |
| Backend | Render (Flask + gunicorn) |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| CI/CD | GitHub Actions + Render/Cloudflare auto-deploy |

See also: `docs/deployment-pipeline.md` and `docs/ci.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbooks/README.md
git commit -m "docs: add runbooks index"
```

---

## Self-Review

**1. Spec coverage:** Gap = "DB backup/restore, secret rotation, staging environment." Task 1 (backup/restore), Task 2 (secret rotation), Task 3 (staging), Task 4 (index tying them together). All three named topics covered. ✅

**2. Placeholder scan:** No TBD/TODO. Each runbook contains concrete commands for this exact stack. Connection-string placeholders like `<user>`/`<password>` are intentional fill-ins for secret values (correct practice — never hardcode real secrets in docs), not plan placeholders. ✅

**3. Type/name consistency:** Service names (Render, Cloudflare Pages, Supabase, Resend) and secret names (`SECRET_KEY`, `RESEND_API_KEY`, `DATABASE_URL`, `TWILIO_AUTH_TOKEN`) match those used in `server/.env`, `docs/deployment-pipeline.md`, and `docs/ci.md`. Cross-references point to files that exist. ✅
