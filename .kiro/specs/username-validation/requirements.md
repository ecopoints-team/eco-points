# Requirements Document

## Introduction

This feature adds live, inline username validation to the username field inside the Edit Profile modal in `ProfileSection.jsx`. Currently the username input has no client-side feedback — invalid values (spaces, too short, starts with a digit) are only caught when the user submits the form and the backend rejects the request. The goal is to surface all four validation rules immediately as the user types, and to debounce-check uniqueness against the backend, matching the inline-error UX already in use for the phone field and the password-checklist pattern.

The four rules are:
1. No spaces allowed
2. Must start with a letter (a–z, A–Z)
3. At least 4 characters long
4. Must not already be taken by another account (uniqueness — backend check)

When all rules pass, the field should show a green "available" indicator. The Save button must be blocked while any rule is failing or while the availability check is pending.

---

## Glossary

- **Edit_Profile_Modal**: The overlay form in `ProfileSection.jsx` that lets the current user update their profile fields, including username.
- **Username_Field**: The controlled `<input>` for `editUsername` inside the Edit_Profile_Modal.
- **Validation_Rules**: The set of four constraints a candidate username must satisfy before the form can be submitted.
- **Availability_Check**: A backend call (`GET /api/web/auth/check-username?username=<value>`) that returns whether the candidate username is already taken by a different account.
- **Username_Validator**: The client-side logic (pure functions + debounced effect) responsible for evaluating Validation_Rules and initiating the Availability_Check.
- **Inline_Error**: A short error message rendered directly below the Username_Field, styled consistently with the existing `phoneError` pattern (rose-colored text, `text-[11px]` size).
- **Available_Indicator**: A green `CheckCircle` icon rendered inside the Username_Field (right side, vertically centered) when all Validation_Rules pass and the Availability_Check confirms the username is free.
- **Debounce_Delay**: A 500 ms idle period after the user stops typing before the Availability_Check is fired, preventing excessive network requests.
- **Save_Button**: The primary action button in the Edit_Profile_Modal that triggers `handleSave`.
- **Check_Username_Endpoint**: `GET /api/web/auth/check-username` — a new lightweight backend endpoint that returns `{ available: boolean }`.

---

## Requirements

### Requirement 1: Format Validation (client-side, synchronous)

**User Story:** As a user editing my profile, I want immediate feedback on whether my chosen username meets the format rules, so that I do not have to wait for a network round-trip to learn about a simple typo.

#### Acceptance Criteria

1. WHEN the user types in the Username_Field, THE Username_Validator SHALL evaluate all format rules synchronously on every keystroke.
2. IF the candidate username contains one or more space characters, THEN THE Username_Validator SHALL set the Inline_Error to "No spaces allowed."
3. IF the candidate username does not start with a letter (a–z or A–Z) and the field is non-empty, THEN THE Username_Validator SHALL set the Inline_Error to "Must start with a letter."
4. IF the candidate username is between 1 and 3 characters inclusive, THEN THE Username_Validator SHALL set the Inline_Error to "Must be at least 4 characters."
5. THE Username_Validator SHALL display only the highest-priority failing rule as the Inline_Error, using the order: spaces check first, then start-with-letter check, then minimum-length check.
6. WHEN the candidate username is empty (zero-length), THE Username_Validator SHALL clear any existing Inline_Error and SHALL NOT trigger an Availability_Check.
7. IF the candidate username exceeds 30 characters, THEN THE Username_Validator SHALL set the Inline_Error to "Username must be 30 characters or fewer."
8. IF the candidate username contains characters other than letters (a–z, A–Z), digits (0–9), underscores (_), hyphens (-), or dots (.), THEN THE Username_Validator SHALL set the Inline_Error to "Only letters, numbers, underscores, hyphens, and dots are allowed."
9. WHEN all format rules pass, THE Username_Validator SHALL clear the Inline_Error and SHALL allow the Availability_Check to proceed.

### Requirement 2: Uniqueness Check (debounced, asynchronous)

**User Story:** As a user editing my profile, I want to know whether my chosen username is already taken before I submit, so that I can pick a different one without a failed save.

#### Acceptance Criteria

1. WHEN all format rules pass and the candidate username differs from the current saved username (case-insensitive comparison), THE Username_Validator SHALL schedule an Availability_Check after a Debounce_Delay of 500 ms.
2. WHEN a new keystroke arrives before the Debounce_Delay expires, THE Username_Validator SHALL cancel the pending Availability_Check and restart the timer.
3. WHILE the Availability_Check request is in flight, THE Username_Field SHALL display a `Loader2` spinner icon on the right side in place of the Available_Indicator.
4. WHEN the Availability_Check returns `{ available: false }`, THE Username_Validator SHALL set the Inline_Error to "Username already taken."
5. WHEN the Availability_Check returns `{ available: true }`, THE Username_Validator SHALL clear any Inline_Error and SHALL display the Available_Indicator.
6. IF the Availability_Check request fails due to a network error or a non-2xx server response, THEN THE Username_Validator SHALL remove the spinner, hide the Available_Indicator, clear any Inline_Error, and SHALL NOT block the Save_Button (the backend will re-validate on submit).
7. WHEN the candidate username equals the current saved username (case-insensitive), THE Username_Validator SHALL skip the Availability_Check and SHALL display the Available_Indicator immediately.
8. WHEN a newer Availability_Check request is dispatched before a previous one resolves, THE Username_Validator SHALL discard the response from the earlier (stale) request and SHALL only apply the result from the most recent request.

### Requirement 3: Save Button Gating

**User Story:** As a user, I want the Save button to be disabled when my username input is invalid, so that I cannot accidentally submit a bad username.

#### Acceptance Criteria

1. WHILE any format rule is failing for the candidate username, THE Save_Button SHALL be disabled.
2. WHILE the Availability_Check is in flight, THE Save_Button SHALL be disabled.
3. IF the Availability_Check has returned `{ available: false }`, THEN THE Save_Button SHALL remain disabled until the username is changed to a valid and available value.
4. WHEN the candidate username is empty (zero-length), THE Save_Button SHALL remain enabled regardless of other field states, since username is optional.
5. IF the candidate username is non-empty and all format rules pass but the Availability_Check has not yet fired (within the Debounce_Delay window), THEN THE Save_Button SHALL be disabled.
6. IF the Availability_Check fails due to a network or server error, THEN THE Save_Button SHALL be enabled so the user can still attempt to save (backend will re-validate).
7. WHEN the candidate username equals the current saved username (case-insensitive), THE Save_Button SHALL be enabled immediately without waiting for an Availability_Check.

### Requirement 4: Visual Feedback

**User Story:** As a user, I want clear visual cues on the username field so that I can tell at a glance whether my chosen username is valid and available.

#### Acceptance Criteria

1. IF the Username_Field has an active Inline_Error, THEN THE Username_Field border SHALL use `border-rose-400` (consistent with the `phoneError` styling already used in the modal).
2. IF all Validation_Rules pass and the Available_Indicator is active, THEN THE Username_Field border SHALL use `border-emerald-400`.
3. WHILE the Availability_Check is in flight, THE Username_Field SHALL render a `Loader2` spinner icon (from `lucide-react`) that is absolutely positioned on the right side, vertically centered, inside the field; no Available_Indicator SHALL be shown simultaneously.
4. IF the Availability_Check confirms availability (`{ available: true }`), THEN THE Username_Field SHALL render a `CheckCircle` icon in `text-emerald-500` that is absolutely positioned on the right side, vertically centered, inside the field.
5. IF the Username_Field has an active Inline_Error, THEN THE Inline_Error message SHALL be rendered directly below the Username_Field using `text-[11px] text-rose-500 font-semibold mt-1 px-1` class styling.
6. WHEN the Username_Field is empty (zero-length), THE Username_Field SHALL render with its default neutral border (`border-slate-200`) and no icon, regardless of any previous validation state.
7. AT ANY GIVEN TIME, exactly one of the following visual states SHALL be active on the Username_Field: neutral (empty), error (Inline_Error present), loading (spinner), or valid (Available_Indicator) — these states are mutually exclusive.

### Requirement 5: Backend Check-Username Endpoint

**User Story:** As the system, I need a lightweight endpoint to answer uniqueness queries from the client, so that the Username_Validator can check availability without attempting a full profile update.

#### Acceptance Criteria

1. THE Check_Username_Endpoint SHALL accept `GET /api/web/auth/check-username?username=<value>` requests from authenticated users.
2. WHEN the queried username is not in use by any other account, THE Check_Username_Endpoint SHALL return HTTP 200 with body `{ "available": true }`.
3. WHEN the queried username is already taken by a different account (case-insensitive match), THE Check_Username_Endpoint SHALL return HTTP 200 with body `{ "available": false }`.
4. WHEN the queried username is the same as the requesting user's current username (case-insensitive), THE Check_Username_Endpoint SHALL return HTTP 200 with body `{ "available": true }`.
5. IF the `username` query parameter is absent, empty, or contains only whitespace, THEN THE Check_Username_Endpoint SHALL return HTTP 400 with body `{ "success": false, "error": "username parameter required" }`.
6. IF the `username` query parameter exceeds 100 characters, THEN THE Check_Username_Endpoint SHALL return HTTP 400 with body `{ "success": false, "error": "username too long" }`.
7. IF the request does not include a valid authentication token, THEN THE Check_Username_Endpoint SHALL return HTTP 401.
8. IF an unexpected server error occurs during the lookup, THEN THE Check_Username_Endpoint SHALL return HTTP 500 with body `{ "success": false, "error": "Internal server error" }`.

### Requirement 6: Client API Method

**User Story:** As a developer, I want a typed API wrapper for the uniqueness check so that callers do not construct fetch calls inline.

#### Acceptance Criteria

1. THE `auth` API module (`client/src/services/api/auth.js`) SHALL export a `checkUsernameAvailability(username)` function.
2. WHEN called with a non-empty string, THE `checkUsernameAvailability` function SHALL issue a `GET` request to `/auth/check-username?username=<encoded_value>` where `<encoded_value>` is the result of `encodeURIComponent(username)`, using the existing `request` helper.
3. THE `checkUsernameAvailability` function SHALL return a boolean — `true` if the response body's `available` field is `true`, `false` if it is `false` or absent.
4. IF the `checkUsernameAvailability` is called with an empty string or a non-string value, THEN the function SHALL throw an `Error` with the message `"username must be a non-empty string"` without making a network request.
5. IF the underlying `request` call throws or rejects, THE `checkUsernameAvailability` function SHALL propagate the rejection to the caller (no internal catch); error handling is the responsibility of the calling component.
