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
