# EcoPoints — Full System Audit

**Date:** 2026-06-16
**Scope:** Backend (Flask), Frontend (Next.js), CI/CD, deployment, security posture
**Question answered:** Is the current system capstone-demo reliable?

---

## Verdict (TL;DR)

**Yes — the system is capstone-demo reliable, with one operational caveat to manage on demo day (Render free-tier cold starts).**

The codebase is in unusually good shape for a capstone: a hardened security model verified by 228 automated tests, a working CI pipeline, and live deployments on Render + Cloudflare Pages + Supabase. The remaining items are either low-priority hardening (safe to skip for a capstone) or quick config toggles.

**Overall grade for capstone readiness: A-.**

---

## 1. Test Coverage

| Suite | Result |
| --- | --- |
| Server (`pytest`, excl. integration) | **228 passed, 0 failed** |
| Server integration (needs Postgres) | 5 deselected (run manually) |
| Tools (secret hygiene) | 45 passed |
| Client (vitest) | 8 passed (5 files) |

The server suite includes **Hypothesis property-based tests** — these check security invariants across hundreds of generated inputs, not just hand-picked cases. That is stronger evidence of correctness than typical capstone test suites.

---

## 2. Security Posture

A multi-phase hardening program (Phases 0–5 + 4A) is complete and verified. Confirmed protections:

| Area | Status |
| --- | --- |
| RBAC — granular per-category permissions across all admin routes | ✅ Enforced + property-tested |
| Admin GET-bypass bug (non-admins reading admin data) | ✅ Fixed |
| JWT in HttpOnly cookie (not localStorage) | ✅ |
| CSRF double-submit protection on unsafe methods | ✅ Property-tested |
| RPI/hardware endpoint authentication (API key + HMAC-signed QR) | ✅ |
| Email template XSS escaping | ✅ Property-tested |
| Password policy on admin-created users | ✅ |
| Force-logout (session invalidation) | ✅ |
| Token blacklist + cleanup job | ✅ |
| Production refuses to start on missing/dev-default secrets | ✅ |
| SQL injection | ✅ None (pure ORM) |
| Password hashing pinned to scrypt (this session) | ✅ |
| Rate limit on change-password (this session) | ✅ |
| Email via Resend API, Gmail app password retired (this session) | ✅ |

No hardcoded secrets in source (enforced by the tools test in CI).

---

## 3. CI/CD Pipeline

| Component | Status |
| --- | --- |
| GitHub Actions — server, tools, client jobs | ✅ Green on every push/PR |
| Render auto-deploy (Flask backend) | ⚙️ Enable toggle (see deployment-pipeline.md) |
| Cloudflare Pages auto-deploy (Next.js) | ✅ Default on |
| Branch protection on `main` | ⚙️ Requires GitHub Team plan or public repo |

Backend health check (`https://api.ecopoints.org/api/web/health`) returns
`{"status":"healthy","success":true}` — **live and functional**.

---

## 4. Architecture

| Layer | State |
| --- | --- |
| Controllers | 16 domain controllers (split from a former 2,870-line monolith in Phase 1) |
| Models | Clean SQLAlchemy ORM |
| Middleware | Auth, RBAC, CSRF, rate limiting |
| Validation | Pydantic schemas via `@validate_request` |
| Services | Partial (notification, OTP) — no full service/repository layer |

The controller decomposition is already better-separated than most production Flask apps.

---

## 5. Infrastructure

| Layer | Service | Status |
| --- | --- | --- |
| Frontend | Cloudflare Pages | ✅ Live (`ecopoints.org`) |
| Backend | Render (gunicorn) | ✅ Live (`api.ecopoints.org`) |
| Database | Supabase PostgreSQL | ✅ Live |
| Email | Resend API | ✅ Configured |
| DNS/CDN/TLS | Cloudflare | ✅ Active |

Operational runbooks now exist: DB backup/restore, secret rotation, staging, origin TLS (`docs/runbooks/`).

---

## 6. Known Gaps & Risks

### 🟠 Demo-day operational risk (MANAGE THIS)
- **Render free-tier cold start.** The backend sleeps after ~15 min idle; the first request then takes 30–60s and can time out. **Mitigation:** hit `https://api.ecopoints.org/api/web/health` 1–2 minutes before the demo to wake it, or upgrade to a paid Render instance for the demo window.

### 🟡 Quick config toggles (recommended before demo)
- **HSTS header is not present** on either `ecopoints.org` or `api.ecopoints.org` in production (the nginx config that adds it is not the live path). Enable at Cloudflare → SSL/TLS → Edge Certificates → HSTS.
- **Cloudflare SSL/TLS mode** should be **Full (strict)** (verify it is not "Flexible"). See `docs/runbooks/origin-tls.md`.

### 🟢 Low priority — safe to skip for capstone
- Refresh tokens (current 24h HttpOnly cookie is already secure; this only narrows a theft window).
- Observability / error tracking (Render logs suffice at demo scale).
- Service/repository refactor (working code; refactor risk > reward for a deadline).
- Branch protection enforcement (needs paid plan; rely on team discipline meanwhile).

---

## 7. Recommendation Summary

| Action | Priority | Effort |
| --- | --- | --- |
| Wake backend before demo (or pay for the demo window) | 🔴 Demo-critical | 1 min |
| Enable HSTS + Full (strict) at Cloudflare | 🟡 Recommended | 5 min |
| Enable Render auto-deploy on `main` | 🟡 Recommended | 2 min |
| Refresh tokens / observability / service layer | 🟢 Post-capstone | — |

**Bottom line:** the system is solid and demo-ready. The only thing that can embarrass you on demo day is the Render cold start — manage that and you're in great shape.
