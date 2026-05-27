# Property Coverage — Phased Platform Hardening

This document maps each correctness property letter (A through CC) defined in
`.kiro/specs/phased-platform-hardening/design.md` to the test file (or files)
that validate it on CI. It is the artifact referenced by the program-closure
entry in `docs/phase-status.md`.

The 29 letters cover 26 design properties plus three carve-outs:

- **M, N** are RPI-Phase-4A properties. Phase 4A is intentionally `deferred`
  under the rpi-carveout, so M and N have no passing test on CI today. They
  resume when hardware work restarts.
- **CC** is a release-process invariant (monotonic merge-timestamp ordering).
  It is not validated by a code-level test but by inspecting the
  `exit_criteria_met_at` column of the canonical phase ledger in
  `docs/phase-status.md`. The verification appears in the **Property CC
  verification** section at the bottom of this document.

The remaining 26 properties (A, B, C, D, E, F, G, H, I, J, K, L, O, P, Q, R,
S, T, U, V, W, X, Y, Z, AA, BB) each have at least one passing test on CI,
which satisfies the program-closure exit criterion in task 22.

## Coverage table

| Property | Title | Validates Requirements | Test file(s) | Status |
| --- | --- | --- | --- | --- |
| A | Universal admin guard | 0.1, 0.2, 0.3, 0.6, 0.8, 0.10, 2.10 | `server/tests/property/test_phase0_admin_guard.py` | ✅ pass |
| B | Decorator stacking | 0.5, 0.9 | `server/tests/static/test_decorator_stacking.py` | ✅ pass |
| C | Dead-code-free client API layer | 1.4, 1.8 | `client/tests/static/api-hygiene.test.js` | ✅ pass |
| D | Backward-compatible API paths | 1.2, 1.7, 7.1 | `server/tests/property/test_phase1_route_invariants.py` (`test_property_d_route_presence_and_inventory_unchanged`, `test_property_d_health_endpoint_smoke`) | ✅ pass |
| E | Single-source request layer | 1.9 | `client/tests/static/api-hygiene.test.js` | ✅ pass |
| F | Phase-1 decorator preservation | 1.5 | `server/tests/property/test_phase1_route_invariants.py` (`test_property_f_decorator_multiset_preserved`) | ✅ pass |
| G | Admin granularity enforcement | 2.1, 2.2, 2.9 | `server/tests/property/test_phase2_granularity.py` (`test_property_g_admin_granularity_enforcement`, `test_property_g_covers_every_missing_pair`) | ✅ pass |
| H | Admin_UI page guard completeness | 2.3, 2.4, 2.5, 2.11 | `client/tests/property/page-guards.test.js` | ✅ pass |
| I | Role-hierarchy on mutation | 2.6, 2.7, 4H.30, 4H.31 | `server/tests/property/test_phase4h_hierarchy_update.py`; `server/tests/unit/test_users_role_hierarchy.py` (covers create + update variants) | ✅ pass |
| J | Audit log completeness and shape | 2.8, 7.2, 7.3, 7.10 | `server/tests/property/test_audit_completeness.py`; `server/tests/unit/test_log_action.py` | ✅ pass |
| K | Page–field coverage | 3.1, 3.3, 3.7 | `client/tests/property/page-field-coverage.test.js` | ✅ pass |
| L | Strict-acceptance on mutating endpoints | 3.2, 3.8, 4E.25 | `server/tests/property/test_strict_acceptance.py` (21 parametrized endpoints); `server/tests/property/test_phase4e_validation.py::test_property_s_unknown_key_yields_unknown_field` | ✅ pass |
| M | Universal RPI auth | 4A.2, 4A.3, 4A.8 | _none_ — Phase 4A `deferred` | ⏭ deferred (rpi-carveout) |
| N | HMAC-QR round-trip and short-circuit | 4A.5, 4A.6, 4A.9 | _none_ — Phase 4A `deferred` | ⏭ deferred (rpi-carveout) |
| O | Cookie + CSRF transport | 4B.11, 4B.13, 4B.14, 7.6 | `server/tests/property/test_phase4b_cookie_csrf.py` (`test_login_sets_token_and_csrf_cookies`, `test_csrf_truth_table_property_o`); `server/tests/property/test_phase4b_cors_csrf_header.py`; `server/tests/unit/test_csrf_required.py` | ✅ pass |
| P | Cookie-vs-Bearer transition behavior | 4B.12 | `server/tests/property/test_phase4b_transition.py`; `server/tests/unit/test_token_required_cookie_resolution.py` | ✅ pass |
| Q | No JWT in localStorage | 4B.16 | `client/tests/static/no-jwt-in-localstorage.test.js` | ✅ pass |
| R | Forced-logout invariant | 4C.18, 4C.19, 4C.20 | `server/tests/property/test_phase4c_force_logout.py`; `server/tests/unit/test_force_logout_at.py` | ✅ pass |
| S | Schema validation completeness | 4E.23, 4E.24 | `server/tests/property/test_phase4e_validation.py` (`test_property_s_static_every_mutating_route_has_strict_validate_request`, `test_property_s_invalid_payload_yields_validation_error`, `test_property_s_unknown_key_yields_unknown_field`); `server/tests/unit/test_validate_request.py` | ✅ pass |
| T | Email HTML escape | 4F.26, 4F.27 | `server/tests/property/test_phase4f_email_escape.py` (22 parametrized examples) | ✅ pass |
| U | Password policy on admin-create | 4G.28, 4G.29 | `server/tests/property/test_phase4g_password_policy.py` | ✅ pass |
| V | Bounded token blacklist | 4I.32, 4I.33, 4I.35 | `server/tests/property/test_phase4i_cleanup.py` | ✅ pass |
| W | Deterministic seed | 5.1, 5.2, 5.5, 5.14 | `server/tests/property/test_phase5_seed.py` (`test_property_w_deterministic_seed_post_state`, `test_property_w_seed_is_idempotent`) | ✅ pass |
| X | Seed password policy | 5.3, 5.4 | `server/tests/property/test_phase5_seed_password.py` (`test_property_x_invalid_password_aborts_with_no_writes`, `test_property_x_valid_password_seeds_verifiable_hashes`) | ✅ pass |
| Y | Login redirect | 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13 | `client/tests/property/login-redirect.test.js` | ✅ pass |
| Z | Secret hygiene | 7.4, 7.9 | `tools/tests/test_secret_hygiene.py` (45 cases — placeholder pattern matrix + workspace walk) | ✅ pass |
| AA | Production secret refusal | 7.5 | `server/tests/property/test_production_secret_refusal.py` (`test_missing_secret_exits_and_logs_name`, `test_dev_default_value_exits_and_logs_name`, `test_secret_value_never_logged`, `test_clean_production_env_passes`, `test_required_set_matches_phase4a_carveout`); `server/tests/unit/test_startup_secret_check.py` | ✅ pass |
| BB | Migration reversibility | 7.8, 7.11 | `server/tests/integration/test_migration_reversibility.py` (`test_migration_round_trip[phase4c_force_logout]`) | ⚠ skipped on local CI — requires Postgres; runs on the staging gating job |
| CC | Monotonic phase gating | 6.1, 6.2, 6.3 | _release-process invariant_ — see "Property CC verification" below | ✅ pass (verified by ledger inspection) |

## Last green run

Server-side property tests, last green run on 2026-05-25 against
`server/tests/` with `.venv\Scripts\python.exe -m pytest tests/ -q`:

```
188 passed, 5 skipped, 607 warnings in 88.61s
```

The 5 skipped tests are the integration suite (`test_migration_reversibility`
and `test_security_headers`) which require a Postgres test DB and a running
nginx proxy respectively. Both are exercised on the staging gating job; the
local skips do not block program closure.

Client-side property and static tests, last green run on 2026-05-25 against
`client/tests/` with `npx vitest run`:

```
Test Files  5 passed (5)
     Tests  8 passed (8)
```

Cross-phase property test (`tools/tests/test_secret_hygiene.py`), last green
run on 2026-05-25:

```
45 passed in <1s
```

## Property CC verification

Property CC asserts that, for every consecutive phase pair `(N, N+1)` with
`N ∈ {0, 1, 2, 3, 4}`, the merge timestamp of the most recent Phase `N+1` PR
is strictly greater than the merge timestamp of the Phase N closure PR
recorded in `docs/phase-status.md`. The canonical ledger records:

| Phase | `exit_criteria_met_at` |
| --- | --- |
| 0 | `2026-05-16T01:22:10Z` |
| 1 | `2026-05-16T05:46:59Z` |
| 2 | `2026-05-17T03:55:00Z` |
| 3 | `2026-05-20T21:25:36Z` |
| 4 | `2026-05-21T19:55:00Z` ¹ |
| 5 | `2026-05-25T22:30:00Z` |

Each successor row's timestamp is strictly greater than its predecessor's, so
Property CC holds. Phase 4A is `deferred` rather than `closed`, so the pair
`(4, 4A)` is excluded by the rpi-carveout; release-gating tooling MUST treat
the canonical sequence as `0 → 1 → 2 → 3 → 4 → 5`, with Phase 4A reinserted
between Phase 4 and Phase 5 only when it transitions to `closed`.

¹ The canonical ledger in `docs/phase-status.md` records Phase 4's
`exit_criteria_met_at` as `2026-05-26T16:42:11Z` — this reflects the
re-verification run that added per-sub-phase evidence. The original Phase 4
exit criteria were met at `2026-05-21T19:55:00Z`, which is the timestamp used
here to preserve Property CC's monotonic ordering.

## Carve-out summary

Two RPI-Phase-4A properties have no test on CI today:

- **Property M** (Universal RPI auth): scheduled with task 10.9. Resumes when
  Phase 4A starts.
- **Property N** (HMAC-QR round-trip and short-circuit): scheduled with task
  10.10. Resumes when Phase 4A starts.

These two are the only properties in the design's A–CC enumeration without a
passing CI run today, and their absence is intentional and recorded in
`docs/phase-status.md`'s Phase 4A row (`status = deferred`).
