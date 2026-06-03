# RPi Revisit Checklist (Phase 4A re-entry)

This file tracks every carve-out we accepted while running the web/admin
sprint ahead of Phase 4A. When Phase 4A (tasks 10.1 – 10.10) completes,
walk this list and tick each row. The web sprint cannot be marked
"fully closed" in `docs/phase-status.md` until this checklist is empty.

## Status legend

- `pending` — carve-out is still in effect; revisit when Phase 4A lands.
- `done` — revisit complete; cited in the linked PR / commit.

## Revisit items

| # | Source task | Carve-out applied during web sprint | Revisit action when Phase 4A lands | Status |
| --- | --- | --- | --- | --- |
| 1 | 14.1 — Pydantic schemas | Authored schemas only for `auth_controller` + every Domain_Controller. `rpi_controller` schemas skipped. | Add request schemas for every POST/PUT/PATCH route in `rpi_controller.py` to `server/app/schemas/`. Each schema sets `model_config = ConfigDict(extra='forbid', strict=True)`. | done |
| 2 | 14.3 — Apply `@validate_request` | Decorator applied to web POST/PUT/PATCH handlers only. RPi handlers skipped. | Add `@validate_request(...)` to every `rpi_controller` POST/PUT/PATCH handler. Stack order: `@rpi_auth_required` → `@validate_request(Schema)`. Handler signature accepts `payload` kwarg. | done |
| 3 | 14.4 — Property S | Test enumerates `web_bp` + `auth_bp` only; `rpi_bp` excluded. | Drop the blueprint filter so the test enumerates `rpi_bp` routes too. Re-run `server/tests/property/test_phase4e_validation.py` and confirm green. | done |
| 4 | 20.1 — Seeder RVM step | `RVM` row seeded without `api_key_hash` / `qr_hmac_secret_enc` (the columns do not exist while Phase 4A is deferred). | Reinstate the RVM provisioning step in `server/app/seeder/seed.py`: generate API key, print plaintext to stdout once, store BCrypt hash in `api_key_hash`, seed `qr_hmac_secret_enc`. | done |
| 5 | 20.3 — Property W | The "RVM has non-null `api_key_hash`" assertion was relaxed. | Reinstate the assertion in `server/tests/property/test_phase5_seed.py`. Confirm green against the updated seeder. | done |
| 6 | 21.1 — Startup secret-presence check | Required secret set was `{SECRET_KEY, DATABASE_URL, SMTP password, SMS provider key}` only. `qr_hmac_secret_ref` excluded. | HMAC secret derived from SECRET_KEY via HKDF — no new env var needed. Comment updated in `server/app/__init__.py`. | done |
| 7 | 21.4 — Property AA | Test enumerates the same reduced secret set as 21.1. | No new env var — HMAC secret derived from SECRET_KEY. No test update needed. | done |
| 8 | 21.5 — Property BB | Migration round-trip exercises `phase4c_force_logout` only. | Add `rpi_auth` to the round-trip enumeration in `server/tests/integration/test_migration_reversibility.py`. | done |
| 9 | 19 — Phase 4 closure | Phase 4A row in `docs/phase-status.md` marked `deferred` (not `closed`). The "`docs/rpi-api-contract.md` committed" exit criterion was dropped. | Flip Phase 4A row from `deferred` → `closed` with the full Phase 4A exit-criteria evidence table; reinstate the contract-doc citation. | done |
| 10 | 22 — Final checkpoint | Program closure assertion was relaxed to "every non-deferred phase is `closed`". | Restore the strict assertion: every phase row in `docs/phase-status.md` is `closed`, every property test (A–CC) has at least one passing run, `api_routes_documentation.md` reflects the post-hardened surface. | done |

## Re-entry procedure

1. Run Phase 4A tasks 10.1 → 10.10 to completion.
2. Walk this checklist top to bottom. Each row's "revisit action" describes
   the exact edit; mark it `done` and link the PR/commit in the same row
   (append a column or replace `pending`).
3. Once every row is `done`, update Phase 4A's row in
   `docs/phase-status.md` to `closed` and run the full server + client
   test suites (`pytest tests/` and `npx vitest run`) to confirm every
   property A–CC passes.
4. Run the final smoke test (Task 22).
5. Delete this file (or move it to `docs/archive/` for posterity); it is
   intentionally a transient artifact of the deferral.
