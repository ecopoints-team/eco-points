# Whole-System Smoke Test

Preliminary QA check that exercises the post-hardened EcoPoints platform end-to-end via HTTP. Verifies stability, scalability, and critical functionality. Pairs with the human walkthrough in [`docs/manual-test-plan.md`](../../docs/manual-test-plan.md).

## What it covers

| Section | Verifies | Phase |
| --- | --- | --- |
| Pre-flight | Server reachable; deterministic seed loaded | 5 |
| Login + cookies | All 7 roles log in; HttpOnly token + csrf_token cookies set; `/me` returns role + permission_categories | 4B, 2 |
| RBAC matrix | Per-role allow/deny on 16 admin GET endpoints; non-admin universal denial | 0, 2 |
| Mutation contract | CSRF rejection, schema unknown-key rejection, role-hierarchy block, audit-log increment | 4B, 4E, 4H, 2 |
| Force-logout | JWT issued before `force_logout_at` returns 401 `FORCED_LOGOUT`; re-login works | 4C |
| Scalability | Concurrent load probe with p50/p95/p99 latency assertions and failure-rate threshold | — |

**Out of scope** (per rpi-carveout): every `/api/rpi/*` endpoint, HMAC-signed QR validation, per-RVM API keys, nginx security headers (validated on staging).

## Prerequisites

1. Server running:
   ```cmd
   cd server
   .venv\Scripts\python.exe run.py
   ```
2. Seed loaded:
   ```cmd
   cd server
   .venv\Scripts\python.exe -c "from app import create_app; from app.seeder.seed import run_seed; app = create_app(); ctx = app.app_context(); ctx.push(); run_seed()"
   ```
3. Python 3.11+ (the script uses the standard library only — no `pip install` needed).

## Run

```cmd
python tools\smoke\whole_system_smoke.py
```

With custom parameters:

```cmd
python tools\smoke\whole_system_smoke.py --base-url http://localhost:5000 --password SeedPass!23 --load-requests 200 --load-workers 16
```

Skip the load probe (faster; functional checks only):

```cmd
python tools\smoke\whole_system_smoke.py --skip-load
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | All checks passed |
| 1 | At least one check failed (details printed) |
| 2 | Pre-flight failed (server unreachable, seed missing) |

## When to run

- Before tagging a release.
- After re-seeding a staging environment.
- As a sanity check after merging a Phase 4A PR (the script will need updates at that point to add `/api/rpi/*` coverage).
- After every sweeping refactor where the property test suite passes but you want a runtime sanity check.

The script is intentionally small and stdlib-only so it works on a fresh checkout. For deeper coverage rely on the property tests in `server/tests/property/` and `client/tests/property/`.
