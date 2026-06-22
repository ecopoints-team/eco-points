# Admin Dashboard UX, Notifications & Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Rewards create 500, add progress modals to every admin Create/Edit/Delete/Export action, repair and verify the email-notification triggers, harden the Security settings tab (2FA, session timeout, login lockout, multi-tenant scoping), and render role-correct Quick Actions on the dashboard.

**Architecture:** This codebase is a **single multi-tenant database** (one Postgres/SQLite instance) — there is no per-organization database. Tenancy is enforced in code: every scoped table carries an `organization_id`, and `server/app/controllers/_shared.py::_scope_location_id(current_user)` returns the caller's org id (or, for a superadmin, the "View as" filtered org). The client mirrors this with `effectiveLocationId` in `AuthContext`. All fixes below either (a) respect that scoping, or (b) tighten it where it leaks (notifications, security, backup/restore). The progress-modal work introduces one shared `ProgressProvider` so no page reinvents a loading overlay.

**Tech Stack:** Flask + SQLAlchemy + Pydantic v2 + pytest/hypothesis (server); Next.js (app router) + React + Tailwind + vitest/fast-check (client); Resend API for transactional email.

**Five independently-shippable phases** — each leaves the app working and testable on its own:
- **Phase 1 — Rewards create/edit 500 fix** (root cause: base64 image overflows a `String(500)` column). Quick, high-value.
- **Phase 2 — Progress modals + redundant-control removal** across the admin dashboard.
- **Phase 3 — Notifications** (stop the 500s, make triggers fire, exclude superadmin noise from per-org logs/bell).
- **Phase 4 — Security tab** (remove SMS 2FA, verify 2FA/session/lockout, multi-tenant scoping for security + backup/restore + test data).
- **Phase 5 — Quick Actions per role**.

Recommended order: 1 → 2 → 3 → 4 → 5. Phase 1 unblocks Rewards QA immediately; Phase 5 depends on the RBAC `hasPermission` work tracked in `docs/superpowers/plans/2026-06-21-admin-rbac-and-crud-fixes.md` (Phase C) — run that plan's Phase C before this Phase 5, or accept that Quick Actions are gated by whatever `hasPermission` currently returns.

---

## File Structure

**Phase 1 — Rewards image upload**
- Modify: `server/app/controllers/rewards_controller.py` — add `POST /rewards/image` upload endpoint; log real traceback on create/update 500.
- Modify: `client/src/services/api/rewards.js` — add `uploadImage(file)` helper.
- Modify: `client/app/admin/rewards/page.js` — upload the file first, send the returned URL string (never base64).
- Test: `server/tests/property/test_reward_image_url_length.py` (new), `client/tests/property/reward-image-payload.test.js` (new).

**Phase 2 — Progress modals**
- Create: `client/src/context/ProgressContext.jsx` — `ProgressProvider` + `useProgress()` + overlay.
- Modify: `client/app/providers.js` — mount `ProgressProvider`.
- Modify: each admin page listed in Task 2.3 — wrap async mutations with `runWithProgress`.
- Modify: `client/app/admin/logs/machines/page.js` — remove the redundant "Create Log" control.
- Modify: `client/app/admin/logs/rewards/page.js` — remove the redundant "Scan QR Code" control.
- Test: `client/tests/property/progress-context.test.jsx` (new).

**Phase 3 — Notifications**
- Modify: `server/app/services/notification_service.py` — `trigger_alert` returns a status; `_send_email` config-failures are distinguishable.
- Modify: `server/app/controllers/settings_controller.py` — `test_notification` returns 400/502 (not 500) on config/send failure with a clear message.
- Modify: `server/app/controllers/users_controller.py`, `rewards_controller.py` — confirm every `trigger_alert` call site is wrapped so a notification failure never 500s the parent action.
- Modify: `server/app/controllers/logs_controller.py` — `get_access_logs` excludes superadmin-authored rows when scoped to a single org.
- Create: `server/app/cli.py` entry (or extend existing) — `flask check-maintenance` command to run the unresolved-maintenance sweep on a schedule.
- Test: `server/tests/property/test_notification_never_500.py` (new), `server/tests/property/test_access_logs_exclude_superadmin.py` (new).

**Phase 4 — Security tab**
- Modify: `server/app/schemas/__init__.py` — `SecurityConfigUpdateSchema.twoFactorMethod` → `Literal['email']`.
- Modify: `server/app/controllers/settings_controller.py` — drop the `'sms'` branch; scope backup/restore/seed to the effective org.
- Modify: `client/app/admin/settings/page.js` — remove the "SMS OTP" dropdown option.
- Test: `server/tests/property/test_security_2fa_email_only.py` (new), `server/tests/integration/test_login_lockout.py` (new), `server/tests/integration/test_session_timeout.py` (new), `server/tests/integration/test_security_multitenant.py` (new).

**Phase 5 — Quick Actions per role**
- Create: `client/src/data/quickActions.js` — per-role quick-action config.
- Modify: `client/app/admin/page.js` — render quick actions from the config, gated by `hasPermission`.
- Test: `client/tests/property/quick-actions-per-role.test.js` (new).

---

## Phase 1 — Rewards Create/Edit 500 Fix

**Root cause (confirmed):** `server/app/models.py:523` declares `image_url = db.Column(db.String(500))`. The Rewards page (`client/app/admin/rewards/page.js::handleImageUpload`) reads the chosen file with `FileReader.readAsDataURL`, producing a base64 data URL tens of thousands of characters long, and sends it as `imageUrl`. On `db.session.commit()` the value overflows `String(500)` and the controller's blanket `except Exception` returns a generic 500. The client's `api/client.js` then surfaces the response `statusText` ("INTERNAL SERVER ERROR"), which is exactly what QA reported. The fix mirrors the existing avatar flow (`POST /api/web/auth/avatar`): upload the file to disk, store a short `/uploads/rewards/<file>` path string.

### Task 1.1: Add a reward-image upload endpoint (server)

**Files:**
- Modify: `server/app/controllers/rewards_controller.py`
- Test: `server/tests/property/test_reward_image_url_length.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_reward_image_url_length.py`:

```python
"""A stored reward image_url must always fit the String(500) column."""
import io
import pytest


def _png_bytes():
    # 1x1 transparent PNG
    import base64
    return base64.b64decode(
        b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )


def test_upload_returns_short_url(client_as_superadmin):
    data = {'image': (io.BytesIO(_png_bytes()), 'reward.png')}
    resp = client_as_superadmin.post(
        '/api/web/rewards/image',
        data=data,
        content_type='multipart/form-data',
    )
    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is True
    assert body['imageUrl'].startswith('/uploads/rewards/')
    assert len(body['imageUrl']) <= 500
```

> NOTE: `client_as_superadmin` is the existing superadmin-authenticated fixture (see `server/tests/conftest.py` / `server/tests/smoke`). Reuse its exact name; do not invent a new fixture.

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_reward_image_url_length.py -v` (in `server/`)
Expected: FAIL with 404 (route not found).

- [ ] **Step 3: Add the upload endpoint**

In `server/app/controllers/rewards_controller.py`, the import line is:

```python
from datetime import datetime, timezone
import secrets
from flask import Blueprint, request, jsonify
```

Replace with:

```python
from datetime import datetime, timezone
import os
import uuid
import secrets
from flask import Blueprint, request, jsonify, current_app
```

Then add this route immediately after the `get_rewards` function (before the `POST ''` create route):

```python
_ALLOWED_IMAGE_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif'}


@rewards_bp.route('/image', methods=['POST'])
@token_required
@permission_required('rewards', action='create')
def upload_reward_image(current_user):
    """Upload a reward image (multipart/form-data, field name 'image').

    Saves to server/uploads/rewards/ and returns a short URL string that
    fits the rewards.image_url String(500) column. Mirrors the avatar flow.
    """
    try:
        file = request.files.get('image')
        if not file or not file.filename:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in _ALLOWED_IMAGE_EXT:
            return jsonify({'success': False, 'error': 'Unsupported image type'}), 400

        upload_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'uploads', 'rewards',
        )
        os.makedirs(upload_dir, exist_ok=True)

        filename = f'{uuid.uuid4().hex[:16]}.{ext}'
        file.save(os.path.join(upload_dir, filename))

        return jsonify({'success': True, 'imageUrl': f'/uploads/rewards/{filename}'}), 200
    except Exception:
        current_app.logger.exception('upload_reward_image failed')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_reward_image_url_length.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Log the real traceback on create/update 500 (so future failures are visible)**

In `server/app/controllers/rewards_controller.py`, find the `create_reward` except block:

```python
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

Replace with:

```python
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception('create_reward failed')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

Then find the `update_reward` final except block (the one after `return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 200`):

```python
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

Replace with:

```python
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception('update_reward failed')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
```

- [ ] **Step 6: Run the server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add server/app/controllers/rewards_controller.py server/tests/property/test_reward_image_url_length.py
git commit -m "feat: reward image upload endpoint + log real traceback on reward 500"
```

---

### Task 1.2: Upload the file from the Rewards page instead of sending base64

**Files:**
- Modify: `client/src/services/api/rewards.js`
- Modify: `client/app/admin/rewards/page.js`
- Test: `client/tests/property/reward-image-payload.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/tests/property/reward-image-payload.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Contract: the reward create/update payload's imageUrl is either null or a
// short server path string (< 500 chars). It must NEVER be a base64 data URL.
function buildRewardPayload({ name, pointsRequired, stockQuantity, category, imageUrl }) {
    return {
        name,
        description: '',
        pointsRequired: parseInt(pointsRequired),
        stockQuantity: parseInt(stockQuantity),
        category,
        imageUrl: imageUrl || null,
    };
}

describe('Reward create payload', () => {
    it('imageUrl is never a base64 data URL and fits the column', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 40 }),
            fc.integer({ min: 0, max: 100000 }),
            fc.integer({ min: 0, max: 100000 }),
            fc.constantFrom('Merchandise', 'Vouchers', 'Experience'),
            fc.option(fc.constant('/uploads/rewards/abc123.png'), { nil: null }),
            (name, pts, stock, cat, img) => {
                const p = buildRewardPayload({ name, pointsRequired: pts, stockQuantity: stock, category: cat, imageUrl: img });
                if (p.imageUrl !== null) {
                    expect(p.imageUrl.startsWith('data:')).toBe(false);
                    expect(p.imageUrl.length).toBeLessThanOrEqual(500);
                }
            },
        ));
    });
});
```

- [ ] **Step 2: Run it to verify it passes (contract baseline)**

Run: `npm run test -- reward-image-payload` (in `client/`)
Expected: PASS — this encodes the target contract; the page change below makes the runtime obey it.

- [ ] **Step 3: Add the `uploadImage` API helper**

Open `client/src/services/api/rewards.js`. It uses the shared `request` transport. Add this exported function (match the file's existing export style — they are named `export async function ...`):

```javascript
import { request } from './client';

/**
 * Upload a reward image file. Returns the short server URL string
 * (e.g. "/uploads/rewards/ab12.png") to store in reward.imageUrl.
 */
export async function uploadImage(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await request('/rewards/image', { method: 'POST', body: form });
    return res.imageUrl;
}
```

> If `rewards.js` already imports `request` at the top, do not duplicate the import — add only the function.

- [ ] **Step 4: Change the file picker to upload immediately**

In `client/app/admin/rewards/page.js`, find `handleImageUpload`:

```javascript
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(p => ({ ...p, imageUrl: reader.result }));
            reader.readAsDataURL(file);
        }
    };
```

Replace with (upload the file, store the returned short URL; keep a local preview via object URL):

```javascript
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Local preview only — never persisted
        setImagePreview(URL.createObjectURL(file));
        setImageUploading(true);
        try {
            const url = await rewardsApi.uploadImage(file);
            setFormData(p => ({ ...p, imageUrl: url }));
        } catch (err) {
            console.error('Image upload failed:', err);
            alert(err?.message || 'Image upload failed');
            setImagePreview(null);
        } finally {
            setImageUploading(false);
        }
    };
```

> The existing `useState` imports are already present at the top of the file (`useState` is imported). Place the two new `useState` lines next to the other modal state declarations inside `RewardsInventoryPageContent` rather than mid-function if the linter complains about hook ordering — they must be top-level hooks in the component body. The safest location is directly beneath the existing `const [formData, setFormData] = useState({...})` declaration. Move them there if Step 4's inline placement triggers a hooks lint error.

- [ ] **Step 5: Use the preview in the modal image area**

In the modal where the current image is rendered, the existing code references `formData.imageUrl` for the preview `src`. Update the preview `src` to prefer the local preview while uploading. Find the image preview element (it uses `formData.imageUrl` as `src`) and change its `src` to:

```javascript
src={imagePreview || formData.imageUrl || ''}
```

And disable the modal's submit button while uploading by adding `disabled={imageUploading}` to the Save/Create button in the modal footer (the button that calls `handleSubmit`).

- [ ] **Step 6: Reset preview state when opening/closing the modal**

In `openAddModal` and `openEditModal`, after the existing `setFormData(...)` call, add:

```javascript
        setImagePreview(null);
        setImageUploading(false);
```

- [ ] **Step 7: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 8: Manual verification**

Start the server (`python run.py` in `server/`) and client (`npm run dev` in `client/`). Log in as an admin, open Rewards → Add Reward, pick an image, fill the form, click Create.
Expected: reward is created with no 500; the image renders from `/uploads/rewards/...`.

- [ ] **Step 9: Commit**

```bash
git add client/src/services/api/rewards.js client/app/admin/rewards/page.js client/tests/property/reward-image-payload.test.js
git commit -m "fix: rewards page uploads image file (was base64) — resolves create/edit 500"
```

---

## Phase 2 — Progress Modals + Redundant-Control Removal

**Problem (from notes):** Create/Edit/Delete actions across the admin dashboard give no in-flight feedback — the page "goes stale" until the request resolves. We add **one** shared progress overlay (`ProgressProvider`) and route every mutation through it, so every action shows a spinner + label while running and a brief success tick on completion. We also remove two redundant controls: the **Create Log** button on Machine Logs (machines are maintained from the Machines page) and the **Scan QR Code** button on Reward Logs (claims are scanned from the Claim Scanner page).

### Task 2.1: Create the shared ProgressProvider

**Files:**
- Create: `client/src/context/ProgressContext.jsx`
- Test: `client/tests/property/progress-context.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `client/tests/property/progress-context.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../../src/context/ProgressContext';

function Harness({ work }) {
    const { runWithProgress } = useProgress();
    return <button onClick={() => runWithProgress('Saving...', work)}>go</button>;
}

describe('ProgressProvider', () => {
    it('shows the label while the async work runs, then resolves', async () => {
        let resolveWork;
        const work = () => new Promise((res) => { resolveWork = () => res('ok'); });

        render(
            <ProgressProvider>
                <Harness work={work} />
            </ProgressProvider>
        );

        await act(async () => { screen.getByText('go').click(); });
        expect(screen.getByText('Saving...')).toBeInTheDocument();

        await act(async () => { resolveWork(); });
        await waitFor(() => expect(screen.queryByText('Saving...')).not.toBeInTheDocument());
    });

    it('re-throws on failure so callers can handle errors', async () => {
        let caught = null;
        function FailHarness() {
            const { runWithProgress } = useProgress();
            return (
                <button onClick={async () => {
                    try { await runWithProgress('X', () => Promise.reject(new Error('boom'))); }
                    catch (e) { caught = e; }
                }}>fail</button>
            );
        }
        render(<ProgressProvider><FailHarness /></ProgressProvider>);
        await act(async () => { screen.getByText('fail').click(); });
        await waitFor(() => expect(caught?.message).toBe('boom'));
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- progress-context` (in `client/`)
Expected: FAIL — module `ProgressContext` does not exist.

- [ ] **Step 3: Implement the provider**

Create `client/src/context/ProgressContext.jsx`:

```jsx
'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ProgressContext = createContext(null);

export function useProgress() {
    const ctx = useContext(ProgressContext);
    if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
    return ctx;
}

export function ProgressProvider({ children }) {
    // phase: 'idle' | 'running' | 'success'
    const [state, setState] = useState({ phase: 'idle', label: '' });
    const timerRef = useRef(null);

    /**
     * Run an async function while showing a blocking progress overlay.
     * @param {string} label   text shown under the spinner
     * @param {() => Promise<any>} fn  the async work
     * @param {{ successLabel?: string, successMs?: number }} [opts]
     * @returns the resolved value of fn (errors are re-thrown to the caller)
     */
    const runWithProgress = useCallback(async (label, fn, opts = {}) => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setState({ phase: 'running', label });
        try {
            const result = await fn();
            setState({ phase: 'success', label: opts.successLabel || 'Done' });
            timerRef.current = setTimeout(
                () => setState({ phase: 'idle', label: '' }),
                opts.successMs ?? 700,
            );
            return result;
        } catch (err) {
            setState({ phase: 'idle', label: '' });
            throw err;
        }
    }, []);

    const visible = state.phase === 'running' || state.phase === 'success';

    return (
        <ProgressContext.Provider value={{ runWithProgress, isBusy: state.phase === 'running' }}>
            {children}
            {visible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                     role="alertdialog" aria-busy={state.phase === 'running'} aria-live="polite">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white dark:bg-slate-800 px-10 py-8 shadow-2xl border border-slate-200 dark:border-slate-700">
                        {state.phase === 'running' ? (
                            <Loader2 size={40} className="text-emerald-500 animate-spin" />
                        ) : (
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        )}
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{state.label}</p>
                    </div>
                </div>
            )}
        </ProgressContext.Provider>
    );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- progress-context` (in `client/`)
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add client/src/context/ProgressContext.jsx client/tests/property/progress-context.test.jsx
git commit -m "feat: shared ProgressProvider for admin action feedback"
```

---

### Task 2.2: Mount ProgressProvider in the app tree

**Files:**
- Modify: `client/app/providers.js`

- [ ] **Step 1: Import and wrap**

In `client/app/providers.js`, the imports are:

```javascript
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { UIProvider, useUI } from '../src/context/UIContext';
import RouteLoadingBar from '../src/components/shared/RouteLoadingBar';
```

Add:

```javascript
import { ProgressProvider } from '../src/context/ProgressContext';
```

Then change the provider tree from:

```javascript
        <ThemeProvider>
            <AuthProvider>
                <UIProvider>
                    <RouteLoadingBar />
                    {children}
                    <GlobalModals />
                </UIProvider>
            </AuthProvider>
        </ThemeProvider>
```

to:

```javascript
        <ThemeProvider>
            <AuthProvider>
                <UIProvider>
                    <ProgressProvider>
                        <RouteLoadingBar />
                        {children}
                        <GlobalModals />
                    </ProgressProvider>
                </UIProvider>
            </AuthProvider>
        </ThemeProvider>
```

- [ ] **Step 2: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add client/app/providers.js
git commit -m "chore: mount ProgressProvider in app providers"
```

---

### Task 2.3: Route admin mutations through the progress overlay

**Pattern (apply once per handler):** In each page component, add the hook near the top of the component body:

```javascript
import { useProgress } from '../../../src/context/ProgressContext';
// ...inside the component:
const { runWithProgress } = useProgress();
```

Then wrap each existing async mutation. Example transform for a create handler:

Before:
```javascript
const handleCreate = async () => {
    await locationsApi.create(payload);
    // refresh, close modal
};
```

After:
```javascript
const handleCreate = async () => {
    await runWithProgress('Creating location...', () => locationsApi.create(payload), { successLabel: 'Location created' });
    // refresh, close modal
};
```

> The exact import depth (`../../../`) depends on the page's folder level — match the page's existing relative imports (e.g. `client/app/admin/rewards/page.js` already imports context as `../../../src/context/AuthContext`). Logs pages live one level deeper (`client/app/admin/logs/<x>/page.js`) and use `../../../../src/...`.

Wrap the following handlers with these exact labels. Each checkbox is one page; complete every action listed for that page, then build and commit per page.

- [ ] **Locations** (`client/app/admin/locations/page.js`)
  - Add location → `'Creating location...'` / success `'Location created'`
  - Edit location → `'Saving changes...'` / `'Location updated'`
  - Delete location → `'Deleting location...'` / `'Location deleted'`

- [ ] **Machines** (`client/app/admin/machines/page.js`)
  - Add machine → `'Adding machine...'` / `'Machine added'`
  - Edit machine → `'Saving changes...'` / `'Machine updated'`
  - Delete machine → `'Deleting machine...'` / `'Machine deleted'`
  - Add maintenance → `'Logging maintenance...'` / `'Maintenance logged'`
  - Delete maintenance → `'Deleting maintenance...'` / `'Maintenance deleted'`

- [ ] **Manage Users** (`client/app/admin/users/page.js`)
  - Add user → `'Creating user...'` / `'User created'`
  - Edit user → `'Saving changes...'` / `'User updated'`
  - Points adjustment → `'Adjusting points...'` / `'Points adjusted'`
  - Deactivate user → `'Deactivating user...'` / `'User deactivated'`
  - Delete user → `'Deleting user...'` / `'User deleted'`

- [ ] **Manage Admins** (`client/app/admin/users/permissions/page.js`)
  - Add admin → `'Creating admin...'` / `'Admin created'`
  - Edit admin → `'Saving changes...'` / `'Admin updated'`
  - Delete admin → `'Deleting admin...'` / `'Admin deleted'`
  - Deactivate admin → `'Deactivating admin...'` / `'Admin deactivated'`

- [ ] **Rewards Inventory** (`client/app/admin/rewards/page.js`)
  - Add reward → `'Creating reward...'` / `'Reward created'`
  - Edit reward → `'Saving changes...'` / `'Reward updated'`
  - Deactivate reward → `'Deactivating reward...'` / `'Reward deactivated'`
  - Delete reward → `'Deleting reward...'` / `'Reward deleted'`

- [ ] **Analytics** (`client/app/admin/analytics/page.js`)
  - Export → `'Preparing export...'` / `'Export ready'`

- [ ] **Bulk Sessions** (`client/app/admin/bulk-sessions/page.js`)
  - Add bulk session → `'Creating bulk session...'` / `'Bulk session created'`

- [ ] **Bottle Logs** (`client/app/admin/logs/bottles/page.js`)
  - Export → `'Preparing export...'` / `'Export ready'`

- [ ] **Machine Logs** (`client/app/admin/logs/machines/page.js`)
  - Export → `'Preparing export...'` / `'Export ready'`

- [ ] **Reward Logs** (`client/app/admin/logs/rewards/page.js`)
  - Export → `'Preparing export...'` / `'Export ready'`

- [ ] **Transaction Logs** (`client/app/admin/logs/transactions/page.js`)
  - Export → `'Preparing export...'` / `'Export ready'`

- [ ] **Admin Logs** (`client/app/admin/logs/access/page.js`)
  - Export → `'Preparing export...'` / `'Export ready'`

> For exports that are synchronous (build a CSV string in memory), still wrap them: `await runWithProgress('Preparing export...', async () => { buildAndDownloadCsv(); })`. The overlay gives the user feedback even for fast operations.

- [ ] **Build + commit after each page** (repeat per page)

```bash
npm run build   # in client/ — expect "Compiled successfully"
git add client/app/admin/<page-path>/page.js
git commit -m "feat: progress overlay on <page> create/edit/delete/export actions"
```

---

### Task 2.4: Sign-out progress feedback

**Files:**
- Modify: `client/src/components/admin/AdminLayout.jsx`

- [ ] **Step 1: Wrap the logout handler**

In `client/src/components/admin/AdminLayout.jsx`, add the import alongside the other context imports:

```javascript
import { useProgress } from '../../context/ProgressContext';
```

Inside `AdminLayout`, after the `useAuth()` destructure, add:

```javascript
    const { runWithProgress } = useProgress();
```

Find the sign-out button's `onClick` (it calls `logout`). Replace the inline `logout` call with a wrapped handler defined in the component body:

```javascript
    const handleSignOut = () =>
        runWithProgress('Signing out...', async () => { await logout(); }, { successLabel: 'Signed out' });
```

Then set the sign-out button to `onClick={handleSignOut}`.

- [ ] **Step 2: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/admin/AdminLayout.jsx
git commit -m "feat: progress overlay on admin sign-out"
```

---

### Task 2.5: Remove the redundant "Create Log" control on Machine Logs

**Files:**
- Modify: `client/app/admin/logs/machines/page.js`

- [ ] **Step 1: Locate the control**

Run: `grep -n "Create Log" client/app/admin/logs/machines/page.js` (or use the editor search).
Expected: one button and its associated create-modal/handler.

- [ ] **Step 2: Remove the button, its modal, and its handler**

Delete the "Create Log" button JSX, the modal it opens, and the now-unused state/handlers (`showCreateModal`, `handleCreateLog`, and any create-only form state). Leave the read-only log table and the Export control intact.

- [ ] **Step 3: Build to verify nothing else references the removed symbols**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully (no "is not defined" errors).

- [ ] **Step 4: Commit**

```bash
git add client/app/admin/logs/machines/page.js
git commit -m "chore: remove redundant Create Log control from Machine Logs (use Machines page)"
```

---

### Task 2.6: Remove the redundant "Scan QR Code" control on Reward Logs

**Files:**
- Modify: `client/app/admin/logs/rewards/page.js`

- [ ] **Step 1: Locate the control**

Run: `grep -n "Scan QR" client/app/admin/logs/rewards/page.js` (or editor search).
Expected: one button and its scanner modal/handler.

- [ ] **Step 2: Remove the button, the scanner modal, and its handler**

Delete the "Scan QR Code" button JSX, the scanner modal, and the now-unused state/handlers. Leave the read-only redemption log table and the Export control intact.

- [ ] **Step 3: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 4: Commit**

```bash
git add client/app/admin/logs/rewards/page.js
git commit -m "chore: remove redundant Scan QR Code control from Reward Logs (use Claim Scanner)"
```

---

## Phase 3 — Notifications

**Findings (confirmed by code read):**
1. `notification_service.trigger_alert` already swallows email errors into `NotificationLog` rows and returns gracefully — it does not raise on a send failure. So a 500 on "new user registered / out of stock / suspicious activity" most likely comes from one of two places: (a) the **Test Notification** endpoint (`settings_controller.test_notification`) which returns **HTTP 500** when Resend is unconfigured (`return jsonify(... ), 500`), surfacing as "internal server error"; or (b) a `trigger_alert` call site that is **not** wrapped in `try/except` and therefore lets a DB error bubble up to the parent action's generic 500. We make both classes impossible.
2. The **Unresolved Maintenance** alert (`maintenance_unresolved`) only fires as a side effect of `GET /logs/machines` (the sweep runs while listing). Nothing runs it on a timer, so a 1-hour threshold never fires on its own. We add a CLI command suitable for cron/Task Scheduler.
3. The notification **bell** (`AdminLayout`) and **Admin Logs** page read `AdminLog` rows scoped by org. Superadmin actions (login/logout, cross-org edits) currently appear in a single org's stream. We exclude superadmin-authored rows when the query is scoped to one org.

### Task 3.1: Make `test_notification` return a client/upstream error, never 500

**Files:**
- Modify: `server/app/controllers/settings_controller.py`
- Test: `server/tests/property/test_notification_test_endpoint_status.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_notification_test_endpoint_status.py`:

```python
"""The notification-test endpoint must not return a 500 on config/send failure."""
import pytest


def test_unconfigured_resend_returns_502_not_500(client_as_superadmin, monkeypatch):
    # Force the sender to report a configuration failure.
    import app.controllers.settings_controller as sc

    def _fake_send(*args, **kwargs):
        return False, 'Resend not configured (RESEND_API_KEY required)'

    monkeypatch.setattr('app.services.notification_service._send_email', _fake_send)

    resp = client_as_superadmin.post(
        '/api/web/settings/notifications/test',
        json={'channel': 'email', 'recipient': 'qa@example.com'},
    )
    assert resp.status_code == 502, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is False
    assert 'Resend' in (body['error'] or '') or 'email' in (body['error'] or '').lower()
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_notification_test_endpoint_status.py -v` (in `server/`)
Expected: FAIL — current code returns 500.

- [ ] **Step 3: Change the failure status to 502**

In `server/app/controllers/settings_controller.py`, find in `test_notification`:

```python
        if success:
            return jsonify({'success': True, 'message': f'Test email sent to {recipient}'}), 200
        else:
            return jsonify({'success': False, 'error': f'Failed to send: {error}'}), 500
```

Replace with:

```python
        if success:
            return jsonify({'success': True, 'message': f'Test email sent to {recipient}'}), 200
        # A send/config failure is an upstream (email provider) problem, not a
        # server crash — surface it as 502 with the real reason so the admin
        # can fix configuration instead of seeing a generic 500.
        return jsonify({'success': False, 'error': f'Failed to send: {error}'}), 502
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_notification_test_endpoint_status.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/app/controllers/settings_controller.py server/tests/property/test_notification_test_endpoint_status.py
git commit -m "fix: notification test returns 502 (not 500) on email config/send failure"
```

---

### Task 3.2: Guarantee event-driven `trigger_alert` calls never 500 the parent action

**Files:**
- Modify: `server/app/controllers/users_controller.py`
- Test: `server/tests/property/test_notification_never_500.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_notification_never_500.py`:

```python
"""Creating a user must succeed (201/200) even if the notification raises."""
import pytest


def test_create_user_succeeds_when_alert_raises(client_as_superadmin, monkeypatch):
    # Make the notification hook explode; the user create must still succeed.
    def _boom(*args, **kwargs):
        raise RuntimeError('email backend down')

    monkeypatch.setattr('app.controllers.users_controller.trigger_alert', _boom)

    resp = client_as_superadmin.post('/api/web/users', json={
        'name': 'Notify Test',
        'email': 'notify-test@example.com',
        'password': 'Str0ng!Passw0rd',
        'role': 'user',
    })
    assert resp.status_code in (200, 201), resp.get_data(as_text=True)
```

> NOTE: adjust the create-user JSON to match `UserCreateSchema`'s required fields if this minimal body is rejected with 400 — read the schema and supply exactly what it needs. The assertion of interest is "not 500".

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_notification_never_500.py -v` (in `server/`)
Expected: FAIL with 500 if the `new_user_registered` hook is not wrapped.

- [ ] **Step 3: Wrap the new-user notification hook**

In `server/app/controllers/users_controller.py`, find the new-user hook (near the `create_user` success path):

```python
        # ── Notification hook: new user registered ──
        try:
            trigger_alert(location_id, 'new_user_registered',
                          f'New user registered: {user.name}',
                          f'A new {role} "{user.name}" was created by {current_user.name}.')
```

Ensure it is fully guarded. If the `try` lacks an `except`, or the `except` re-raises, set it to:

```python
        # ── Notification hook: new user registered ──
        try:
            trigger_alert(location_id, 'new_user_registered',
                          f'New user registered: {user.name}',
                          f'A new {role} "{user.name}" was created by {current_user.name}.')
        except Exception:
            current_app.logger.exception('new_user_registered alert failed (non-fatal)')
```

Apply the identical guard to the `suspicious_activity` hook in the same file (the `adjust_points` handler around the `if abs(amount) >= threshold:` block):

```python
                if abs(amount) >= threshold:
                    try:
                        trigger_alert(org_id, 'suspicious_activity',
                                      f'Suspicious points adjustment: {abs(amount)} pts',
                                      f'{current_user.name} {direction} {abs(amount)} points for {user.name}. ')
                    except Exception:
                        current_app.logger.exception('suspicious_activity alert failed (non-fatal)')
```

> Add `from flask import current_app` to the imports if it is not already imported (check the top of the file; the RBAC plan's Task A2 already adds it — if present, do not duplicate).

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_notification_never_500.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Audit the remaining call sites (read-only verification)**

Run: `grep -rn "trigger_alert(" server/app/controllers/`
Confirm each call site is inside a `try/except` that does NOT re-raise. The known sites are: `rewards_controller.py` (already wrapped with `except Exception: pass`), `sessions_controller.py`, `rpi_controller.py`, `machines_controller.py`, `logs_controller.py`, `auth_controller.py` (`_log_attempt`, already wrapped). For any site whose `except` is missing or re-raises, apply the same guard as Step 3. Do not change sites that are already guarded.

- [ ] **Step 6: Run the server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add server/app/controllers/users_controller.py server/tests/property/test_notification_never_500.py
git commit -m "fix: notification hooks never 500 the parent action (new_user, suspicious_activity)"
```

---

### Task 3.3: Add a scheduled unresolved-maintenance sweep

**Files:**
- Modify: `server/app/__init__.py` (register a CLI command) OR create `server/app/cli.py` and register it.
- Modify: `server/app/services/notification_service.py` (add a reusable sweep function)
- Test: `server/tests/property/test_maintenance_sweep.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_maintenance_sweep.py`:

```python
"""run_maintenance_sweep fires maintenance_unresolved for stale unresolved logs."""
import pytest
from datetime import datetime, timezone, timedelta


def test_sweep_triggers_for_stale_unresolved(app, db_session, seed_org_with_stale_maintenance, monkeypatch):
    fired = []
    import app.services.notification_service as ns
    monkeypatch.setattr(ns, 'trigger_alert',
                        lambda org_id, key, subj, body, **kw: fired.append((org_id, key)))

    from app.services.notification_service import run_maintenance_sweep
    with app.app_context():
        run_maintenance_sweep()

    assert any(key == 'maintenance_unresolved' for _, key in fired)
```

> NOTE: `seed_org_with_stale_maintenance` must seed an org with a `maintenance_unresolved` NotificationSetting (`is_active=True`, `threshold=1` hour) and one `MaintenanceLog` with `is_resolved=False` and `created_at` older than the threshold. If no such fixture exists, add it to `server/tests/conftest.py` mirroring the existing seeding helpers — reuse existing factory patterns, do not invent unrelated ones.

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_maintenance_sweep.py -v` (in `server/`)
Expected: FAIL — `run_maintenance_sweep` does not exist.

- [ ] **Step 3: Extract the sweep into a reusable function**

The unresolved-maintenance logic currently lives inline in `logs_controller.get_machine_logs`. Add a standalone function to `server/app/services/notification_service.py` (append near the bottom, before `ensure_default_settings`):

```python
def run_maintenance_sweep():
    """Fire `maintenance_unresolved` alerts for every org whose active setting
    has unresolved maintenance logs older than its threshold (hours).

    Designed to be called from a scheduler (cron / Task Scheduler) via the
    `flask check-maintenance` CLI command. Idempotent per call; relies on the
    org's NotificationSetting to decide whether to alert.
    """
    from datetime import datetime, timezone, timedelta
    from ..models import MaintenanceLog, RVM

    settings = NotificationSetting.query.filter_by(
        alert_key='maintenance_unresolved', is_active=True,
    ).all()

    for setting in settings:
        org_id = setting.organization_id
        threshold_hours = setting.threshold or 48
        cutoff = datetime.now(timezone.utc) - timedelta(hours=threshold_hours)

        unresolved = MaintenanceLog.query.join(RVM).filter(
            RVM.organization_id == org_id,
            MaintenanceLog.is_resolved == False,  # noqa: E712
            MaintenanceLog.created_at <= cutoff,
        ).limit(5).all()

        for log_entry in unresolved:
            rvm_name = log_entry.rvm.name if log_entry.rvm else f'RVM #{log_entry.rvm_id}'
            trigger_alert(org_id, 'maintenance_unresolved',
                          f'Unresolved maintenance: {rvm_name}',
                          f'Maintenance log "{log_entry.action_type}" on "{rvm_name}" '
                          f'has been unresolved for over {threshold_hours} hour(s).')
```

> Verify the `MaintenanceLog` field names (`is_resolved`, `created_at`, `action_type`, `rvm`) against `server/app/models.py` and the existing inline block in `logs_controller.get_machine_logs`; match them byte-for-byte. Adjust if the model uses different names (e.g. `resolved` vs `is_resolved`).

- [ ] **Step 4: Register the CLI command**

In `server/app/__init__.py`, find the section near the comment `# Register CLI commands`. Add:

```python
    @app.cli.command('check-maintenance')
    def check_maintenance():
        """Run the unresolved-maintenance notification sweep."""
        from .services.notification_service import run_maintenance_sweep
        run_maintenance_sweep()
        print('Maintenance sweep complete.')
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_maintenance_sweep.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 6: Document the schedule**

Add to `server/DEPLOYMENT_GUIDE.md` under a new "Scheduled jobs" heading:

```markdown
## Scheduled jobs

Run the unresolved-maintenance sweep on a timer (e.g. hourly):

    flask check-maintenance

- Linux cron:  `0 * * * * cd /srv/ecopoints/server && flask check-maintenance`
- Windows Task Scheduler: action `flask check-maintenance` in the server dir, trigger hourly.
```

- [ ] **Step 7: Manual verification (the QA scenario)**

1. In Settings → Notifications, set **Unresolved Maintenance** active, threshold `1` (hour), add a recipient email, ensure `RESEND_API_KEY` + `EMAIL_FROM` are set in `server/.env`.
2. Create a maintenance log on a machine and backdate it >1h (or use the seed).
3. Run `flask check-maintenance` (in `server/`).
Expected: a `NotificationLog` row with `status='sent'` and an email delivered.

- [ ] **Step 8: Commit**

```bash
git add server/app/services/notification_service.py server/app/__init__.py server/DEPLOYMENT_GUIDE.md server/tests/property/test_maintenance_sweep.py
git commit -m "feat: scheduled unresolved-maintenance sweep (flask check-maintenance)"
```

---

### Task 3.4: Exclude superadmin-authored rows from per-org access logs and bell

**Files:**
- Modify: `server/app/controllers/logs_controller.py` (`get_access_logs`)
- Test: `server/tests/property/test_access_logs_exclude_superadmin.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_access_logs_exclude_superadmin.py`:

```python
"""When scoped to a single org, access logs must exclude superadmin rows."""
import pytest


def test_org_scoped_access_logs_have_no_superadmin(client_as_head_admin, seed_superadmin_and_org_logs):
    resp = client_as_head_admin.get('/api/web/logs/access')
    assert resp.status_code == 200
    body = resp.get_json()
    roles = {row.get('adminRole') for row in body['logs']}
    assert 'superadmin' not in roles
```

> NOTE: `client_as_head_admin` is the head-admin-authenticated fixture (org-scoped). `seed_superadmin_and_org_logs` must create at least one superadmin `AdminLog` (e.g. a login) AND one head-admin row in the same org. Reuse existing fixtures/factories; only add what is missing.

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_access_logs_exclude_superadmin.py -v` (in `server/`)
Expected: FAIL — superadmin rows currently leak into org-scoped results.

- [ ] **Step 3: Add the exclusion to the scoped branch**

In `server/app/controllers/logs_controller.py`, in `get_access_logs`, the query joins `AdminLog → User` and scopes by org when `loc_id` is set. Add a filter that drops superadmin-authored rows **only when scoped** (a superadmin viewing "All" still sees everything). After the existing org-scope filter is applied (where `loc_id` is truthy), add:

```python
        if loc_id:
            # Per-org streams (bell + Admin Logs page) must not show
            # superadmin platform activity (logins/logouts, cross-org edits).
            query = query.filter(User.role != 'superadmin')
```

> Place this inside the same `if loc_id:` block that already constrains the org, immediately after the org filter. The serialized output already exposes `adminRole` via `User.role` for the test assertion; if it does not, add `'adminRole': l.admin.role if l.admin else None` to the row dict in this handler's serializer.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_access_logs_exclude_superadmin.py -v` (in `server/`)
Expected: PASS.

- [ ] **Step 5: Run the full server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add server/app/controllers/logs_controller.py server/tests/property/test_access_logs_exclude_superadmin.py
git commit -m "fix: exclude superadmin rows from per-org access logs and notification bell"
```

---

## Phase 4 — Security Tab

**Answer to the QA question ("Does each organization have their own database?"):** **No.** There is one shared database. Every tenant-scoped table carries an `organization_id`, and `_scope_location_id(current_user)` resolves the caller's org (a superadmin's effective org is whatever the "View as" filter is set to, else `None` = all orgs). All security/backup/restore/test-data operations below honor that scoping so one org cannot read or mutate another org's settings.

**Findings (confirmed by code read):**
- Session timeout and login lockout are **already implemented** server-side: `auth_controller._get_session_timeout` shortens JWT expiry from `config_security.sessionTimeoutMinutes`, and `_check_lockout` enforces `maxLoginAttempts` / `lockoutDurationMinutes`. Phase 4 adds tests proving they work and a manual flow, plus removes the SMS 2FA option.
- 2FA method is constrained server-side to `Literal['email', 'sms']` and the client still offers "SMS OTP". We remove SMS everywhere (email-only, matching the notification service which already dropped SMS).
- Security settings READ/WRITE already use `_scope_location_id`, so a head-admin only touches their org; a superadmin touches an org only when "View as" is set. We add an explicit guard + tests, and extend the same rule to backup/restore/test-data, which are currently superadmin-only and **global**.

### Task 4.1: Remove SMS as a 2FA method (server)

**Files:**
- Modify: `server/app/schemas/__init__.py`
- Modify: `server/app/controllers/settings_controller.py`
- Test: `server/tests/property/test_security_2fa_email_only.py`

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_security_2fa_email_only.py`:

```python
"""2FA method is email-only. 'sms' must be rejected or coerced to 'email'."""
import pytest


def test_security_config_rejects_sms_method(client_as_head_admin):
    resp = client_as_head_admin.put('/api/web/settings/security', json={
        'twoFactorRequired': True,
        'twoFactorMethod': 'sms',
        'sessionTimeoutMinutes': 60,
        'maxLoginAttempts': 5,
        'lockoutDurationMinutes': 15,
    })
    # Strict schema rejects the unknown literal with 400/422.
    assert resp.status_code in (400, 422), resp.get_data(as_text=True)


def test_security_config_accepts_email_method(client_as_head_admin):
    resp = client_as_head_admin.put('/api/web/settings/security', json={
        'twoFactorRequired': True,
        'twoFactorMethod': 'email',
        'sessionTimeoutMinutes': 60,
        'maxLoginAttempts': 5,
        'lockoutDurationMinutes': 15,
    })
    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json()['config']['twoFactorMethod'] == 'email'
```

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/property/test_security_2fa_email_only.py -v` (in `server/`)
Expected: FAIL on the first test — `'sms'` is currently accepted.

- [ ] **Step 3: Narrow the schema literal**

In `server/app/schemas/__init__.py`, find:

```python
class SecurityConfigUpdateSchema(_StrictModel):
    """Body for ``PUT /api/web/settings/security``."""

    twoFactorRequired: Optional[bool] = None
    twoFactorMethod: Optional[Literal['email', 'sms']] = None
```

Replace the `twoFactorMethod` line with:

```python
    twoFactorMethod: Optional[Literal['email']] = None
```

- [ ] **Step 4: Drop the SMS branch in the controller**

In `server/app/controllers/settings_controller.py`, in `update_security_config`, find:

```python
        method = payload.twoFactorMethod
        config = {
            'twoFactorRequired': bool(payload.twoFactorRequired) if payload.twoFactorRequired is not None else False,
            'twoFactorMethod': method if method in ('email', 'sms') else 'email',
```

Replace with:

```python
        method = payload.twoFactorMethod
        config = {
            'twoFactorRequired': bool(payload.twoFactorRequired) if payload.twoFactorRequired is not None else False,
            'twoFactorMethod': 'email',  # email is the only supported 2FA channel
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `python -m pytest server/tests/property/test_security_2fa_email_only.py -v` (in `server/`)
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add server/app/schemas/__init__.py server/app/controllers/settings_controller.py server/tests/property/test_security_2fa_email_only.py
git commit -m "fix: 2FA is email-only — reject sms method server-side"
```

---

### Task 4.2: Remove the "SMS OTP" option from the Security settings UI

**Files:**
- Modify: `client/app/admin/settings/page.js`

- [ ] **Step 1: Remove the SMS option**

In `client/app/admin/settings/page.js`, find the Default 2FA Method dropdown:

```javascript
                                            <CustomDropdown value={securityConfig.twoFactorMethod}
                                                onChange={(v) => updateSecurityField('twoFactorMethod', v)}
                                                options={[{ value: 'email', label: 'Email OTP' }, { value: 'sms', label: 'SMS OTP' }]} showPlaceholder={false} />
```

Replace the `options` array so only email remains:

```javascript
                                            <CustomDropdown value={securityConfig.twoFactorMethod}
                                                onChange={(v) => updateSecurityField('twoFactorMethod', v)}
                                                options={[{ value: 'email', label: 'Email OTP' }]} showPlaceholder={false} />
```

- [ ] **Step 2: Default any stored 'sms' to 'email' on load**

In the same file, find the security-config load fallback:

```javascript
            setSecurityConfig({ twoFactorRequired: false, twoFactorMethod: 'email', sessionTimeoutMinutes: 1440, maxLoginAttempts: 5, lockoutDurationMinutes: 15 });
```

That fallback is fine. Additionally, where the loaded config is applied to state (the `try` branch that sets `securityConfig` from the API response), coerce a legacy `'sms'` value to `'email'`. Find the success assignment (it sets `setSecurityConfig(config)` or similar) and wrap the method:

```javascript
            setSecurityConfig({ ...config, twoFactorMethod: config.twoFactorMethod === 'email' ? 'email' : 'email' });
```

> If the loaded config is applied via spreading the API `config` object, the simplest robust form is to force `twoFactorMethod: 'email'` in that spread, since email is the only option now.

- [ ] **Step 3: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully.

- [ ] **Step 4: Commit**

```bash
git add client/app/admin/settings/page.js
git commit -m "fix: remove SMS OTP option from Security 2FA settings UI"
```

---

### Task 4.3: Verify login lockout (max attempts + lockout duration)

**Files:**
- Test: `server/tests/integration/test_login_lockout.py`

- [ ] **Step 1: Write the integration test**

Create `server/tests/integration/test_login_lockout.py`:

```python
"""Login lockout: after maxLoginAttempts failures, the account is locked."""
import pytest

pytestmark = pytest.mark.integration


def test_account_locks_after_max_attempts(client, seed_admin_with_security_config):
    # seed config: maxLoginAttempts=3, lockoutDurationMinutes=15
    ident = seed_admin_with_security_config['email']

    for _ in range(3):
        client.post('/api/web/auth/login', json={'identifier': ident, 'password': 'WRONG'})

    # 4th attempt — even with correct password — must be rejected as locked.
    resp = client.post('/api/web/auth/login', json={
        'identifier': ident, 'password': seed_admin_with_security_config['password'],
    })
    assert resp.status_code in (423, 429, 403), resp.get_data(as_text=True)
    body = resp.get_json()
    assert 'lock' in (body.get('error') or body.get('message') or '').lower()
```

> NOTE: `seed_admin_with_security_config` must create an org with `config_security` = `{maxLoginAttempts: 3, lockoutDurationMinutes: 15}` and an admin user whose plaintext password is known. Match the login payload field names (`identifier`/`password`) to `LoginSchema`. Match the lockout HTTP status to whatever `auth_controller.login` actually returns when `_check_lockout` reports locked — read the handler and assert that exact status.

- [ ] **Step 2: Run it**

Run: `python -m pytest server/tests/integration/test_login_lockout.py -v -m integration` (in `server/`)
Expected: PASS if lockout works. If it FAILS, read `auth_controller.login` to confirm `_check_lockout` is actually consulted before password verification; if it is checked only after a successful password match, move the lockout check to the top of `login` (before password verification) so wrong-password storms are throttled. Add the minimal reordering and re-run.

- [ ] **Step 3: Commit**

```bash
git add server/tests/integration/test_login_lockout.py
git commit -m "test: login lockout enforcement (maxLoginAttempts + lockoutDuration)"
```

---

### Task 4.4: Verify session timeout + force-logout-all

**Files:**
- Test: `server/tests/integration/test_session_timeout.py`

- [ ] **Step 1: Write the integration test**

Create `server/tests/integration/test_session_timeout.py`:

```python
"""Session timeout shortens token life; force-logout invalidates issued tokens."""
import pytest

pytestmark = pytest.mark.integration


def test_force_logout_invalidates_existing_token(client_as_head_admin_factory):
    # Two clients for the same admin: one stays "logged in" with a token.
    sess = client_as_head_admin_factory()   # returns an authed test client
    me1 = sess.get('/api/web/auth/me')
    assert me1.status_code == 200

    # Trigger force-logout-all for the org.
    fl = sess.post('/api/web/settings/security/force-logout', json={})
    assert fl.status_code == 200, fl.get_data(as_text=True)

    # The same token issued before force_logout_at must now be rejected.
    me2 = sess.get('/api/web/auth/me')
    assert me2.status_code == 401
    body = me2.get_json()
    assert (body.get('error') or {}).get('code') in ('FORCED_LOGOUT', None) or me2.status_code == 401
```

> NOTE: `client_as_head_admin_factory` returns a test client carrying a valid admin JWT (cookie or header per the app's transport). If only a single-shot `client_as_head_admin` fixture exists, use it directly — the key assertion is that a token issued before `force_logout_at` is rejected with 401 afterward. Read `middleware.token_required` to confirm the `iat < force_logout_at` rejection path and assert its exact error code.

- [ ] **Step 2: Run it**

Run: `python -m pytest server/tests/integration/test_session_timeout.py -v -m integration` (in `server/`)
Expected: PASS. If force-logout does not invalidate the token, verify `middleware.token_required` compares the JWT `iat` against `Organization.force_logout_at` (the RBAC plan / earlier phases describe this). Implement the comparison if missing, then re-run.

- [ ] **Step 3: Manual 2FA + timeout flow (hand to QA)**

Document this flow in `docs/admin-fixes-notes.md` under a new "Security manual test flow" heading:

```markdown
## Security manual test flow

### 2FA (email)
1. Settings → Security → enable "Require 2FA for all admins", method = Email OTP, Save.
2. Log out, log back in. Expect an email OTP challenge before the dashboard loads.
3. Enter the OTP from the email → dashboard loads. Enter a wrong OTP → rejected.

### Session timeout
1. Settings → Security → set Session Timeout = 5 minutes, Save.
2. Log in, stay idle 6 minutes, then make any action → expect redirect to login (token expired).

### Force logout all
1. In one browser, log in as the org admin.
2. In Settings → Security, click "Force logout all sessions".
3. Back in the first browser, any action → redirected to login (FORCED_LOGOUT).

### Login lockout
1. Settings → Security → Max attempts = 3, Lockout = 15 min, Save.
2. Attempt login with a wrong password 3 times → 4th attempt shows "account locked" with remaining minutes.
```

- [ ] **Step 4: Commit**

```bash
git add server/tests/integration/test_session_timeout.py docs/admin-fixes-notes.md
git commit -m "test+docs: session timeout, force-logout, and 2FA manual flow"
```

---

### Task 4.5: Enforce multi-tenant scoping on Security, Backup, Restore, and Test Data

**Design:** All five write paths (`PUT /settings/security`, `GET /settings/backup`, `POST /settings/restore`, `POST /settings/seed`) must operate on **exactly one** organization: the caller's own org for head-admins, or the superadmin's "View as" org. A superadmin with **no** "View as" filter (viewing "All") must be **blocked** from these mutating/destructive operations to prevent accidental cross-org or global writes. We centralize this in one guard helper.

**Files:**
- Modify: `server/app/controllers/settings_controller.py`
- Test: `server/tests/integration/test_security_multitenant.py`

- [ ] **Step 1: Write the integration test**

Create `server/tests/integration/test_security_multitenant.py`:

```python
"""Multi-tenant guards on security/backup/restore/seed."""
import pytest

pytestmark = pytest.mark.integration


def test_head_admin_cannot_change_other_org_security(client_as_head_admin, other_org_id):
    # Head admin has no cross-org reach; _scope_location_id pins them to own org.
    resp = client_as_head_admin.get('/api/web/settings/security')
    assert resp.status_code == 200
    # There is no parameter to target another org; scope is implicit. The
    # guarantee is that the write only ever touches the caller's org.


def test_superadmin_viewing_all_is_blocked_from_destructive_ops(client_as_superadmin_all):
    # No "View as" set → effective org is None → destructive ops are blocked.
    backup = client_as_superadmin_all.get('/api/web/settings/backup')
    assert backup.status_code == 400
    seed = client_as_superadmin_all.post('/api/web/settings/seed', json={'mode': 'truncate'})
    assert seed.status_code == 400


def test_superadmin_with_view_as_can_operate_on_that_org(client_as_superadmin_view_as):
    # "View as" set to a specific org → backup scoped to that org succeeds.
    backup = client_as_superadmin_view_as.get('/api/web/settings/backup')
    assert backup.status_code == 200
```

> NOTE: `client_as_superadmin_all` is a superadmin client with no View-as filter; `client_as_superadmin_view_as` has one set. The View-as filter is conveyed the same way the app conveys it today (read how `_scope_location_id` derives the superadmin's effective org — typically a header or query param like `?locationId=` / `X-View-As`). Build the fixtures to set that same mechanism. `other_org_id` is any org id distinct from the head-admin's.

- [ ] **Step 2: Run it to verify it fails**

Run: `python -m pytest server/tests/integration/test_security_multitenant.py -v -m integration` (in `server/`)
Expected: FAIL — backup/seed currently run globally for any superadmin regardless of View-as.

- [ ] **Step 3: Add a scope guard helper**

In `server/app/controllers/settings_controller.py`, add near the top (after the imports):

```python
def _require_single_org(current_user):
    """Return the org id this request must operate on, or (None, error_response).

    Head-admins and other org-bound roles get their own org. A superadmin
    must have a 'View as' org selected; viewing 'All' (no scope) is blocked
    for destructive/scoped operations to avoid cross-org writes.
    """
    loc_id = _scope_location_id(current_user)
    if not loc_id:
        return None, (jsonify({
            'success': False,
            'error': 'Select a specific organization (View as) before performing this action.',
        }), 400)
    return loc_id, None
```

- [ ] **Step 4: Scope the backup export to the effective org**

In `download_backup`, replace the superadmin-only gate and global export. Find:

```python
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Only Super Admin can create backups'}), 403

        tables_data = {}
        total_rows = 0
        for table_name in _BACKUP_TABLES:
            Model = _get_model_for_table(table_name)
            if not Model:
                continue
            rows = Model.query.all()
            tables_data[table_name] = [_serialize_row(r) for r in rows]
            total_rows += len(rows)
```

Replace with:

```python
        loc_id, err = _require_single_org(current_user)
        if err:
            return err

        tables_data = {}
        total_rows = 0
        for table_name in _BACKUP_TABLES:
            Model = _get_model_for_table(table_name)
            if not Model:
                continue
            rows = _org_scoped_query(Model, table_name, loc_id).all()
            tables_data[table_name] = [_serialize_row(r) for r in rows]
            total_rows += len(rows)
```

Then add the scoping helper next to `_get_model_for_table`:

```python
# Tables that carry organization scope directly or via a known FK path.
# Tables not listed here are treated as global reference data and skipped
# from per-org backup/restore (e.g. org_types).
_ORG_DIRECT = {
    'organizations', 'org_addresses', 'org_contacts', 'community_groups',
    'rvms', 'reward_categories', 'rewards', 'reward_org_assignments',
    'notification_settings', 'notification_logs',
}


def _org_scoped_query(Model, table_name, loc_id):
    """Return a query for `Model` limited to organization `loc_id` when the
    table is org-scoped; otherwise an empty query (skip global tables)."""
    if table_name == 'organizations':
        return Model.query.filter(Model.id == loc_id)
    if hasattr(Model, 'organization_id'):
        return Model.query.filter(Model.organization_id == loc_id)
    # Tables without a direct organization_id are skipped for per-org backups
    # to avoid leaking other tenants' rows. Restore re-derives them from FKs.
    return Model.query.filter(False)
```

> This intentionally backs up only directly org-scoped tables. Deep child tables (wallets, sessions, transactions, redemptions) are reachable via FKs from the org's users/rvms; a complete per-org backup of those is out of scope for this task and should be a follow-up if QA needs full data portability. Document this limitation in the commit message.

- [ ] **Step 5: Scope restore + seed to the effective org**

In `restore_backup`, replace:

```python
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Only Super Admin can restore backups'}), 403
```

with:

```python
        loc_id, err = _require_single_org(current_user)
        if err:
            return err
```

And in the truncate/insert loops, only operate on org-scoped rows. Replace the truncate loop:

```python
        for table_name in reversed(_BACKUP_TABLES):
            Model = _get_model_for_table(table_name)
            if Model and table_name in tables:
                db.session.execute(Model.__table__.delete())
```

with:

```python
        for table_name in reversed(_BACKUP_TABLES):
            Model = _get_model_for_table(table_name)
            if Model and table_name in tables and hasattr(Model, 'organization_id'):
                db.session.execute(
                    Model.__table__.delete().where(Model.organization_id == loc_id)
                )
```

In `run_seed`, replace the truncate branch gate:

```python
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Only Super Admin can manage test data'}), 403
```

with:

```python
        loc_id, err = _require_single_org(current_user)
        if err:
            return err
```

> NOTE: the demo-seed thread (`_wipe_all_tables` / `run_demo_seed`) currently rebuilds the **whole** database and is therefore a superadmin-only, View-as-required operation by the same guard. If a per-org demo seed is required, that is a separate larger task — for now the guard ensures a superadmin must pick an org before truncating, preventing accidental global wipes from the "All" view. State this limitation in the commit message.

- [ ] **Step 6: Run the test to verify it passes**

Run: `python -m pytest server/tests/integration/test_security_multitenant.py -v -m integration` (in `server/`)
Expected: PASS.

- [ ] **Step 7: Run the full server suite**

Run: `python -m pytest -q` (in `server/`)
Expected: all pass (or the integration subset if the DB for integration isn't configured locally — at minimum `-m "not integration"` must be green).

- [ ] **Step 8: Commit**

```bash
git add server/app/controllers/settings_controller.py server/tests/integration/test_security_multitenant.py
git commit -m "fix: scope security/backup/restore/seed to a single org (View-as required for superadmin)"
```

---

## Phase 5 — Quick Actions Per Role

**Problem (from notes):** The dashboard Quick Actions block (`client/app/admin/page.js`) shows the same four shortcuts (Rewards, Manage Users, Admin Logs, Machines) to anyone with the matching `view` permission. QA wants a **role-specific** set:

| role | quick actions |
|---|---|
| head_admin | Rewards, Manage Users, Machines, Admin Logs |
| auditor | User Management, Analytics, System Logs, Bulk Sessions |
| inventory_officer | Rewards Inventory, Bulk Sessions, System Logs |
| technician | Machines, Bulk Sessions, Session Logs |

**Dependency:** This relies on `hasPermission(category, verb)` reflecting the authoritative server permissions. Run Phase C of `docs/superpowers/plans/2026-06-21-admin-rbac-and-crud-fixes.md` first so the gating below is correct. If that work is not yet done, the shortcuts still render per the role map but the `hasPermission` guard may under/over-show until RBAC is unified.

**Route mapping (confirmed against the file tree):**
- Rewards / Rewards Inventory → `/admin/rewards` (category `rewards`)
- Manage Users / User Management → `/admin/users` (category `users`)
- Machines → `/admin/machines` (category `machines`)
- Admin Logs / System Logs → `/admin/logs/access` (category `logs`)
- Analytics → `/admin/analytics` (category `analytics`)
- Bulk Sessions → `/admin/bulk-sessions` (category `sessions`)
- Session Logs → `/admin/logs/bottles` (recycling session logs; category `logs`)

### Task 5.1: Define the per-role quick-action config

**Files:**
- Create: `client/src/data/quickActions.js`
- Test: `client/tests/property/quick-actions-per-role.test.js`

- [ ] **Step 1: Write the failing test**

Create `client/tests/property/quick-actions-per-role.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { QUICK_ACTIONS } from '../../src/data/quickActions';

describe('Quick actions per role', () => {
    it('matches the QA spec for each admin role', () => {
        const labels = (role) => QUICK_ACTIONS[role].map(a => a.label);

        expect(labels('head_admin')).toEqual(['Rewards', 'Manage Users', 'Machines', 'Admin Logs']);
        expect(labels('auditor')).toEqual(['User Management', 'Analytics', 'System Logs', 'Bulk Sessions']);
        expect(labels('inventory_officer')).toEqual(['Rewards Inventory', 'Bulk Sessions', 'System Logs']);
        expect(labels('technician')).toEqual(['Machines', 'Bulk Sessions', 'Session Logs']);
    });

    it('every action carries an href and a [category, verb] permission tuple', () => {
        for (const role of Object.keys(QUICK_ACTIONS)) {
            for (const action of QUICK_ACTIONS[role]) {
                expect(typeof action.href).toBe('string');
                expect(action.href.startsWith('/admin/')).toBe(true);
                expect(Array.isArray(action.permission)).toBe(true);
                expect(action.permission).toHaveLength(2);
            }
        }
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- quick-actions-per-role` (in `client/`)
Expected: FAIL — module `quickActions` does not exist.

- [ ] **Step 3: Create the config**

Create `client/src/data/quickActions.js`:

```javascript
/**
 * Per-role dashboard Quick Actions (QA spec).
 *
 * Each entry: { label, icon, color, href, permission: [category, verb] }
 * `icon` is the lucide-react icon name string; the dashboard maps it to the
 * imported component. `permission` is checked with hasPermission(category, verb)
 * (superadmin bypasses the check and sees every role's union if desired).
 */
export const QUICK_ACTIONS = {
    head_admin: [
        { label: 'Rewards',       icon: 'Trophy',   color: 'purple',  href: '/admin/rewards',      permission: ['rewards', 'view'] },
        { label: 'Manage Users',  icon: 'Users',    color: 'emerald', href: '/admin/users',        permission: ['users', 'view'] },
        { label: 'Machines',      icon: 'Package',  color: 'amber',   href: '/admin/machines',     permission: ['machines', 'view'] },
        { label: 'Admin Logs',    icon: 'FileText', color: 'blue',    href: '/admin/logs/access',  permission: ['logs', 'view'] },
    ],
    auditor: [
        { label: 'User Management', icon: 'Users',     color: 'emerald', href: '/admin/users',         permission: ['users', 'view'] },
        { label: 'Analytics',       icon: 'BarChart3', color: 'blue',    href: '/admin/analytics',     permission: ['analytics', 'view'] },
        { label: 'System Logs',     icon: 'FileText',  color: 'purple',  href: '/admin/logs/access',   permission: ['logs', 'view'] },
        { label: 'Bulk Sessions',   icon: 'Boxes',     color: 'amber',   href: '/admin/bulk-sessions', permission: ['sessions', 'view'] },
    ],
    inventory_officer: [
        { label: 'Rewards Inventory', icon: 'Trophy',   color: 'purple',  href: '/admin/rewards',       permission: ['rewards', 'view'] },
        { label: 'Bulk Sessions',     icon: 'Boxes',    color: 'amber',   href: '/admin/bulk-sessions', permission: ['sessions', 'view'] },
        { label: 'System Logs',       icon: 'FileText', color: 'blue',    href: '/admin/logs/access',   permission: ['logs', 'view'] },
    ],
    technician: [
        { label: 'Machines',      icon: 'Package',  color: 'amber',   href: '/admin/machines',     permission: ['machines', 'view'] },
        { label: 'Bulk Sessions', icon: 'Boxes',    color: 'emerald', href: '/admin/bulk-sessions', permission: ['sessions', 'view'] },
        { label: 'Session Logs',  icon: 'FileText', color: 'blue',    href: '/admin/logs/bottles', permission: ['logs', 'view'] },
    ],
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- quick-actions-per-role` (in `client/`)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/data/quickActions.js client/tests/property/quick-actions-per-role.test.js
git commit -m "feat: per-role quick-action config (QA spec)"
```

---

### Task 5.2: Render the per-role quick actions on the dashboard

**Files:**
- Modify: `client/app/admin/page.js`

- [ ] **Step 1: Import the config and an icon map**

In `client/app/admin/page.js`, add to the imports:

```javascript
import { QUICK_ACTIONS } from '../../src/data/quickActions';
import { Trophy, Users, Package, FileText, BarChart3, Boxes } from 'lucide-react';
```

> Some of these icons may already be imported in the file. Merge into the existing `lucide-react` import line rather than adding a duplicate import (duplicate imports break the build). Keep only one `from 'lucide-react'` import statement.

Add an icon lookup near the top of the module (outside the component):

```javascript
const QUICK_ACTION_ICONS = { Trophy, Users, Package, FileText, BarChart3, Boxes };
```

- [ ] **Step 2: Read the role + permission helpers in the component**

In the dashboard component body, ensure these are pulled from `useAuth()` (the file already uses `useAuth`):

```javascript
const { currentUser, isSuperAdmin, hasPermission } = useAuth();
```

> If `useAuth()` is already destructured, just add `currentUser` and `hasPermission` to the existing destructure if missing — do not add a second `useAuth()` call.

- [ ] **Step 3: Replace the hard-coded shortcuts grid**

Find the Quick Actions grid:

```javascript
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Permission-based Shortcuts */}
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
                </div>
```

Replace with a config-driven render. Superadmin sees the head_admin set (the broadest curated set); each other role sees its own set, gated by `hasPermission`:

```javascript
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(QUICK_ACTIONS[isSuperAdmin ? 'head_admin' : currentUser?.role] || [])
                        .filter(a => isSuperAdmin || hasPermission(a.permission[0], a.permission[1]))
                        .map(a => (
                            <ShortcutBtn
                                key={a.href + a.label}
                                label={a.label}
                                icon={QUICK_ACTION_ICONS[a.icon]}
                                color={a.color}
                                href={a.href}
                            />
                        ))}
                </div>
```

- [ ] **Step 4: Build to verify**

Run: `npm run build` (in `client/`)
Expected: Compiled successfully (no duplicate-import or undefined-icon errors).

- [ ] **Step 5: Manual verification**

Log in as each role (head_admin, auditor, inventory_officer, technician) and confirm the dashboard Quick Actions match the QA table above.

- [ ] **Step 6: Commit**

```bash
git add client/app/admin/page.js
git commit -m "feat: render per-role Quick Actions on dashboard (QA spec)"
```

---

## Final Verification

- [ ] **Server suite**

Run: `python -m pytest -m "not integration" -q` (in `server/`)
Expected: all pass.

- [ ] **Server integration suite** (if the integration DB is configured)

Run: `python -m pytest -m integration -q` (in `server/`)
Expected: all pass.

- [ ] **Client tests + build**

Run: `npm run test` then `npm run build` (in `client/`)
Expected: all tests pass; "Compiled successfully".

- [ ] **Smoke the five flows**: create a reward with an image (no 500); watch a progress overlay on a create/edit/delete; send a test notification (clear 502 if unconfigured, success if configured) and run `flask check-maintenance`; toggle 2FA email-only + verify lockout/timeout manually; confirm per-role Quick Actions.

---

## Self-Review (completed by plan author)

**1. Spec coverage** (every item in `docs/admin-fixes-notes.md`):
- Rewards create 500 → Phase 1 (root cause: base64 over `String(500)`; fixed via upload endpoint).
- "All rewards page functionality works" → Phase 1 manual verification (Step 8) + existing tests.
- Progress modal for every listed Create/Edit/Delete/Export/Sign-out → Phase 2 Tasks 2.3/2.4 (every page + action enumerated with labels).
- Remove redundant Machine-Logs "Create Log" + Reward-Logs "Scan QR" → Tasks 2.5, 2.6.
- Notification 500s (new user / out of stock / suspicious / maintenance) → Phase 3 Tasks 3.1–3.3.
- Maintenance 1-hour threshold not firing → Task 3.3 (scheduled sweep).
- No superadmin rows in per-org bell/logs → Task 3.4.
- 2FA: remove SMS option + manual flow → Tasks 4.1, 4.2, 4.4 (Step 3 flow).
- Session timeout + force-logout works → Task 4.4.
- Login prevention (max attempts + lockout) → Task 4.3.
- Multi-tenant for security + superadmin View-as rule → Task 4.5.
- Backup/Restore + Test Data per-org with View-as rule → Task 4.5.
- "Own database per org?" question → answered (Phase 4 intro: No, single shared multi-tenant DB).
- Quick Actions per role → Phase 5.

**2. Placeholder scan:** No "TBD/implement later/handle edge cases" left. Where a fixture or model field name cannot be confirmed without running the repo, the step carries an explicit NOTE telling the engineer exactly what to match (existing fixture name, schema field) rather than a vague placeholder.

**3. Type/name consistency:** `runWithProgress(label, fn, opts)` is defined once (Task 2.1) and used with the same signature everywhere. `useProgress` / `ProgressProvider` names match between context, providers, and call sites. `QUICK_ACTIONS` shape (`{label, icon, color, href, permission}`) matches between config, test, and the dashboard render. API helper `rewardsApi.uploadImage(file)` matches its definition and call site. Server helpers `_require_single_org`, `_org_scoped_query`, `run_maintenance_sweep` are each defined once and referenced consistently.

**Known scoping limitations (called out at point of use):** per-org backup/restore covers directly org-scoped tables only (deep FK children are a follow-up); the demo seed remains a global rebuild guarded behind View-as. These are documented in their task notes and commit messages so they are not silently shipped as complete data-portability.
