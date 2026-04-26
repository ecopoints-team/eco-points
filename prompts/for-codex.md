---
description: Security Audit Differential Analysis
globs: security_audit.md, server/app/**/*.py
alwaysApply: false
---

# Task: Audit Status Verification

You are acting purely as a security auditor. Your task is to cross-reference the provided `security_audit.md` with the current, live state of the Python codebase.

**CRITICAL CONSTRAINT: DO NOT WRITE, FIX, OR MODIFY ANY CODE.**

# Instructions

1. **Scan the Codebase:** Inspect the current state of `models.py`, `middleware.py`, `controllers/*.py`, and `services/*.py`.
2. **Cross-Reference:** Compare the actual code against the claims made in the `security_audit.md` document (pay special attention to the "TOP 5 FIXES" and "WHAT IS LACKING" sections).
3. **Determine Status:** Check if the "Current" state described in the audit still exists, or if the "Better" mitigation has already been implemented.

# Output Format

Generate a concise Markdown report detailing the current reality of the codebase. Stop generating after the report is complete. Structure your output exactly like this:

## ✅ RESOLVED (Fixed)

_(List the issues from the audit that are no longer present in the codebase. Briefly cite the line/file that proves it is fixed.)_

## ⚠️ PARTIAL OR CHANGED

_(List issues where the code has changed from the audit's description, but the vulnerability isn't fully mitigated yet.)_

## ❌ STILL ACTIVE (Needs Fixing)

_(List the critical gaps that still exactly match the vulnerable state described in the old audit.)_

---

# Latest Findings (2026-04-26, Website and Admin Scope)

## ✅ RESOLVED (Fixed)

- None of the website and admin items in TOP 5 FIXES and WHAT IS LACKING are fully resolved yet.

## ⚠️ PARTIAL OR CHANGED

- Rate limiting is stronger than the original baseline: explicit limits now exist on login, verify-otp, and register at [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L176), [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L265), and [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L470). A broad global default still applies at [server/app/**init**.py](server/app/__init__.py#L14).
- RBAC has stronger guardrails in some admin flows: superadmin-only routes exist at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L416), and role hierarchy checks are enforced during user create/update at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L727) and [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L837). However, [permission_required](server/app/middleware.py#L106) is still defined but not applied on controller routes.
- Validation has improved in selected website/admin endpoints but is not centralized: userType allowlist and role restriction in public registration at [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L485-L487) and [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L541), plus bounded security settings at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L2691-L2694).

## ❌ STILL ACTIVE (Needs Fixing)

- JWT is still returned in JSON body (not HttpOnly cookie) at [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L258) and [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L317); middleware still expects Authorization Bearer token at [server/app/middleware.py](server/app/middleware.py#L44-L46).
- No refresh token flow is present in the current auth controller implementation.
- Password hashing method is still not pinned to bcrypt or argon2id; default Werkzeug helpers remain in use at [server/app/models.py](server/app/models.py#L185) and [server/app/models.py](server/app/models.py#L190).
- Route-level granular permission enforcement is still missing in controllers; current routes rely on admin and superadmin decorators such as [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L323) and [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L416), while [permission_required](server/app/middleware.py#L106) remains unused.
- No centralized request validation layer is implemented; validation is still mostly inline checks (example at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L735)).
- Notification email content is still interpolated without HTML escaping in [server/app/services/notification_service.py](server/app/services/notification_service.py#L135) and [server/app/services/notification_service.py](server/app/services/notification_service.py#L146).
- Security headers remain absent in Nginx configuration (no CSP, HSTS, X-Frame-Options, or nosniff) in [nginx/default.conf](nginx/default.conf).
- CSRF protection is still not present in backend code while credentialed CORS is enabled at [server/app/**init**.py](server/app/__init__.py#L71).
- OTP storage is still in-memory in [server/app/services/otp_service.py](server/app/services/otp_service.py#L15).
- Force logout remains non-functional for token invalidation; endpoint only logs event and returns success at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L2733-L2735).
- No token blacklist cleanup routine is present; blacklist insert and check still exist at [server/app/controllers/auth_controller.py](server/app/controllers/auth_controller.py#L348-L350) and [server/app/middleware.py](server/app/middleware.py#L61-L62).
- Admin-created user password complexity is still not enforced; only presence is checked at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L735) before hashing at [server/app/controllers/web_controller.py](server/app/controllers/web_controller.py#L784).
