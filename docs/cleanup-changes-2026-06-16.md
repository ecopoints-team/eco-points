# Proposed Cleanup Changes — Compilation

**Date:** 2026-06-16
**Status:** Decisions captured — NOT yet implemented. Each item needs a spec/plan before code changes.

This document compiles the simplification/removal changes discussed so the team
has a single reference before implementation. Nothing here is built yet.

---

## 1. Remove configurable Points Config → use fixed points

**Decision:** Points per bottle are FIXED, not admin-configurable. Remove the
points-config UI and its endpoints; replace with a single fixed constant.

**Why:** The product uses fixed points per bottle; configurability is unused
complexity.

**This is a REPLACE, not a pure delete** — the recycling machines read
points-per-bottle to credit deposits. The fixed values must live in one
source-of-truth constant.

| Layer | What changes |
| --- | --- |
| Source of truth | Make the seeder `BOTTLE_PRICING` constant the single source for points-per-bottle |
| Client | Remove the "points" tab in `client/app/admin/settings/page.js`; remove `getPointsConfig`/`updatePointsConfig` in `client/src/services/api/settings.js` |
| Server (admin) | Remove `GET/PUT /api/web/settings/points`, `get_points_config`/`update_points_config`, `PointsConfigUpdateSchema` |
| Server (RVM) | Point `GET /api/rpi/config/points/<org_id>` at the fixed constant (or retire it if the RVM can hardcode) |
| Data | Stop writing `config_points` rows in `NotificationSetting` |
| Tests | Update/remove `test_points_config_scope.py`, route snapshot entries, strict-acceptance cases |

**Risk:** If deleted without wiring the constant into the deposit flow, point
crediting breaks. CI will catch this.

---

## 2. Remove SMS (Twilio) → email-only notifications

**Decision:** Notifications and 2FA are EMAIL-ONLY. Remove the SMS/Twilio path.
(Note: there is no SMTP left to remove — email already moved to the Resend API.)

**Why:** Twilio's free trial only texts verified numbers (useless for a live
demo); email-only is simpler and already works via Resend.

| Layer | What changes |
| --- | --- |
| Server | Remove `_send_sms()` and the Twilio import in `notification_service.py` |
| OTP / 2FA | Remove the SMS OTP path in `otp_service.py` (`method == 'sms'`); 2FA becomes email-only |
| Settings | Remove `sms_enabled`/`smsEnabled` from notification settings + channels config |
| Config | Remove `twilio` from `requirements.txt`; remove `TWILIO_*` env vars from `server/.env` and `docker-compose.yml` |
| Startup check | Remove `TWILIO_AUTH_TOKEN` from `OPTIONAL_PRODUCTION_SECRETS` in `__init__.py` + update `test_startup_secret_check.py` and `test_production_secret_refusal.py` |
| Tests | Update notification/channels tests that assert `sms_enabled`/`smsEnabled` |

**Risk:** Any user mid-flow relying on SMS 2FA loses that option. Confirm no
SMS-only accounts exist. CI will catch missed references.

**Possible follow-on simplification:** once SMS is gone, the `config_channels`
toggle is just "email on/off," which the per-alert `email_enabled` flag already
covers — consider collapsing it.

---

## 3. nginx / docker-compose — CONDITIONAL (needs infra confirmation)

**Status: NOT a confirmed removal.** Depends on how Render is configured.

**Clarified facts:**
- **gunicorn + `gunicorn.conf.py` + `server/Dockerfile`** are production-relevant
  (gunicorn is the WSGI server Render runs). **KEEP.**
- TLS is handled by **Cloudflare** (edge cert) and **Render/Cloudflare Pages**
  (origin certs, auto Let's Encrypt). nginx is NOT needed for TLS in this setup.
- `docker-compose.yml` + `nginx/default.conf` are a **local/self-host all-in-one
  stack**. Render does not run docker-compose (no `render.yaml` Blueprint exists).

**Open questions before deciding:**
1. Is the Render backend a **Docker service** (`server/Dockerfile`) or a **Python
   service** with a start command?
2. Is the frontend on **Cloudflare Pages** (built from source) or containerized
   on Render (`client/Dockerfile`)?

**Provisional verdict:** if neither nginx nor docker-compose is in the Render
path, mark them clearly as "local/self-host only" (a header comment) or remove
them — they previously caused confusion (the Origin TLS red herring). Decide
only after the two questions above are answered.

---

## Related pending infra toggles (from the audit, not removals)

These are separate config actions already identified in
`docs/system-audit-2026-06-16.md`:

- Set Cloudflare SSL/TLS mode to **Full (strict)**.
- Enable **HSTS** at Cloudflare → SSL/TLS → Edge Certificates.
- Enable Render **Auto-Deploy** on `main`.
- Warm the Render backend before a demo (free-tier cold start).

---

## Recommended next step

Items 1 and 2 overlap in the settings controller and notification code, so a
single combined spec is efficient:

> **Spec: "Simplify to fixed points + email-only notifications"**

Item 3 stays parked until the two infra questions are answered.
