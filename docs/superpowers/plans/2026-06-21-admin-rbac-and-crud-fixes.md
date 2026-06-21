# Admin RBAC, Bulk Sessions, and Logs Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix role-based permission mismatches across the admin dashboard (sidebar visibility, quick-action routing, per-action button gating, server enforcement), repair the Bulk Sessions create 400 and modal-data 500, and optimize the slow Admin (access) logs query.

**Architecture:** The root cause of the RBAC bugs is **two disagreeing permission sources**: the server's category-only map (`server/app/middleware.py::ROLE_PERMISSIONS`, projected to the client as `permission_categories`) and the client's per-verb map (`client/src/data/roleConfig.js::ROLES`). The sidebar and page guards read the server list; action buttons read the client list; they don't match, so buttons appear that lead to blocked pages and actions run that should be denied. This plan makes the **server the single source of truth for per-verb permissions**, projects that structure to the client, drives all UI gating from it, and enforces verbs server-side on mutation endpoints. Bulk Sessions and the logs query are independent, smaller fixes.

**Tech Stack:** Flask + SQLAlchemy + Pydantic v2 (server), Next.js + React (client), pytest + hypothesis (server tests), vitest + fast-check (client tests).

**Three independently-shippable phases** — each leaves the app working and testable on its own:
- **Phase A — Bulk Sessions** (small, deterministic): `walletId` payload fix + surface the hidden 500.
- **Phase B — Admin Logs query optimization** (focused, performance).
- **Phase C — RBAC single-source-of-truth** (large): server per-verb model → client projection → UI gating → server enforcement.

Recommended order: A → B → C. A and B are quick wins that reduce noise before the larger RBAC work.

---

## File Structure

**Phase A — Bulk Sessions**
- Modify: `client/app/admin/bulk-sessions/page.js` — fix the create payload (`walletId`, not `accountId`) and the user dropdown value.
- Modify: `server/app/controllers/sessions_controller.py` — log the real exception before returning the generic 500.
- Modify: `server/app/controllers/users_controller.py` — log the real exception before returning the generic 500.
- Test: `client/tests/property/bulk-session-create-payload.test.js` (new).

**Phase B — Admin Logs optimization**
- Modify: `server/app/controllers/logs_controller.py` — `get_access_logs` query strategy.
- Test: `server/tests/property/test_access_logs_shape.py` (new).

**Phase C — RBAC single source of truth**
- Create: `server/app/permissions.py` — the authoritative `ROLE_ACTION_PERMISSIONS` map + helpers.
- Modify: `server/app/middleware.py` — derive `ROLE_PERMISSIONS` from the new map; extend `permission_required` to accept an optional `action` verb.
- Modify: `server/app/controllers/auth_controller.py` — project per-verb `permissions` into the `/auth/me` payload.
- Modify: mutation endpoints (`users_controller.py`, `machines_controller.py`, `rewards_controller.py`, `sessions_controller.py`) — add verb enforcement to the specific routes QA flagged.
- Modify: `client/src/context/AuthContext.js` — consume server `permissions` instead of the static `roleConfig`.
- Modify: `client/src/data/roleConfig.js` — reduce to display-only metadata (name/color/scope); permissions come from the server.
- Modify: `client/src/components/admin/Sidebar.jsx` — visibility from server `permissions`.
- Modify: `client/app/admin/page.js` — quick-action shortcuts gated by the same source.
- Modify: the five log pages' Export buttons — gate by `logs.export`.
- Modify: `client/app/admin/analytics/page.js` — gate any export by `analytics.export`.
- Test: `server/tests/property/test_role_action_permissions.py` (new), `client/tests/property/permission-gating.test.js` (new).

---

## Phase A — Bulk Sessions

### Task A1: Fix the Bulk Session create payload

**Root cause (confirmed):** The page sends `{ rvmId, accountId, notes, items }`. `BulkSessionCreateSchema` (`server/app/schemas/__init__.py`) declares `rvmId`, `walletId`, `items`, `notes` with `extra='forbid'`. So `accountId` is rejected (`extra_forbidden`) and `walletId` is missing → HTTP 400. Also the user dropdown value uses `u.accountId || u.id`, but `_serialize_user` returns `walletId` (the wallet id the server actually wants) and `id` (the user id) — never `accountId`. The dropdown must use `u.walletId`.

**Files:**
- Modify: `client/app/admin/bulk-sessions/page.js` (dropdown ~line 470 area, submit ~line 196)
- Test: `client/tests/property/bulk-session-create-payload.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/tests/property/bulk-session-create-payload.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// We test the pure payload-mapping contract the page must satisfy:
// the submit handler MUST send { rvmId, walletId, notes, items:[{detectedClass, pointsAwarded}] }
// and MUST NOT send an `accountId` key (server uses extra='forbid').

// Mirror of the mapping the page performs on submit.
function buildBulkPayload({ selectedRvm, selectedWalletId, notes, items }) {
    return {
        rvmId: parseInt(selectedRvm),
        walletId: parseInt(selectedWalletId),
        notes,
        items: items.map(i => ({
            detectedClass: i.detectedClass,
            pointsAwarded: parseInt(i.pointsAwarded) || 0,
        })),
    };
}

describe('Bulk session create payload', () => {
    it('sends walletId (int) and never accountId', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 9999 }),
            fc.string(),
            (rvm, wallet, notes) => {
                const payload = buildBulkPayload({
                    selectedRvm: String(rvm),
                    selectedWalletId: String(wallet),
                    notes,
                    items: [{ detectedClass: 'coke_bottle', pointsAwarded: 5 }],
                });
                expect(payload.rvmId).toBe(rvm);
                expect(payload.walletId).toBe(wallet);
                expect('accountId' in payload).toBe(false);
                expect(payload.items[0]).toEqual({ detectedClass: 'coke_bottle', pointsAwarded: 5 });
            },
        ));
    });
});
```

- [ ] **Step 2: Run test to verify it passes (contract baseline)**

Run: `npm run test -- bulk-session-create-payload`
Expected: PASS — this encodes the target contract. (It is a guard against regressions; the real fix is in the page below.)

- [ ] **Step 3: Fix the user dropdown to carry walletId**

In `client/app/admin/bulk-sessions/page.js`, find the User Account dropdown (inside the modal, left panel):

```javascript
<CustomDropdown value={selectedAccount} onChange={setSelectedAccount} searchable showPlaceholder={false}
    options={allUsers.map(u => ({ value: String(u.accountId || u.id), label: `${u.name} (${u.email})` }))} placeholder="Select user" />
```

Replace the `options` mapping with `u.walletId`:

```javascript
<CustomDropdown value={selectedAccount} onChange={setSelectedAccount} searchable showPlaceholder={false}
    options={allUsers
        .filter(u => u.walletId)
        .map(u => ({ value: String(u.walletId), label: `${u.name} (${u.email})` }))} placeholder="Select user" />
```

- [ ] **Step 4: Fix the submit payload**

In the same file, find `handleSubmit`:

```javascript
            await bulkApi.create({
                rvmId: parseInt(selectedRvm),
                accountId: parseInt(selectedAccount),
                notes,
                items: items.map(i => ({
                    detectedClass: i.detectedClass,
                    pointsAwarded: parseInt(i.pointsAwarded) || 0,
                })),
            });
```

Replace with (`walletId`, drop `accountId`):

```javascript
            await bulkApi.create({
                rvmId: parseInt(selectedRvm),
                walletId: parseInt(selectedAccount),
                notes,
                items: items.map(i => ({
                    detectedClass: i.detectedClass,
                    pointsAwarded: parseInt(i.pointsAwarded) || 0,
                })),
            });
```

- [ ] **Step 5: Verify no syntax/type errors**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 6: Commit**

```bash
git add client/app/admin/bulk-sessions/page.js client/tests/property/bulk-session-create-payload.test.js
git commit -m "fix: bulk session create sends walletId (was accountId) — resolves 400"
```

---

### Task A2: Surface the hidden 500 on GET /users and POST /sessions/bulk

**Root cause approach:** Every controller catches `Exception` and returns a generic `'An internal error occurred'`, so the real traceback never reaches the log. We cannot fix the `GET /api/web/users?per_page=200` 500 without seeing it. This task adds `current_app.logger.exception(...)` to the relevant `except` blocks so the next reproduction prints the actual traceback. This is safe (log-only) and reversible.

**Files:**
- Modify: `server/app/controllers/users_controller.py` (the `get_users` except block)
- Modify: `server/app/controllers/sessions_controller.py` (the `create_bulk_session` and `get_bulk_sessions` except blocks)

- [ ] **Step 1: Add the import in users_controller.py**

At the top of `server/app/controllers/users_controller.py`, the Flask import line is:

```python
from flask import Blueprint, request, jsonify
```

Replace with:

```python
from flask import Blueprint, request, jsonify, current_app
```

- [ ] **Step 2: Log the exception in get_users**

In `server/app/controllers/users_controller.py`, find the `get_users` function's final except block:

```python
        return jsonify({'success': True, 'users': [_serialize_user(u) for u in users], 'pagination': pagination}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

Replace with:

```python
        return jsonify({'success': True, 'users': [_serialize_user(u) for u in users], 'pagination': pagination}), 200
    except Exception:
        current_app.logger.exception('get_users failed')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

- [ ] **Step 3: Add the import in sessions_controller.py**

At the top of `server/app/controllers/sessions_controller.py`:

```python
from flask import Blueprint, request, jsonify
```

Replace with:

```python
from flask import Blueprint, request, jsonify, current_app
```

- [ ] **Step 4: Log the exception in get_bulk_sessions and create_bulk_session**

In `server/app/controllers/sessions_controller.py`, find the `get_bulk_sessions` except block:

```python
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```
(the one immediately after the `get_bulk_sessions` return)

Replace that specific block with:

```python
    except Exception:
        current_app.logger.exception('get_bulk_sessions failed')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

Then find the `create_bulk_session` except block:

```python
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```
(the one immediately after the `create_bulk_session` return)

Replace that specific block with:

```python
    except Exception:
        db.session.rollback()
        current_app.logger.exception('create_bulk_session failed')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

- [ ] **Step 5: Reproduce and capture the traceback**

Start the server (`python run.py` in `server/`), log in, open the Bulk Sessions modal as the role that triggered it, and watch the terminal. The `current_app.logger.exception(...)` line now prints the real traceback for the 500.

Expected: A Python traceback in the terminal pinpointing the failing line (e.g. a `None` attribute in `_serialize_user`, or a DB connection drop).

- [ ] **Step 6: Fix the captured root cause**

Apply the targeted fix indicated by the traceback. If the traceback shows a `None`-attribute access in `_serialize_user` (e.g. a user whose `wallet` is `None`), guard it; if it shows a dropped DB connection (PgBouncer idle timeout), the existing `pool_recycle` handles new requests and a retry resolves it — note it in the commit and move on. Do not invent a fix without the traceback.

- [ ] **Step 7: Run the server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass (225+).

- [ ] **Step 8: Commit**

```bash
git add server/app/controllers/users_controller.py server/app/controllers/sessions_controller.py
git commit -m "fix: log real traceback on users/bulk-session 500 + targeted root-cause fix"
```

---

## Phase B — Admin (Access) Logs Query Optimization

**Problem (from notes):** The Admin logs page renders slowly. `get_access_logs` in `server/app/controllers/logs_controller.py` joins `AdminLog → User → CommunityGroup → Organization` with chained `joinedload` and a scoping join, over up to 500 rows.

**Approach:** Keep correctness identical (same serialized output), reduce cost:
1. Replace the deep chained `joinedload(AdminLog.admin).joinedload(User.community_group).joinedload(CommunityGroup.organization)` with `selectinload` for the one-to-many hops so the org/group are batched in separate `IN (...)` queries instead of a wide row-multiplying join.
2. Add a DB index on `admin_logs.created_at` (the `ORDER BY` column) and on `admin_logs.admin_user_id` (the join column) if not already present.

**Files:**
- Modify: `server/app/controllers/logs_controller.py` (`get_access_logs`)
- Test: `server/tests/property/test_access_logs_shape.py` (new — proves output unchanged)

- [ ] **Step 1: Write a characterization test (output must not change)**

Create `server/tests/property/test_access_logs_shape.py`:

```python
"""Characterization test: get_access_logs output shape is stable.

Seeds a superadmin + a handful of AdminLog rows, calls GET /logs/access,
and asserts the response is a 200 with a list of dicts carrying the
canonical keys. This guards the optimization in Phase B from changing
the serialized contract.
"""
import pytest


def test_access_logs_returns_canonical_shape(client_as_superadmin):
    resp = client_as_superadmin.get('/api/web/logs/access')
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['success'] is True
    assert isinstance(body['logs'], list)
    if body['logs']:
        row = body['logs'][0]
        for key in ('id', 'adminName', 'action', 'category', 'timestamp'):
            assert key in row, f'missing key {key} in {row}'
```

> NOTE: `client_as_superadmin` is the existing superadmin-authenticated fixture used by `server/tests/smoke/test_admin_smoke.py`. If its name differs, reuse that file's fixture name verbatim — do not invent a new fixture.

- [ ] **Step 2: Run it on the current code to capture the baseline**

Run: `python -m pytest server/tests/property/test_access_logs_shape.py -v` (in `server/`)
Expected: PASS (baseline green before any change).

- [ ] **Step 3: Switch the deep joinedload to selectinload**

In `server/app/controllers/logs_controller.py`, the import line is:

```python
from sqlalchemy.orm import joinedload
```

Replace with:

```python
from sqlalchemy.orm import joinedload, selectinload
```

Then in `get_access_logs`, find:

```python
        query = AdminLog.query.join(User, AdminLog.admin_user_id == User.id).options(
            joinedload(AdminLog.admin)
                .joinedload(User.community_group)
                .joinedload(CommunityGroup.organization),
        )
```

Replace with:

```python
        # selectinload batches the admin → community_group → organization
        # hops into separate IN (...) queries instead of one row-multiplying
        # deep join, which is materially faster for the 500-row window.
        query = AdminLog.query.join(User, AdminLog.admin_user_id == User.id).options(
            selectinload(AdminLog.admin)
                .selectinload(User.community_group)
                .selectinload(CommunityGroup.organization),
        )
```

- [ ] **Step 4: Add indexes on admin_logs hot columns**

Check the `AdminLog` model in `server/app/models.py`. If `created_at` and `admin_user_id` are not already `index=True`, add a migration. Create `server/migrations/versions/<autogen>_index_admin_logs.py` by running:

Run: `flask db migrate -m "index admin_logs created_at and admin_user_id"` (in `server/`, with the app env active)

Then edit the generated migration's `upgrade()` to contain exactly:

```python
def upgrade():
    op.create_index('ix_admin_logs_created_at', 'admin_logs', ['created_at'])
    op.create_index('ix_admin_logs_admin_user_id', 'admin_logs', ['admin_user_id'])


def downgrade():
    op.drop_index('ix_admin_logs_admin_user_id', table_name='admin_logs')
    op.drop_index('ix_admin_logs_created_at', table_name='admin_logs')
```

> If either index already exists (check `models.py` for `index=True` on those columns, or existing migrations), omit that `create_index`/`drop_index` line. Do not create a duplicate index.

- [ ] **Step 5: Apply the migration**

Run: `flask db upgrade` (in `server/`)
Expected: migration applies cleanly.

- [ ] **Step 6: Re-run the characterization test**

Run: `python -m pytest server/tests/property/test_access_logs_shape.py -v` (in `server/`)
Expected: PASS (output contract unchanged).

- [ ] **Step 7: Run the full server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add server/app/controllers/logs_controller.py server/migrations/versions/ server/tests/property/test_access_logs_shape.py
git commit -m "perf: optimize admin access-logs query (selectinload + indexes)"
```

---

## Phase C — RBAC Single Source of Truth

**Design decision (the core of this phase):** Today permissions live in two places that disagree:
- Server `middleware.ROLE_PERMISSIONS` — category-only (e.g. `auditor: {logs, analytics, sessions, settings, leaderboard, dashboard}`), projected to the client as `permission_categories`. Used by the sidebar and `RequirePermission`.
- Client `roleConfig.ROLES` — per-verb (e.g. `auditor.users = {view:true, edit:false,...}`). Used by `hasPermission` for buttons.

This split is why QA sees: buttons that lead to blocked pages (client grants `users.view` to auditor, server category set lacks `users`), and actions that run when they shouldn't (server only checks category, so `logs` access implies export even though the client says `export:false`; export is a client-side CSV so only the button needs gating).

**Fix:** Introduce `server/app/permissions.py` with one authoritative per-verb map `ROLE_ACTION_PERMISSIONS[role][category] -> set(verbs)`. Everything derives from it:
- `middleware.ROLE_PERMISSIONS` (category set) = the categories with at least one verb.
- `/auth/me` projects the full per-verb structure as `permissions`.
- The client consumes `permissions` directly; `roleConfig` keeps only display metadata.
- `permission_required(category, action=...)` enforces the verb server-side on mutation endpoints.

The authoritative matrix below encodes the QA spec exactly.

| role | dashboard | users | machines | rewards | analytics | sessions | logs | settings |
|---|---|---|---|---|---|---|---|---|
| superadmin | view,edit | view,edit,create,delete | view,edit,create,delete | view,edit,create,delete | view,export | view,create | view,export,delete | view,edit |
| head_admin | view,edit | view,edit,create,delete | view,edit,create,delete | view,edit,create,delete | view | view,create | view,export | view,edit |
| auditor | view | view | view | view | view | view,create | view,export | view |
| inventory_officer | view | — | — | view,edit,create,delete | — | view,create | view | view |
| technician | view | — | — | — | — | view,create | view | view |

Notes encoded from QA:
- head_admin analytics: view only (no export) — fixes "can export though view-only".
- auditor: users/machines/rewards are view-only and **present** so they appear in the sidebar and pages load.
- inventory_officer: no users/machines/analytics; rewards full CRUD; logs view-only (no export); sessions view+create.
- technician: machines view only here at category level, with `edit` granted (see machines row) — set technician machines to `view,edit`.

Correction for technician machines (QA: "view and edit"): technician `machines = {view, edit}`. Apply that in the map below.

### Task C1: Create the authoritative permissions map

**Files:**
- Create: `server/app/permissions.py`
- Test: `server/tests/property/test_role_action_permissions.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_role_action_permissions.py`:

```python
"""Validates the authoritative per-verb RBAC matrix (Phase C)."""
import pytest
from app.permissions import (
    ROLE_ACTION_PERMISSIONS,
    categories_for_role,
    role_can,
)

EXPECTED = {
    'auditor': {
        'dashboard': {'view'},
        'users': {'view'},
        'machines': {'view'},
        'rewards': {'view'},
        'analytics': {'view'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export'},
        'settings': {'view'},
    },
    'inventory_officer': {
        'dashboard': {'view'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
    },
    'technician': {
        'dashboard': {'view'},
        'machines': {'view', 'edit'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
    },
}


@pytest.mark.parametrize('role', sorted(EXPECTED.keys()))
def test_matrix_matches_qa_spec(role):
    for category, verbs in EXPECTED[role].items():
        assert ROLE_ACTION_PERMISSIONS[role].get(category) == verbs, (
            f'{role}.{category}: expected {verbs}, got '
            f'{ROLE_ACTION_PERMISSIONS[role].get(category)}'
        )


def test_auditor_cannot_export_logs_is_false_but_can_export():
    # auditor CAN export logs per QA
    assert role_can('auditor', 'logs', 'export') is True


def test_inventory_officer_cannot_export_logs():
    assert role_can('inventory_officer', 'logs', 'export') is False


def test_head_admin_cannot_export_analytics():
    assert role_can('head_admin', 'analytics', 'export') is False


def test_categories_for_role_auditor_includes_view_only_modules():
    cats = categories_for_role('auditor')
    assert {'users', 'machines', 'rewards'}.issubset(cats)


def test_non_admin_role_has_no_permissions():
    assert role_can('user', 'users', 'view') is False
    assert categories_for_role('user') == set()
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_role_action_permissions.py -v` (in `server/`)
Expected: FAIL with `ModuleNotFoundError: No module named 'app.permissions'`.

- [ ] **Step 3: Create the permissions module**

Create `server/app/permissions.py`:

```python
"""Authoritative per-verb RBAC matrix (single source of truth).

`ROLE_ACTION_PERMISSIONS[role][category]` is the set of verbs that role may
perform in that category. Everything else derives from this map:

  * `middleware.ROLE_PERMISSIONS` — the category set per role (any verb).
  * `auth_controller` — projects this structure into `GET /auth/me`.
  * `permission_required(category, action=...)` — server-side verb gate.
  * Client `AuthContext` — consumes the projected structure for UI gating.

Verbs: 'view', 'edit', 'create', 'delete', 'export'.
Non-admin roles ('user', 'dependent') are intentionally absent.
"""

ROLE_ACTION_PERMISSIONS = {
    'superadmin': {
        'dashboard': {'view', 'edit'},
        'users': {'view', 'edit', 'create', 'delete'},
        'machines': {'view', 'edit', 'create', 'delete'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'locations': {'view', 'edit', 'create', 'delete'},
        'groups': {'view', 'edit', 'create', 'delete'},
        'leaderboard': {'view', 'edit'},
        'analytics': {'view', 'export'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export', 'delete'},
        'settings': {'view', 'edit'},
    },
    'head_admin': {
        'dashboard': {'view', 'edit'},
        'users': {'view', 'edit', 'create', 'delete'},
        'machines': {'view', 'edit', 'create', 'delete'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'locations': {'view', 'edit', 'create', 'delete'},
        'groups': {'view', 'edit', 'create', 'delete'},
        'leaderboard': {'view', 'edit'},
        'analytics': {'view'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export'},
        'settings': {'view', 'edit'},
    },
    'auditor': {
        'dashboard': {'view'},
        'users': {'view'},
        'machines': {'view'},
        'rewards': {'view'},
        'analytics': {'view'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export'},
        'settings': {'view'},
        'leaderboard': {'view'},
    },
    'inventory_officer': {
        'dashboard': {'view'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
        'leaderboard': {'view'},
    },
    'technician': {
        'dashboard': {'view'},
        'machines': {'view', 'edit'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
        'leaderboard': {'view'},
    },
}


def categories_for_role(role):
    """Return the set of categories the role has at least one verb in."""
    return set(ROLE_ACTION_PERMISSIONS.get(role, {}).keys())


def role_can(role, category, action):
    """True iff `role` may perform `action` in `category`."""
    return action in ROLE_ACTION_PERMISSIONS.get(role, {}).get(category, set())


def permissions_for_role(role):
    """Return the role's full {category: sorted([verbs])} map for JSON projection."""
    return {
        category: sorted(verbs)
        for category, verbs in ROLE_ACTION_PERMISSIONS.get(role, {}).items()
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_role_action_permissions.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/app/permissions.py server/tests/property/test_role_action_permissions.py
git commit -m "feat: authoritative per-verb RBAC matrix (server/app/permissions.py)"
```

---

### Task C2: Derive middleware.ROLE_PERMISSIONS from the new map and add verb enforcement

**Files:**
- Modify: `server/app/middleware.py` (the `ROLE_PERMISSIONS` literal and `permission_required`)

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_permission_required_verb.py`:

```python
"""permission_required(category, action) enforces the verb server-side."""
import pytest
from app.middleware import ROLE_PERMISSIONS
from app.permissions import categories_for_role


@pytest.mark.parametrize('role', ['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician'])
def test_role_permissions_categories_match_matrix(role):
    assert ROLE_PERMISSIONS[role] == categories_for_role(role)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_permission_required_verb.py -v` (in `server/`)
Expected: FAIL — current `ROLE_PERMISSIONS` is a hand-written literal that differs (auditor lacks `users`/`machines`/`rewards`).

- [ ] **Step 3: Derive ROLE_PERMISSIONS from the matrix**

In `server/app/middleware.py`, find the literal block:

```python
ROLE_PERMISSIONS = {
    'superadmin': {
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    },
    'head_admin': {
        ...
    },
    ...
}
```

Replace the entire literal (through its closing `}`) with a derivation. Add near the top of the file (with the other imports):

```python
from .permissions import ROLE_ACTION_PERMISSIONS, categories_for_role, role_can
```

Then replace the literal with:

```python
# Category set per role, derived from the authoritative per-verb matrix in
# app/permissions.py. A category is present iff the role has >=1 verb in it.
ROLE_PERMISSIONS = {
    role: categories_for_role(role)
    for role in ROLE_ACTION_PERMISSIONS
}
```

Leave the existing `assert set(ROLE_PERMISSIONS.keys()) == ADMIN_ROLE_SET` invariant in place — it still holds because the matrix keys are exactly the admin roles. If `ADMIN_ROLE_SET` is defined *after* this block, move the derivation below `ADMIN_ROLE_SET`'s definition so the assert can run.

- [ ] **Step 4: Extend permission_required to accept an optional action verb**

In `server/app/middleware.py`, find the `permission_required` signature and its category-check loop:

```python
def permission_required(*categories, allow_non_admin=False):
```

and inside:

```python
            role_perms = ROLE_PERMISSIONS.get(current_user.role, set())
            for cat in categories:
                if cat not in role_perms:
                    ...
                    }), 403
```

Change the signature to accept an optional `action`:

```python
def permission_required(*categories, action=None, allow_non_admin=False):
```

Immediately after the existing category-miss loop (keep that loop intact), add a verb check:

```python
            # Per-verb enforcement (Phase C). When `action` is supplied, the
            # role must hold that verb in EACH requested category. Category
            # presence alone is no longer sufficient for mutating routes.
            if action is not None:
                for cat in categories:
                    if not role_can(current_user.role, cat, action):
                        return jsonify({
                            'success': False,
                            'error': {
                                'code': 'FORBIDDEN',
                                'missing': f'{cat}:{action}',
                                'message': f'Your role cannot {action} {cat}.',
                            },
                        }), 403
```

- [ ] **Step 5: Run the new tests + full suite**

Run: `python -m pytest server/tests/property/test_permission_required_verb.py server/tests/property/test_role_action_permissions.py -v` (in `server/`)
Expected: PASS.

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass. (Existing Phase 2 granularity tests assert category-level behavior; they remain valid because category presence is unchanged for routes that don't pass `action`.)

- [ ] **Step 6: Commit**

```bash
git add server/app/middleware.py server/tests/property/test_permission_required_verb.py
git commit -m "feat: derive category perms from matrix + per-verb enforcement in permission_required"
```

---

### Task C3: Project per-verb permissions into GET /auth/me

**Files:**
- Modify: `server/app/controllers/auth_controller.py` (`_serialize_auth_user`)
- Test: extend `server/tests/unit/test_auth_me_permission_categories.py`

- [ ] **Step 1: Write the failing test**

Append to `server/tests/unit/test_auth_me_permission_categories.py`:

```python
def test_serialize_auth_user_includes_per_verb_permissions(app_ctx):
    """The /auth/me payload MUST include a per-verb `permissions` object
    derived from app.permissions.permissions_for_role."""
    from app.permissions import permissions_for_role
    from app.controllers.auth_controller import _serialize_auth_user
    from app.models import User

    user_id = _seed_user(app_ctx, 'auditor')
    with app_ctx.app_context():
        user = db.session.get(User, user_id)
        payload = _serialize_auth_user(user)

    assert 'permissions' in payload
    assert payload['permissions'] == permissions_for_role('auditor')
    # auditor can view users but not edit
    assert 'view' in payload['permissions']['users']
    assert 'edit' not in payload['permissions'].get('users', [])
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/unit/test_auth_me_permission_categories.py::test_serialize_auth_user_includes_per_verb_permissions -v` (in `server/`)
Expected: FAIL — `permissions` key absent.

- [ ] **Step 3: Add the projection**

In `server/app/controllers/auth_controller.py`, find `_serialize_auth_user`. It currently sets `permission_categories`. Add the import near the top:

```python
from ..permissions import permissions_for_role
```

In the returned dict of `_serialize_auth_user`, alongside the existing `'permission_categories': ...` key, add:

```python
        'permissions': permissions_for_role(user.role),
```

Keep `permission_categories` for backward compatibility (the sidebar still reads it until Task C5 switches it over).

- [ ] **Step 4: Run the test**

Run: `python -m pytest server/tests/unit/test_auth_me_permission_categories.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/app/controllers/auth_controller.py server/tests/unit/test_auth_me_permission_categories.py
git commit -m "feat: project per-verb permissions into GET /auth/me"
```

---

### Task C4: Enforce verbs on the QA-flagged mutation endpoints

QA flagged these server-enforceable actions (export is client-only and handled in C7):
- `users`: edit/create/delete must be denied for view-only roles (auditor).
- `machines`: edit must be allowed for technician, denied for auditor.
- `rewards`: edit/create/delete allowed for inventory_officer, denied for auditor/technician.

**Files:**
- Modify: `server/app/controllers/users_controller.py` (create_user, update_user, delete_user, adjust_user_points)
- Modify: `server/app/controllers/machines_controller.py` (update/create/delete routes)
- Modify: `server/app/controllers/rewards_controller.py` (create/update/delete routes)

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_verb_enforcement_routes.py`:

```python
"""Auditor (view-only on users/machines/rewards) must be denied mutations."""
import pytest


def test_auditor_cannot_create_user(client_as_auditor):
    resp = client_as_auditor.post('/api/web/users', json={
        'firstName': 'X', 'lastName': 'Y', 'email': 'x@y.com',
        'password': 'TestPass1', 'role': 'user', 'locationId': 1,
    })
    assert resp.status_code == 403
    assert resp.get_json()['error']['code'] == 'FORBIDDEN'


def test_auditor_cannot_edit_machine(client_as_auditor, seeded_machine_id):
    resp = client_as_auditor.put(f'/api/web/machines/{seeded_machine_id}', json={'name': 'Z'})
    assert resp.status_code == 403


def test_technician_can_edit_machine(client_as_technician, seeded_machine_id):
    resp = client_as_technician.put(f'/api/web/machines/{seeded_machine_id}', json={'name': 'Z'})
    assert resp.status_code in (200, 404)  # 404 only if fixture id absent; never 403
```

> NOTE: Reuse existing authenticated-client fixtures. If `client_as_auditor` / `client_as_technician` / `seeded_machine_id` do not exist, add them to `server/tests/conftest.py` mirroring the existing `client_as_superadmin` fixture pattern (same JWT-minting helper, different role). Inspect `conftest.py` first and copy the established pattern verbatim.

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_verb_enforcement_routes.py -v` (in `server/`)
Expected: FAIL — auditor currently lacks `users`/`machines` categories entirely (pre-C2) OR, post-C2, has the category but no verb gate yet, so the mutation is allowed → assertion fails.

- [ ] **Step 3: Add the action verb to the users mutation decorators**

In `server/app/controllers/users_controller.py`:

- `create_user` decorator `@permission_required('users')` → `@permission_required('users', action='create')`
- `update_user` decorator `@permission_required('users')` → `@permission_required('users', action='edit')`
- `delete_user` decorator `@permission_required('users')` → `@permission_required('users', action='delete')`
- `adjust_user_points` decorator `@permission_required('users')` → `@permission_required('users', action='edit')`

Leave `get_users` and `get_user` as `@permission_required('users')` (view = category presence).

- [ ] **Step 4: Add the action verb to the machines mutation decorators**

In `server/app/controllers/machines_controller.py`, for the create/update/delete routes (POST `/machines`, PUT `/machines/<id>`, DELETE `/machines/<id>`), add the matching `action`:

- create route → `@permission_required('machines', action='create')`
- update route → `@permission_required('machines', action='edit')`
- delete route → `@permission_required('machines', action='delete')`

Leave the GET list/detail routes as `@permission_required('machines')`.

- [ ] **Step 5: Add the action verb to the rewards mutation decorators**

In `server/app/controllers/rewards_controller.py`, for create/update/delete reward routes:

- create → `@permission_required('rewards', action='create')`
- update → `@permission_required('rewards', action='edit')`
- delete → `@permission_required('rewards', action='delete')`

Leave GET routes as `@permission_required('rewards')`.

- [ ] **Step 6: Run the verb-enforcement test + full suite**

Run: `python -m pytest server/tests/property/test_verb_enforcement_routes.py -v` (in `server/`)
Expected: PASS.

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add server/app/controllers/users_controller.py server/app/controllers/machines_controller.py server/app/controllers/rewards_controller.py server/tests/property/test_verb_enforcement_routes.py server/tests/conftest.py
git commit -m "feat: enforce per-verb permissions on users/machines/rewards mutations"
```

---

### Task C5: Client consumes server per-verb permissions

**Files:**
- Modify: `client/src/context/AuthContext.js` (`enrichUser` + `hasPermission`)
- Modify: `client/src/data/roleConfig.js` (reduce to display metadata)
- Test: `client/tests/property/permission-gating.test.js` (new)

- [ ] **Step 1: Write the failing test**

Create `client/tests/property/permission-gating.test.js`:

```javascript
import { describe, it, expect } from 'vitest';

// Pure permission resolver the AuthContext must implement: read verbs from
// the server-provided `permissions` object, falling back to deny.
function makeHasPermission(serverPermissions) {
    return (module, action) =>
        Array.isArray(serverPermissions?.[module]) &&
        serverPermissions[module].includes(action);
}

describe('server-driven hasPermission', () => {
    const auditor = {
        dashboard: ['view'],
        users: ['view'],
        machines: ['view'],
        rewards: ['view'],
        analytics: ['view'],
        sessions: ['create', 'view'],
        logs: ['export', 'view'],
        settings: ['view'],
    };

    it('grants auditor view but denies edit on users', () => {
        const can = makeHasPermission(auditor);
        expect(can('users', 'view')).toBe(true);
        expect(can('users', 'edit')).toBe(false);
    });

    it('grants auditor logs export', () => {
        expect(makeHasPermission(auditor)('logs', 'export')).toBe(true);
    });

    it('denies an unknown module', () => {
        expect(makeHasPermission(auditor)('locations', 'view')).toBe(false);
    });
});
```

- [ ] **Step 2: Run it to verify it passes (contract baseline)**

Run: `npm run test -- permission-gating` (in `client/`)
Expected: PASS — encodes the resolver contract `AuthContext` must match.

- [ ] **Step 3: Switch enrichUser/hasPermission to server permissions**

In `client/src/context/AuthContext.js`, find:

```javascript
function enrichUser(user) {
    if (!user) return null;
    const roleConfig = ROLES[user.role];
    return { ...user, permissions: roleConfig?.permissions || {} };
}
```

Replace with (prefer the server-provided per-verb `permissions`; fall back to empty):

```javascript
function enrichUser(user) {
    if (!user) return null;
    // Per-verb permissions are authoritative from the server (/auth/me).
    // `user.permissions` is { category: [verbs] }. Keep as-is; hasPermission
    // reads it directly. No client-side roleConfig permission lookup.
    return { ...user, permissions: user.permissions || {} };
}
```

Then find `hasPermission`:

```javascript
    const hasPermission = useCallback((module, action) => {
        if (!currentUser) return false;
        if (currentUser.role === 'superadmin') return true;
        return currentUser.permissions?.[module]?.[action] || false;
    }, [currentUser]);
```

Replace with (read the server array shape `{category: [verbs]}`):

```javascript
    const hasPermission = useCallback((module, action) => {
        if (!currentUser) return false;
        if (currentUser.role === 'superadmin') return true;
        const verbs = currentUser.permissions?.[module];
        return Array.isArray(verbs) && verbs.includes(action);
    }, [currentUser]);
```

Remove the now-unused `import { ROLES } from '../data/roleConfig';` if nothing else in the file references `ROLES`. (Search the file first; `ROLES` may be used elsewhere — if so, leave the import.)

- [ ] **Step 4: Reduce roleConfig to display metadata**

In `client/src/data/roleConfig.js`, the `ROLES` object's per-role `permissions` blocks are no longer the source of truth. Strip the `permissions` key from each role, keeping `name`, `description`, `color`, `scope`. For example, the `auditor` entry becomes:

```javascript
    auditor: {
        name: 'Auditor',
        description: 'View and export data within assigned location',
        color: 'blue',
        scope: 'location',
    },
```

Apply the same removal of the `permissions:` block to `superadmin`, `head_admin`, `inventory_officer`, and `technician`. Keep the `hasPermission`/`isSuperAdmin` helper exports at the bottom only if they are imported elsewhere; otherwise delete them. (Search the codebase for `from '../data/roleConfig'` and `roleConfig` imports before deleting helpers.)

- [ ] **Step 5: Build the client**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully. Fix any import errors surfaced by removed `ROLES.permissions` usages by routing them through `useAuth().hasPermission`.

- [ ] **Step 6: Commit**

```bash
git add client/src/context/AuthContext.js client/src/data/roleConfig.js client/tests/property/permission-gating.test.js
git commit -m "feat: client reads per-verb permissions from server (single source of truth)"
```

---

### Task C6: Sidebar + quick-action visibility from server permissions

The sidebar already filters by `currentUser.permission_categories`. Because C2 now includes view-only categories (auditor gets `users`/`machines`/`rewards`), the sidebar will show those entries automatically. This task makes the quick-action shortcuts on the dashboard consistent so they no longer point to pages the role cannot open.

**Files:**
- Modify: `client/app/admin/page.js` (Quick Actions block)
- Modify: `client/src/components/admin/Sidebar.jsx` (Claim Scanner item — align with `hasPermission`)

- [ ] **Step 1: Verify sidebar shows view-only modules for auditor (manual)**

After C2+C3+C5, run the client and server, log in as auditor. Confirm the sidebar now lists Machines, User Management, and Rewards Inventory (view-only). No code change needed if they appear — the category derivation handles it.

- [ ] **Step 2: Gate quick-action shortcuts by the authoritative hasPermission**

In `client/app/admin/page.js`, the Quick Actions block already uses `hasPermission('users', 'view')` etc. Since `hasPermission` is now server-driven (C5), these become correct automatically. Verify each shortcut uses `'view'`:

```javascript
                    {(isSuperAdmin || hasPermission('rewards', 'view')) && (
                        <ShortcutBtn label="Rewards" icon={Trophy} color="purple" href="/admin/rewards" />
                    )}
                    {(isSuperAdmin || hasPermission('users', 'view')) && (
                        <ShortcutBtn label="Manage Users" icon={Users} color="emerald" href="/admin/users" />
                    )}
                    {(isSuperAdmin || hasPermission('logs', 'view')) && (
                        <ShortcutBtn label="Admin Logs" icon={FileText} color="blue" href="/admin/logs/access" />
                    )}
                    {(isSuperAdmin || hasPermission('machines', 'view')) && (
                        <ShortcutBtn label="Machines" icon={Package} color="amber" href="/admin/machines" />
                    )}
```

No change to the logic is required if it already matches the above. If any shortcut omits the `hasPermission` guard, wrap it exactly as shown. This resolves "quick action leads to dashboard" because the button now only appears when the page guard (same server categories) will allow entry.

- [ ] **Step 3: Align the Claim Scanner sidebar item**

In `client/src/components/admin/Sidebar.jsx`, the Claim Scanner entry uses:

```javascript
            hidden: !hasPermission('rewards', 'view')
```

This is correct under the server-driven `hasPermission`. Leave as-is. (Documented here so the executor confirms rather than changes it.)

- [ ] **Step 4: Build**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add client/app/admin/page.js client/src/components/admin/Sidebar.jsx
git commit -m "fix: quick-action and sidebar visibility consistent with server permissions"
```

---

### Task C7: Gate Export buttons by the export verb

Export is a client-side CSV (`Blob` download) on all five log pages and (if present) analytics. There is no server endpoint to protect — gating the button is the complete fix. QA: inventory_officer and technician must NOT export logs; head_admin must NOT export analytics; auditor MAY export logs.

**Files:**
- Modify: `client/app/admin/logs/bottles/page.js`
- Modify: `client/app/admin/logs/machines/page.js`
- Modify: `client/app/admin/logs/rewards/page.js`
- Modify: `client/app/admin/logs/transactions/page.js`
- Modify: `client/app/admin/logs/access/page.js`
- Modify: `client/app/admin/analytics/page.js` (only if it has an export control)

- [ ] **Step 1: Add hasPermission to each log page and gate the Export button**

For each of the five log pages, locate the content component (e.g. `BottleLogsPageContent`) and ensure it pulls `hasPermission` from `useAuth`:

```javascript
    const { /* ...existing... */ hasPermission } = useAuth();
```

(If the component does not already call `useAuth`, add `import { useAuth } from '../../../../src/context/AuthContext';` — match the existing relative depth used by sibling imports in that file — and the destructure above.)

Then wrap the Export button. For `bottles/page.js` the button is:

```javascript
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
```

Wrap it:

```javascript
                {hasPermission('logs', 'export') && (
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
                )}
```

Apply the identical `{hasPermission('logs', 'export') && ( ... )}` wrapper around the Export CSV button in `machines/page.js`, `rewards/page.js`, `transactions/page.js`, and `access/page.js`. Each file's button markup differs slightly (class names) — wrap whatever the existing Export button element is, do not rewrite its markup.

- [ ] **Step 2: Gate the analytics export (if present)**

Open `client/app/admin/analytics/page.js`. Search for an export/download control (`exportToCSV`, `Download`, `Export`). If one exists, wrap it with `{hasPermission('analytics', 'export') && ( ... )}` and ensure `hasPermission` is destructured from `useAuth`. If no export control exists, no change is needed (head_admin's "can export analytics" issue is then already absent). Record which case applied in the commit message.

- [ ] **Step 3: Build**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 4: Manual verification matrix**

Run client + server. Log in as each role and confirm:
- auditor: log pages show Export; can export. Users/Machines/Rewards pages load (view-only), no Edit/Create/Delete buttons.
- inventory_officer: log pages hide Export; Rewards page shows full CRUD; no Users/Machines/Analytics in sidebar.
- technician: Machines page shows Edit; log pages hide Export; no Users/Rewards/Analytics.
- head_admin: analytics shows no Export; everything else per matrix.

- [ ] **Step 5: Commit**

```bash
git add client/app/admin/logs/ client/app/admin/analytics/page.js
git commit -m "fix: gate CSV export buttons by per-verb export permission"
```

---

### Task C8: Full regression pass

- [ ] **Step 1: Server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 2: Client suite**

Run: `npm run test` (in `client/`)
Expected: all pass.

- [ ] **Step 3: Client build**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 4: Commit (if any test fixups were needed)**

```bash
git add -A
git commit -m "test: regression pass for RBAC single-source-of-truth"
```

---

## Self-Review

**1. Spec coverage:**

| QA / notes item | Task |
|---|---|
| head_admin analytics view-only but can export | C1 matrix (analytics: view only) + C7 (analytics export gate) |
| auditor: users/machines/rewards should be in sidebar (view) | C1 matrix (auditor view categories) + C2 (derive categories) + C6 (sidebar) |
| auditor: bulk session view+create but "only view" | A1 (create 400 fix) + C1 matrix (sessions: view,create) |
| inventory_officer: users/machines on quick action but should be denied | C1 matrix (no users/machines) + C5/C6 (server-driven gating) |
| inventory_officer: rewards full CRUD but "only view" | C1 matrix + C4 (server verb enforce) + C5 (client gating) |
| inventory_officer: analytics & bulk not in sidebar | C1 matrix (inventory_officer has sessions; analytics absent) + C2 |
| inventory_officer: logs view-only but can export | C1 matrix (logs: view) + C7 (export gate) |
| technician: machines view+edit but "only view" | C1 matrix (machines: view,edit) + C4 (allow edit) + C5 |
| technician: analytics/bulk not in sidebar; logs no export | C1 matrix + C7 |
| Bulk Sessions create 400 | A1 |
| Bulk Sessions modal-data 500 | A2 |
| Admin logs slow query | B (selectinload + indexes) |

All items map to a task.

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N". Every code step shows the code. Two `NOTE:` callouts intentionally instruct the executor to reuse existing fixtures/imports rather than invent them — these are concrete instructions, not placeholders.

**3. Type consistency:** Server `permissions_for_role` returns `{category: sorted([verbs])}` (arrays). Client `hasPermission` reads arrays via `verbs.includes(action)`. The C5 test and the resolver match. `permission_required(category, action=...)` keyword matches the `role_can(role, category, action)` signature. `ROLE_PERMISSIONS` (set of categories) vs `permissions` (per-verb) are distinct keys on the payload — sidebar uses `permission_categories`, buttons use `permissions` — both projected from the same matrix.

**Known assumption to verify during execution:** the exact authenticated-client fixture names in `server/tests/conftest.py` (Tasks C4/B). Inspect `conftest.py` and reuse the established pattern; do not invent new auth plumbing.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-21-admin-rbac-and-crud-fixes.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
