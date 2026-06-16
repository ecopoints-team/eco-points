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
