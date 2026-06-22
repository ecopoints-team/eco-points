# Implementation Plan: Username Validation

## Overview

Implement live inline username validation in the Edit Profile modal of `ProfileSection.jsx`. The work spans three layers: a pure format-validation function, a debounced availability check tied to a new backend endpoint, and wiring the derived state into the existing modal UI (save-button gating + visual feedback). Tests are co-located with each layer so errors surface early.

## Tasks

- [x] 1. Add `checkUsernameAvailability` to the auth API module
  - [x] 1.1 Implement `checkUsernameAvailability(username)` in `client/src/services/api/auth.js`
    - Export the function following the same `request('GET', ...)` pattern used by existing methods
    - Guard: throw `Error("username must be a non-empty string")` for empty string or non-string input without making a network request
    - Build the query string with `encodeURIComponent(username)`
    - Return `data?.available === true` (boolean coercion)
    - Propagate any `request()` rejection to the caller — no internal catch
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 1.2 Write property test for `checkUsernameAvailability` — Property 6
    - **Property 6: API Method Returns a Boolean for All Non-Empty Inputs**
    - Generator: `fc.string({ minLength: 1 })` for username; `fc.boolean()` for the mocked `available` field
    - Assert: `typeof result === 'boolean'`
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 1.3 Write property test for `checkUsernameAvailability` — Property 7
    - **Property 7: API Method Throws on Invalid Input**
    - Generator: `fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.integer(), fc.object())`
    - Assert: throws synchronously with message `"username must be a non-empty string"` and no fetch call is made
    - **Validates: Requirements 6.4**

- [x] 2. Add backend `GET /api/web/auth/check-username` endpoint
  - [x] 2.1 Implement `check_username` route in `server/app/controllers/auth_controller.py`
    - Register `@auth_bp.route('/check-username', methods=['GET'])` with `@token_required`
    - Strip the `username` query param; return 400 if absent or blank
    - Return 400 if `len(username) > 100`
    - Case-insensitive query excluding the requesting user's own ID: `func.lower(User.username) == func.lower(username) AND User.id != current_user.id`
    - Return `{ "available": true/false }` on 200; return 500 on unexpected DB exception
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 2.2 Write pytest unit tests for the `check-username` endpoint
    - `test_check_username_available`: authenticated user queries an unused name → 200 `{ available: true }`
    - `test_check_username_taken`: query a name owned by another user → 200 `{ available: false }`
    - `test_check_username_own`: query the requesting user's own username → 200 `{ available: true }`
    - `test_check_username_missing_param`: GET without `username` → 400
    - `test_check_username_too_long`: `username` > 100 chars → 400
    - `test_check_username_unauthenticated`: no auth cookie → 401
    - `test_check_username_case_insensitive`: `"USER"` when `"user"` is taken by another → 200 `{ available: false }`
    - _Requirements: 5.1–5.8_

- [x] 3. Implement `validateUsernameFormat` pure function in `ProfileSection.jsx`
  - [x] 3.1 Write `validateUsernameFormat(value)` inside `ProfileSection.jsx` (non-exported, module-level)
    - Implement the six priority-ordered rules exactly as specified in the design:
      1. Empty string → `null`
      2. Contains space → `"No spaces allowed."`
      3. Starts with non-letter → `"Must start with a letter."`
      4. Length 1–3 → `"Must be at least 4 characters."`
      5. Length > 30 → `"Username must be 30 characters or fewer."`
      6. Disallowed chars (`/[^a-zA-Z0-9_.\-]/`) → `"Only letters, numbers, underscores, hyphens, and dots are allowed."`
      7. All pass → `null`
    - Never throw; always return `null` or one of the five defined error strings
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 3.2 Write property test for `validateUsernameFormat` — Property 1
    - **Property 1: Format Validator Always Returns a Known Value**
    - Generator: `fc.string()` (any string)
    - Assert: result is exactly `null` or one of the five defined error message strings; never throws; never `undefined`; never an unrecognized string
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 1.9**

  - [ ]* 3.3 Write property test for `validateUsernameFormat` — Property 2
    - **Property 2: Format Rules Are Mutually Prioritized**
    - Generator: `fc.string().filter(s => s.includes(' '))`
    - Assert: `validateUsernameFormat(s) === "No spaces allowed."` for all strings containing at least one space
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7, 1.8**

  - [ ]* 3.4 Write property test for `validateUsernameFormat` — Property 3
    - **Property 3: Valid Format Inputs Produce No Error**
    - Generator: strings starting with `[a-zA-Z]`, length 4–30, chars only `[a-zA-Z0-9_.\-]` (use `fc.stringMatching` or manual `fc.array` + `fc.mapToConstant`)
    - Assert: `validateUsernameFormat(s) === null`
    - **Validates: Requirements 1.9**

- [x] 4. Add username validation state and debounced effect to `ProfileSection.jsx`
  - [x] 4.1 Add `usernameCheckStatus` and `usernameError` state variables
    - Add `const [usernameCheckStatus, setUsernameCheckStatus] = useState('');` — values: `'' | 'checking' | 'available' | 'taken' | 'error'`
    - Add `const [usernameError, setUsernameError] = useState('');`
    - Reset both state variables inside `handleOpenEditModal` alongside the existing field resets
    - _Requirements: 1.1, 2.1, 2.3_

  - [x] 4.2 Implement the debounced `useEffect` for username validation
    - Wire the `useEffect` with `[editUsername, currentUser?.username]` dependency array
    - Run `validateUsernameFormat` synchronously first; if it returns an error, set `usernameError` and clear `usernameCheckStatus`
    - For empty input, clear both state variables and return
    - For case-insensitive match of own username, immediately set `usernameCheckStatus = 'available'` without scheduling an API call
    - For valid, different username: set `usernameCheckStatus = 'checking'`, clear `usernameError`, schedule `checkUsernameAvailability` after 500 ms
    - Use a `cancelled` flag + `clearTimeout` in the cleanup function to cancel stale timers and discard stale responses
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 4.3 Write unit tests for the debounced effect behaviour
    - Use Vitest fake timers (`vi.useFakeTimers`)
    - Debounce fires once for rapid keystrokes: fire three `onChange` events 50 ms apart; assert `checkUsernameAvailability` called exactly once after 500 ms
    - Stale response is discarded: resolve an older promise after a newer one; assert UI reflects only the newer result
    - Loading state shows spinner: mock API with never-resolving promise; assert `Loader2` renders
    - Network error unblocks save: mock API to throw; assert save button enabled and spinner gone
    - Empty username produces neutral state: assert `validateUsernameFormat("")` returns `null` and save not blocked
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.8_

- [x] 5. Implement save-button gating and derive `usernameBlocksSave`
  - [x] 5.1 Add `usernameBlocksSave` derived value and extend the save button's `disabled` prop
    - Implement the IIFE expression from the design:
      - Empty `editUsername` → `false` (username is optional)
      - `usernameError` is non-empty → `true`
      - `usernameCheckStatus === 'checking'` → `true`
      - `usernameCheckStatus === ''` with non-empty `editUsername` → `true` (debounce pending)
      - `'available'` or `'error'` → `false`
    - Extend the existing save button: `disabled={isSubmitting || usernameBlocksSave}`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 5.2 Write property test for save-button gating — Property 4
    - **Property 4: Save Is Blocked for All Invalid Username States**
    - Generator: non-empty strings for which `validateUsernameFormat` returns a non-null error; also generate `(non-empty-username, 'checking' | '')` pairs for `usernameCheckStatus`
    - Assert: `usernameBlocksSave` is `true` in all such cases
    - **Validates: Requirements 3.1, 3.2, 3.5**

  - [ ]* 5.3 Write property test for own-username shortcut — Property 5
    - **Property 5: Own Username Is Immediately Available**
    - Generator: case-permutations of `currentUser.username` (e.g., `fc.mapToConstant` + case-variant mapper)
    - Assert: `usernameCheckStatus === 'available'` immediately; `checkUsernameAvailability` NOT called
    - **Validates: Requirements 2.7, 3.7**

- [x] 6. Implement visual feedback in the username field UI
  - [x] 6.1 Wrap the username input in a `relative` container and add conditional border classes
    - Apply `border-rose-400 focus:border-rose-400` when `usernameError` is non-empty
    - Apply `border-emerald-400 focus:border-emerald-400` when `usernameCheckStatus === 'available'` and no error
    - Apply default `border-slate-200 focus:border-emerald-300` otherwise
    - Add `pr-9` to the input to leave room for the right-side icon
    - _Requirements: 4.1, 4.2, 4.6_

  - [x] 6.2 Add the right-side icon (spinner / checkmark) inside the relative container
    - When `usernameCheckStatus === 'checking'` and no `usernameError`: render `<Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />`
    - When `usernameCheckStatus === 'available'` and no `usernameError`: render `<CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />`
    - Both `Loader2` and `CheckCircle` are already imported in `ProfileSection.jsx`
    - _Requirements: 4.3, 4.4_

  - [x] 6.3 Add the inline error paragraph below the username field
    - Render `<p className="text-[11px] text-rose-500 font-semibold mt-1 px-1">{usernameError}</p>` conditionally when `usernameError` is non-empty
    - Consistent with the existing `phoneError` pattern already in the modal
    - _Requirements: 4.5_

  - [ ]* 6.4 Write property test for mutually exclusive visual states — Property 8
    - **Property 8: Visual States Are Mutually Exclusive**
    - Generator: `fc.record({ usernameError: fc.string(), usernameCheckStatus: fc.constantFrom('', 'checking', 'available', 'taken', 'error'), editUsername: fc.string() })`
    - Assert: exactly one of `{ isNeutral, isError, isLoading, isValid }` is `true` for any combination
    - **Validates: Requirements 4.7**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Username Change Lockout (Requirement 7)
  - [x] 8.1 Add `username_changed_at` column to the `users` table via a new migration
    - Create a new Alembic migration file in `server/migrations/versions/`
    - Add column: `username_changed_at = Column(DateTime(timezone=True), nullable=True, default=None)`
    - Migration `upgrade()`: `op.add_column('users', sa.Column('username_changed_at', sa.DateTime(timezone=True), nullable=True))`
    - Migration `downgrade()`: `op.drop_column('users', 'username_changed_at')`
    - _Requirements: 7.9_

  - [x] 8.2 Update `PUT /auth/profile` handler to set `username_changed_at` on successful username change
    - In `server/app/controllers/auth_controller.py`, locate the `update_profile` route
    - After a successful save, check if the `username` field in the request body differs from the previously stored value; if so, set `current_user.username_changed_at = datetime.utcnow()`
    - _Requirements: 7.10_

  - [x] 8.3 Include `usernameChangedAt` in the user profile API response
    - In the user serialization/response helper (or directly in the `me()` / profile endpoint), add `"usernameChangedAt": user.username_changed_at.isoformat() + 'Z' if user.username_changed_at else None`
    - Ensure the field is present (not omitted) in every profile response, with value `null` when never changed
    - _Requirements: 7.9_

  - [x] 8.4 Derive `isUsernameLocked` and `lockoutRemainingDays` in `ProfileSection.jsx`
    - Add the two derived values computed once at render time from `currentUser.usernameChangedAt` (not in `useState`):
      - `isUsernameLocked`: returns `false` if `usernameChangedAt` is absent/null/unparseable; otherwise `elapsedDays < 30`
      - `lockoutRemainingDays`: `Math.max(1, 30 - Math.floor(elapsed / 86_400_000))` when locked, else `0`
    - Treat any non-null, non-parseable `usernameChangedAt` as `null` (Requirement 7.13)
    - _Requirements: 7.1, 7.7, 7.8, 7.13_

  - [x] 8.5 Guard the validation `useEffect` and `handleSave` with `isUsernameLocked`
    - At the top of the debounced `useEffect`, add `if (isUsernameLocked) return;` before any validation logic
    - Add `isUsernameLocked` to the `useEffect` dependency array: `[editUsername, currentUser?.username, isUsernameLocked]`
    - In `handleSave`, update the `usernameChanged` guard: `const usernameChanged = !isUsernameLocked && editUsername !== currentUser?.username;`
    - _Requirements: 7.11, 7.12_

  - [x] 8.6 Conditionally render the locked vs. editable username input in `ProfileSection.jsx`
    - Wrap the existing username field rendering in a ternary on `isUsernameLocked`
    - **Locked branch** (when `isUsernameLocked` is `true`):
      - Render a `relative` container with a `disabled` `<input>` using classes `w-full pr-9 bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-sm`
      - Render `<Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />` inside the container (import `Lock` from `lucide-react` if not already imported)
      - Render lockout message below: `text-[11px] text-slate-400 mt-1 px-1` with text `"Username locked — available to change in X day."` (singular) or `"Username locked — available to change in X days."` (plural) based on `lockoutRemainingDays`
    - **Editable branch** (when `isUsernameLocked` is `false`): keep the existing rendering logic unchanged
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.7 Write property test for locked field save gating — Property 9
    - **Property 9: Locked Field Never Blocks Save**
    - Generator: `fc.record({ usernameError: fc.string(), usernameCheckStatus: fc.constantFrom('', 'checking', 'available', 'taken', 'error') })` with `isUsernameLocked` fixed to `true`
    - Assert: `usernameBlocksSave === false` for all combinations when `isUsernameLocked` is `true`
    - **Validates: Requirements 7.11, 7.12**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests live in `client/tests/property/`; backend tests follow the existing pytest suite in `server/tests/`
- Run property tests with `vitest --run` (single pass, no watch mode)
- Minimum 100 iterations per fast-check property test
- Each property test is tagged with its design property number for traceability (e.g., `Feature: username-validation, Property 1`)
- The `Loader2` and `CheckCircle` icons are already imported in `ProfileSection.jsx` — no new imports needed for those; verify `Lock` is imported or add it
- `fast-check` (v4) is already in `devDependencies` — no new client dependencies required
- Tasks 8.1–8.3 are backend/database changes; Tasks 8.4–8.6 are frontend changes in `ProfileSection.jsx`
- The `username_changed_at` column is nullable — existing rows will have `NULL` and will not trigger the lockout

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.2", "3.3", "3.4", "4.1"] },
    { "id": 2, "tasks": ["4.2"] },
    { "id": 3, "tasks": ["4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4"] },
    { "id": 10, "tasks": ["8.5"] },
    { "id": 11, "tasks": ["8.6"] },
    { "id": 12, "tasks": ["8.7"] }
  ]
}
```
