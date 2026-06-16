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
