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

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests live in `client/tests/property/`; backend tests follow the existing pytest suite in `server/tests/`
- Run property tests with `vitest --run` (single pass, no watch mode)
- Minimum 100 iterations per fast-check property test
- Each property test is tagged with its design property number for traceability (e.g., `Feature: username-validation, Property 1`)
- The `Loader2` and `CheckCircle` icons are already imported in `ProfileSection.jsx` — no new imports needed
- `fast-check` (v4) is already in `devDependencies` — no new client dependencies required
- No database schema changes are required; the feature reads existing `users.username` and `users.id` columns

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
    { "id": 6, "tasks": ["6.4"] }
  ]
}
```
