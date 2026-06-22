# Design Document: Username Validation

## Overview

This feature adds live inline username validation to the Edit Profile modal in `ProfileSection.jsx`. The current modal only validates the username field on form submission — the backend rejects invalid values after a full round-trip. The goal is to surface format errors immediately on every keystroke and check uniqueness against the backend with a 500 ms debounce, matching the inline-error UX already used for the phone field and the password-checklist pattern.

### Key Outcomes

- **Synchronous format validation** on every keystroke (no spaces, starts with letter, 4–30 chars, allowed chars only).
- **Debounced uniqueness check** (500 ms) via a new `GET /api/web/auth/check-username` endpoint.
- **Save button gating** that blocks submission while any rule fails or the availability check is pending.
- **Visual feedback** — inline error text, a `Loader2` spinner while checking, and a green `CheckCircle` when the username is valid and available.

### Research Summary

The existing codebase already provides all the scaffolding needed:

- The `request()` helper in `client/src/services/api/client.js` handles auth cookies, CSRF tokens, and JSON envelope parsing. All new API methods follow the same `request('GET', '/auth/...')` pattern used by `me()`, `updateProfile()`, etc.
- `ProfileSection.jsx` already uses `phoneError` (rose-coloured text at `text-[11px]`) as the inline-error pattern to follow.
- The password checklist in the edit modal demonstrates live rule-evaluation on every keystroke.
- The backend `auth_controller.py` enforces username uniqueness and format as part of `PUT /auth/profile`, so the new lightweight endpoint simply re-uses the same database lookup without the mutation side-effects.
- The Flask blueprint is `auth_bp` with `url_prefix='/api/web/auth'`, so the new route is registered as `@auth_bp.route('/check-username', methods=['GET'])`.
- `fast-check` (v4) is already in `devDependencies` and used throughout `client/tests/property/` with Vitest.

---

## Architecture

The feature touches three layers:

```
┌─────────────────────────────────────────────────────────┐
│  Client: ProfileSection.jsx  (Edit Profile modal)       │
│  ─────────────────────────────────────────────────────  │
│  1. validateUsernameFormat(value)   ← pure function     │
│  2. useEffect debounce (500ms)      ← schedules check   │
│  3. checkUsernameAvailability(u)    ← API call          │
│  4. Derived render state            ← border/icon/error │
└───────────────────────┬─────────────────────────────────┘
                        │ GET /api/web/auth/check-username
                        │     ?username=<encoded>
┌───────────────────────▼─────────────────────────────────┐
│  Server: auth_controller.py                              │
│  check_username()  →  User.query.filter(…).first()       │
│  returns { available: true | false }                     │
└─────────────────────────────────────────────────────────┘
```

### State Machine

The username field can be in exactly one of four visual states at any time:

```
NEUTRAL  ──(non-empty input)──►  VALIDATING (format check, sync)
                                       │
                              format fails ──► ERROR
                                       │
                              format passes, same as saved ──► VALID
                                       │
                              format passes, differs from saved ──► LOADING
                                                                       │
                                                            API returns available: true ──► VALID
                                                            API returns available: false ──► ERROR
                                                            API throws ──► NEUTRAL (error cleared, save unblocked)
NEUTRAL  ◄──(input cleared)──  any state
```

---

## Components and Interfaces

### 1. `validateUsernameFormat(value: string): string | null`

A **pure function** extracted into the ProfileSection module (not exported — component-internal). Returns an error string or `null` when all rules pass.

```js
// Priority-ordered rules (first failure wins):
// 1. Empty string        → null (no error, no availability check)
// 2. Contains space      → "No spaces allowed."
// 3. Starts with non-letter → "Must start with a letter."
// 4. Length 1–3          → "Must be at least 4 characters."
// 5. Length > 30         → "Username must be 30 characters or fewer."
// 6. Disallowed chars    → "Only letters, numbers, underscores, hyphens, and dots are allowed."
// All pass               → null
```

The priority ordering is important: a string like `" a"` (space then letter) should return the spaces error, not the start-with-letter error.

### 2. `checkUsernameAvailability(username: string): Promise<boolean>`

A new method exported from `client/src/services/api/auth.js`. Follows the same pattern as other methods in that module.

```js
/** GET /api/web/auth/check-username — returns true if the username is available. */
export async function checkUsernameAvailability(username) {
    if (!username || typeof username !== 'string') {
        throw new Error('username must be a non-empty string');
    }
    const data = await request('GET', `/auth/check-username?username=${encodeURIComponent(username)}`);
    return data?.available === true;
}
```

The function propagates any rejection from `request()` to the caller — error handling is the component's responsibility (Requirement 6.5).

### 3. Username Validation State (ProfileSection.jsx additions)

New state variables added alongside the existing `editUsername` state:

```js
// '' | 'checking' | 'available' | 'taken' | 'error'
const [usernameCheckStatus, setUsernameCheckStatus] = useState('');
const [usernameError, setUsernameError] = useState('');
```

The debounce effect uses a `useEffect` with cleanup to cancel pending timers and ignore stale responses via a `cancelled` flag (in-flight response guard):

```js
useEffect(() => {
    // Clear previous results on every input change
    const formatError = validateUsernameFormat(editUsername);
    if (formatError) {
        setUsernameError(formatError);
        setUsernameCheckStatus('');
        return;
    }

    // Empty → neutral
    if (!editUsername) {
        setUsernameError('');
        setUsernameCheckStatus('');
        return;
    }

    // Same as saved username (case-insensitive) → immediately available
    if (editUsername.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
        setUsernameError('');
        setUsernameCheckStatus('available');
        return;
    }

    // Format passes and value differs → debounce the availability check
    setUsernameCheckStatus('checking');
    setUsernameError('');

    let cancelled = false;
    const timer = setTimeout(async () => {
        try {
            const available = await authApi.checkUsernameAvailability(editUsername);
            if (cancelled) return;
            if (available) {
                setUsernameCheckStatus('available');
                setUsernameError('');
            } else {
                setUsernameCheckStatus('taken');
                setUsernameError('Username already taken.');
            }
        } catch {
            if (cancelled) return;
            // Network/server error — clear spinner, don't block save
            setUsernameCheckStatus('error');
            setUsernameError('');
        }
    }, 500);

    return () => {
        cancelled = true;
        clearTimeout(timer);
    };
}, [editUsername, currentUser?.username]);
```

### 4. Save Button Gating Logic

The save button's `disabled` prop is derived from the validation state:

```js
const usernameBlocksSave = (() => {
    if (!editUsername) return false;                          // empty → optional, don't block
    if (usernameError) return true;                          // format error or "taken"
    if (usernameCheckStatus === 'checking') return true;     // availability pending
    if (usernameCheckStatus === '') return true;             // format valid but check not fired yet (debounce window)
    // 'available' or 'error' (network failure) → don't block
    return false;
})();
```

The existing save button's `disabled` condition is extended:

```jsx
<button
  disabled={isSubmitting || usernameBlocksSave}
  ...
>
```

### 5. Visual Feedback — Field Rendering

The username input is wrapped in a `relative` container to allow absolutely-positioned right-side icons, matching the approach used in the existing phone/password sections:

```jsx
<div className="relative">
  <input
    value={editUsername}
    onChange={(e) => setEditUsername(e.target.value)}
    className={`w-full pr-9 ... ${
      usernameError
        ? 'border-rose-400 focus:border-rose-400'
        : usernameCheckStatus === 'available'
          ? 'border-emerald-400 focus:border-emerald-400'
          : 'border-slate-200 focus:border-emerald-300'
    }`}
    ...
  />
  {/* Right-side icon */}
  {usernameCheckStatus === 'checking' && !usernameError && (
    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
  )}
  {usernameCheckStatus === 'available' && !usernameError && (
    <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
  )}
</div>
{/* Inline error */}
{usernameError && (
  <p className="text-[11px] text-rose-500 font-semibold mt-1 px-1">{usernameError}</p>
)}
```

The four visual states are mutually exclusive by construction: the conditions are `if/else if` with no overlap.

### 6. Backend: `GET /api/web/auth/check-username`

New route in `server/app/controllers/auth_controller.py`, registered on `auth_bp`:

```python
@auth_bp.route('/check-username', methods=['GET'])
@token_required
def check_username(current_user):
    username = request.args.get('username', '').strip()

    if not username:
        return jsonify({'success': False, 'error': 'username parameter required'}), 400
    if len(username) > 100:
        return jsonify({'success': False, 'error': 'username too long'}), 400

    try:
        # Case-insensitive match; same as the requesting user → available
        existing = User.query.filter(
            func.lower(User.username) == func.lower(username),
            User.id != current_user.id
        ).first()
        return jsonify({'available': existing is None}), 200
    except Exception:
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

The `@token_required` decorator handles the 401 case. No CSRF is required because GET is a safe method (consistent with all other GET endpoints in the codebase).

---

## Data Models

No database schema changes are required. The feature reads the existing `users.username` column (VARCHAR 100, unique, nullable) and the `users.id` column. Both are already indexed.

### Validation State (client-side, in-memory only)

```
usernameCheckStatus: '' | 'checking' | 'available' | 'taken' | 'error'
usernameError: string  (empty string = no error)
```

These are ephemeral React state values — never persisted.

### API Response Shape

`GET /api/web/auth/check-username?username=<value>`

Success:
```json
{ "available": true }
{ "available": false }
```

Error (400):
```json
{ "success": false, "error": "username parameter required" }
{ "success": false, "error": "username too long" }
```

Error (500):
```json
{ "success": false, "error": "Internal server error" }
```

The 400 responses will cause `request()` in `client.js` to throw an `ApiError` (because `success: false` triggers the error branch), which the component's `catch` block handles by entering the `'error'` status — clearing the spinner and unblocking save (Requirement 2.6 / 3.6).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Format Validator Always Returns a Known Value

*For any* string input, `validateUsernameFormat` SHALL return either `null` or one of the five defined error message strings. It SHALL never throw, never return `undefined`, and never return an unrecognized string.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 1.9**

---

### Property 2: Format Rules Are Mutually Prioritized

*For any* non-empty string that contains at least one space character, `validateUsernameFormat` SHALL return `"No spaces allowed."` regardless of whether any other rule also fails (spaces rule has highest priority). More generally, for any input that violates multiple rules, the returned error SHALL correspond to the highest-priority failing rule in the order: spaces → start-with-letter → minimum-length → maximum-length → allowed-chars.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7, 1.8**

---

### Property 3: Valid Format Inputs Produce No Error

*For any* string that: starts with a letter (a–z, A–Z), has length between 4 and 30 inclusive, contains only characters from `[a-zA-Z0-9_.\-]`, and has no space characters, `validateUsernameFormat` SHALL return `null`.

**Validates: Requirements 1.9**

---

### Property 4: Save Is Blocked for All Invalid Username States

*For any* non-empty username input for which `validateUsernameFormat` returns a non-null error string, the derived `usernameBlocksSave` value SHALL be `true`. Similarly, `usernameBlocksSave` SHALL be `true` when `usernameCheckStatus` is `'checking'` or `''` (debounce pending) with a non-empty username.

**Validates: Requirements 3.1, 3.2, 3.5**

---

### Property 5: Own Username Is Immediately Available

*For any* string that is a case-insensitive match of the current user's saved username (including any casing permutation), the debounce effect SHALL immediately set `usernameCheckStatus` to `'available'` and SHALL NOT call `checkUsernameAvailability`.

**Validates: Requirements 2.7, 3.7**

---

### Property 6: API Method Returns a Boolean for All Non-Empty Inputs

*For any* non-empty string `username`, `checkUsernameAvailability(username)` SHALL return a `boolean` value (`true` or `false`) — never a non-boolean truthy/falsy value — when the underlying `request()` call resolves successfully with a body containing an `available` field.

**Validates: Requirements 6.2, 6.3**

---

### Property 7: API Method Throws on Invalid Input

*For any* value that is not a non-empty string (including the empty string `""`, `null`, `undefined`, numbers, and objects), `checkUsernameAvailability` SHALL throw synchronously with the message `"username must be a non-empty string"` without making any network request.

**Validates: Requirements 6.4**

---

### Property 8: Visual States Are Mutually Exclusive

*For any* combination of `usernameError`, `usernameCheckStatus`, and `editUsername` values, the Username_Field SHALL render in exactly one of the four defined visual states — neutral, error, loading, or valid — with no overlap in border class or right-side icon.

**Validates: Requirements 4.7**

---

## Error Handling

### Client-Side

| Scenario | Behavior |
|---|---|
| Format validation fails | `usernameError` set to specific message; `usernameCheckStatus` cleared; save blocked |
| Debounce fires, API returns `available: false` | `usernameError = "Username already taken."`; `usernameCheckStatus = 'taken'`; save blocked |
| API call throws (network / 4xx / 5xx) | `usernameCheckStatus = 'error'`; `usernameError = ''`; save **unblocked** |
| Stale response arrives after newer check | `cancelled = true` flag discards the stale result |
| Modal closed or input cleared during in-flight check | `useEffect` cleanup cancels the timer; `cancelled` flag silences the resolved promise |
| Username unchanged since last save | `handleSave` already guards `usernameChanged` before calling the API |

### Server-Side

| Scenario | HTTP Response |
|---|---|
| No auth cookie / invalid token | `401 Unauthorized` (handled by `@token_required`) |
| `username` param missing or blank | `400 { "success": false, "error": "username parameter required" }` |
| `username` param > 100 chars | `400 { "success": false, "error": "username too long" }` |
| Username not taken (or same as caller's) | `200 { "available": true }` |
| Username taken by another account | `200 { "available": false }` |
| Unexpected DB error | `500 { "success": false, "error": "Internal server error" }` |

The 400 and 500 responses cause `request()` in `client.js` to throw an `ApiError` (via the `success: false` envelope check). The component's catch block sets `usernameCheckStatus = 'error'`, which clears the spinner and unblocks the save button — the backend will re-validate on the actual `PUT /auth/profile` submission.

---

## Testing Strategy

The project uses **Vitest** with **fast-check** (v4) for property-based testing. All new tests go under `client/tests/property/` for component/logic tests. Backend endpoint tests follow the existing pytest suite in `server/tests/`.

### Unit Tests (example-based)

These cover specific scenarios not easily expressed as universal properties:

- **Debounce fires once for rapid keystrokes**: Use fake timers; fire three rapid `onChange` events 50ms apart; assert `checkUsernameAvailability` called exactly once after 500ms.
- **Stale response is discarded**: Manually control two promises; resolve the older one after the newer one; assert UI reflects only the newer result.
- **Loading state shows spinner**: Mock API with a never-resolving promise; assert `Loader2` renders.
- **Network error unblocks save**: Mock API to throw; assert save button enabled and spinner gone.
- **Empty username = neutral state**: Assert `validateUsernameFormat("")` returns `null` and `usernameBlocksSave` is `false`.
- **Backend 400 on blank username**: Integration test against the Flask endpoint with no `username` param.
- **Backend 401 without auth cookie**: Integration test confirming `@token_required` fires.

### Property-Based Tests (fast-check)

Minimum **100 iterations** per test. Each test is tagged with its design property for traceability.

Test tag: `Feature: username-validation, Property 1`
```
Generator: fc.string() — any string
Assert: result ∈ { null, "No spaces allowed.", "Must start with a letter.",
                   "Must be at least 4 characters.", "Username must be 30 characters or fewer.",
                   "Only letters, numbers, underscores, and hyphens are allowed." }
```

Test tag: `Feature: username-validation, Property 2`
```
Generator: fc.string().filter(s => s.includes(' '))
Assert: validateUsernameFormat(s) === "No spaces allowed."
```

Test tag: `Feature: username-validation, Property 3`
```
Generator: strings starting with [a-zA-Z], length 4–30, chars only [a-zA-Z0-9_.\-]
Assert: validateUsernameFormat(s) === null
```

Test tag: `Feature: username-validation, Property 4`
```
Generator: invalid-format strings (non-empty, any rule fails)
Assert: usernameBlocksSave(s, checkStatus) === true
```

Test tag: `Feature: username-validation, Property 5`
```
Generator: case-permutations of currentUser.username (e.g. fc.mapToConstant(...).chain(caseVariants))
Assert: checkUsernameAvailability NOT called; checkStatus === 'available'
```

Test tag: `Feature: username-validation, Property 6`
```
Generator: fc.string({ minLength: 1 }) for username; fc.boolean() for the mocked available field
Assert: typeof result === 'boolean'
```

Test tag: `Feature: username-validation, Property 7`
```
Generator: fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.integer(), fc.object())
Assert: throws Error with message "username must be a non-empty string"; no fetch call made
```

Test tag: `Feature: username-validation, Property 8`
```
Generator: fc.record({ usernameError: fc.string(), usernameCheckStatus: fc.constantFrom('', 'checking', 'available', 'taken', 'error'), editUsername: fc.string() })
Assert: exactly one of { isNeutral, isError, isLoading, isValid } is true
```

### Backend Tests (pytest)

- `test_check_username_available`: Authenticated user queries a username not in use → 200 `{ available: true }`.
- `test_check_username_taken`: Query a username belonging to another user → 200 `{ available: false }`.
- `test_check_username_own`: Query the requesting user's own username → 200 `{ available: true }`.
- `test_check_username_missing_param`: GET without `username` param → 400.
- `test_check_username_too_long`: `username` param > 100 chars → 400.
- `test_check_username_unauthenticated`: No auth cookie → 401.
- `test_check_username_case_insensitive`: Query `"USER"` when `"user"` is taken by another account → 200 `{ available: false }`.
