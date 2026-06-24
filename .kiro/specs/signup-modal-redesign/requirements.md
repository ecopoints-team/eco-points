# Requirements Document

## Introduction

The EcoPoints Sign-Up Modal currently uses a 2-phase flow with legacy `InputField` components embedded in `LogIn.jsx`. This feature redesigns the signup section into a polished 3-step wizard that matches the floating-label design language already used by the existing `FloatingInputField` component on the login side. All backend API calls (`authApi.register`, `authApi.getPublicLocations`, `authApi.getPublicGroups`) and the save/restore signup data mechanism are preserved without modification. The redesign is self-contained within or alongside `LogIn.jsx` and must not break the Login, Forgot Password, or CAPTCHA modal modes.

---

## Glossary

- **SignUp_Wizard**: The redesigned 3-step signup section rendered inside the existing `LogIn.jsx` modal.
- **Step**: One of three sequential screens within the SignUp_Wizard (Step 1: Account Credentials, Step 2: Personal Details, Step 3: Institutional Details).
- **Progress_Bar**: A visual indicator at the top of the SignUp_Wizard that reflects the current Step out of three.
- **FloatingInputField**: The existing React component in `LogIn.jsx` that renders an input with a label that transitions to the top border on focus or fill.
- **Touched_State**: A per-field boolean that becomes `true` after the user has triggered an `onBlur` event on that field.
- **User_Type**: The role the registrant selects — one of: Student, Alumni, Faculty, Staff, or Employee.
- **Community_Group**: A group dynamically fetched from `authApi.getPublicGroups(locationId)` after an Organization is selected.
- **Organization**: A location/institution selected by the user, sourced from `authApi.getPublicLocations()`.
- **Year_Level**: An academic year field that is only relevant when `User_Type` is Student.
- **TC_Modal**: An in-page modal displaying the full Terms and Conditions text.
- **PP_Modal**: An in-page modal displaying the full Privacy Policy text.
- **Register_Payload**: The object passed to `authApi.register(...)` — its shape must not change.

---

## Requirements

### Requirement 1: Three-Step Wizard Layout

**User Story:** As a new user, I want a clearly structured multi-step form, so that I can register without feeling overwhelmed by too many fields at once.

#### Acceptance Criteria

1. THE SignUp_Wizard SHALL render three sequential Steps within the existing `LogIn.jsx` modal structure: Step 1 (Account Credentials), Step 2 (Personal Details), and Step 3 (Institutional Details). Only one Step SHALL be visible at a time.
2. THE SignUp_Wizard SHALL display a Progress_Bar at the top consisting of three numbered step indicators (1, 2, 3) connected by two connector lines. The current Step indicator SHALL be visually distinct from completed and upcoming steps (e.g., filled vs. outlined vs. dimmed).
3. WHEN the user advances from one Step to the next, THE Progress_Bar SHALL immediately update to reflect the new current Step number.
4. WHEN the user navigates back to a previous Step, THE Progress_Bar SHALL update to reflect the new current Step number.
5. THE SignUp_Wizard SHALL use Tailwind CSS exclusively for all styling and layout.
6. THE SignUp_Wizard SHALL use Lucide-React icons for all decorative and functional iconography.

---

### Requirement 2: Step 1 — Account Credentials

**User Story:** As a new user, I want to enter my core account details in the first step, so that my identity and login credentials are established before other details.

#### Acceptance Criteria

1. THE SignUp_Wizard SHALL render the following fields on Step 1: Email, Username, Password, Confirm Password — each styled using the FloatingInputField floating-label pattern (label transitions to the top border on focus or fill).
2. WHEN a field on Step 1 has not yet been touched (Touched_State is `false`), THE SignUp_Wizard SHALL NOT display any validation error for that field.
3. WHEN the user leaves the Email field (onBlur) and the Touched_State for Email is `true`, IF the value does not conform to the pattern `local@domain.tld` (local part + `@` + domain with at least one `.`), contains spaces, or exceeds 254 characters, THEN THE SignUp_Wizard SHALL display an error message below the Email field.
4. WHEN the user leaves the Username field (onBlur) and the Touched_State for Username is `true`, IF the value is fewer than 3 characters, exceeds 30 characters, or contains any character other than ASCII alphanumerics, `.`, or `_`, THEN THE SignUp_Wizard SHALL display an error message below the Username field.
5. WHEN the user leaves the Password field (onBlur) and the Touched_State for Password is `true`, IF the value is fewer than 8 characters, exceeds 128 characters, lacks at least one uppercase letter (A–Z), lacks at least one lowercase letter (a–z), lacks at least one digit (0–9), or contains any space character, THEN THE SignUp_Wizard SHALL display an error message below the Password field listing each specific unmet criterion.
6. WHILE the Password field contains a non-empty value AND the Confirm Password field contains a non-empty value, THE SignUp_Wizard SHALL display a dynamic status indicator immediately below the Confirm Password field: "Match" styled in success color (emerald) if the two values are identical, or "Mismatch" styled in error color (rose) if they differ. IF either field is cleared to empty, THE indicator SHALL be hidden.
7. THE SignUp_Wizard SHALL render the "Next Step" button for Step 1 as disabled until all four fields pass validation: Email matches the valid email pattern, Username passes the alphanumeric/length rules, Password passes all five strength rules, and Confirm Password is non-empty and identical to Password.
8. WHEN all Step 1 validations pass and the user activates the "Next Step" button, THE SignUp_Wizard SHALL advance to Step 2.

---

### Requirement 3: Step 2 — Personal Details

**User Story:** As a new user, I want to enter my personal identity information in the second step, so that my account has a complete user profile.

#### Acceptance Criteria

1. THE SignUp_Wizard SHALL render the following fields on Step 2: First Name (required), Middle Name (optional), Last Name (required), Phone Number (required) — each styled using the FloatingInputField floating-label pattern.
2. THE SignUp_Wizard SHALL visually mark Middle Name as optional by appending "(optional)" to its floating label text.
3. WHEN the user leaves the First Name field (onBlur) and the Touched_State for First Name is `true`, IF the value is empty, exceeds 50 characters, or contains characters other than letters, spaces, hyphens, or apostrophes, THEN THE SignUp_Wizard SHALL display an error message below the First Name field.
4. WHEN the user leaves the Last Name field (onBlur) and the Touched_State for Last Name is `true`, IF the value is empty, exceeds 50 characters, or contains characters other than letters, spaces, hyphens, or apostrophes, THEN THE SignUp_Wizard SHALL display an error message below the Last Name field.
5. WHEN the user leaves the Phone Number field (onBlur) and the Touched_State for Phone is `true`, IF the value is not exactly 10 digits, does not start with the digit `9`, or contains any non-digit character, THEN THE SignUp_Wizard SHALL display an error message below the Phone Number field.
6. THE SignUp_Wizard SHALL render the "Next Step" button for Step 2 as disabled until First Name, Last Name, and Phone Number each pass their respective validation rules. Middle Name validation SHALL NOT gate the button.
7. WHEN all Step 2 required-field validations pass and the user activates the "Next Step" button, THE SignUp_Wizard SHALL advance to Step 3.
8. THE SignUp_Wizard SHALL provide a "Back" button on Step 2 that returns the user to Step 1. WHEN the user activates "Back", THE SignUp_Wizard SHALL preserve all Step 1 field values and their Touched_State; Step 2 field values SHALL also be preserved.

---

### Requirement 4: Step 3 — Institutional Details

**User Story:** As a new user, I want to associate my account with my institution and role in the final step, so that I am placed in the correct organizational context within EcoPoints.

#### Acceptance Criteria

1. THE SignUp_Wizard SHALL render the following fields on Step 3: Organization (typeable dropdown, required), User Type (dropdown, required), Community Group (typeable dropdown, required), Year Level (conditional, required when User_Type is "Student"), Terms & Conditions checkbox (required), and Privacy Policy checkbox (required).
2. THE SignUp_Wizard SHALL call `authApi.getPublicLocations()` on modal open (or on first entry to Step 3) and populate the Organization `<datalist>` with the returned location names and IDs.
3. IF `authApi.getPublicLocations()` fails, THEN THE SignUp_Wizard SHALL display an inline error below the Organization field stating that institutions could not be loaded and offer a retry affordance.
4. WHEN the user selects or types a value in the Organization field that matches a location in the list (by `id`), THE SignUp_Wizard SHALL call `authApi.getPublicGroups(locationId)` to populate the Community Group `<datalist>`.
5. IF `authApi.getPublicGroups(locationId)` fails, THEN THE SignUp_Wizard SHALL display an inline error below the Community Group field stating that groups could not be loaded and offer a retry affordance.
6. WHEN the user changes the selected Organization to a different value, THE SignUp_Wizard SHALL clear the Community Group field value.
7. IF the user types a custom value in the Organization field that does not match any list entry, THEN THE SignUp_Wizard SHALL leave the Community Group `<datalist>` empty and disable the "Create Account" button until a valid Organization with a known `locationId` is selected.
8. THE SignUp_Wizard SHALL implement the Organization and Community Group fields using HTML `<input>` elements with associated `<datalist>` elements, allowing the user to either pick a listed option or type a custom string.
9. WHEN the user selects "Student" as User_Type, THE SignUp_Wizard SHALL reveal the Year Level field immediately below User Type.
10. WHEN the user selects a User_Type other than "Student", THE SignUp_Wizard SHALL hide the Year Level field and clear its value.
11. WHEN the user activates the "Terms & Conditions" link, THE SignUp_Wizard SHALL open the TC_Modal as an overlay within the page without navigating away or closing the signup modal.
12. WHEN the user activates the "Privacy Policy" link, THE SignUp_Wizard SHALL open the PP_Modal as an overlay within the page without navigating away or closing the signup modal.
13. THE SignUp_Wizard SHALL render the "Create Account" button as disabled until: Organization has a valid `locationId`, User Type is selected, Community Group is selected, Terms & Conditions checkbox is checked, Privacy Policy checkbox is checked, and — IF User_Type is "Student" — Year Level is non-empty.
14. THE SignUp_Wizard SHALL provide a "Back" button on Step 3 that returns the user to Step 2. WHEN the user activates "Back", THE SignUp_Wizard SHALL preserve all Step 2 and Step 3 field values.

---

### Requirement 5: Account Registration Submission

**User Story:** As a new user, I want my completed form to be submitted to the backend exactly as before, so that my account is created reliably without any API-layer changes.

#### Acceptance Criteria

1. WHEN the user activates "Create Account" on Step 3 and all validations pass, THE SignUp_Wizard SHALL call `authApi.register` with a Register_Payload of exactly: `{ firstName, middleName, lastName, name, username, email, phone, password, userType, locationId, groupId, yearLevel }`, where `name` is derived as `"${firstName}${middleName ? ' ' + middleName : ''} ${lastName}".trim()` and `userType` is the selected User_Type value lowercased with spaces replaced by underscores.
2. THE SignUp_Wizard SHALL submit the phone number as `+63${phone}` (prepending the Philippine country code prefix).
3. IF the Middle Name field is empty, THEN THE SignUp_Wizard SHALL submit `middleName` as `undefined`.
4. IF no Community Group is selected, THEN THE SignUp_Wizard SHALL submit `groupId` as `undefined`.
5. IF User_Type is not "Student" or the Year Level field is empty, THEN THE SignUp_Wizard SHALL submit `yearLevel` as `undefined`.
6. WHEN `authApi.register` succeeds, THE SignUp_Wizard SHALL reset all form fields to empty, reset Step to 1, and transition the modal to the Sign In view.
7. IF `authApi.register` returns an error, THEN THE SignUp_Wizard SHALL display the server error message below the "Create Account" button without resetting any form field values or navigating away from Step 3.
8. WHILE the `authApi.register` request is in flight, THE SignUp_Wizard SHALL display a loading spinner on the "Create Account" button and disable the "Create Account" button, the "Back" button on Step 3, and all form fields on Step 3.

---

### Requirement 6: Save and Restore Signup Data

**User Story:** As a new user, I want my partially completed signup data to be saved when I temporarily switch to the Login view, so that I do not lose my progress if I need to check my credentials.

#### Acceptance Criteria

1. WHEN the user switches from the Sign Up view to the Sign In view and at least one SignUp_Wizard field contains a non-empty value, THE SignUp_Wizard SHALL save a snapshot of all current field values and the current Step number in component-level state (not persisted beyond the modal session).
2. WHEN the user switches back from the Sign In view to the Sign Up view and a saved snapshot exists, THE SignUp_Wizard SHALL present a restore dialog offering exactly two actions: "Start Fresh" and "Restore".
3. WHEN the user activates "Restore" in the dialog, THE SignUp_Wizard SHALL repopulate all fields and restore the Step number from the saved snapshot, then clear the saved snapshot from state.
4. WHEN the user activates "Start Fresh" in the dialog, THE SignUp_Wizard SHALL discard the saved snapshot and reset the SignUp_Wizard to Step 1 with all fields empty.
5. IF the user dismisses the restore dialog without making a choice (e.g., clicks outside it), THEN THE SignUp_Wizard SHALL treat the dismissal as "Start Fresh" — discard the snapshot and reset to Step 1.

---

### Requirement 7: Compatibility with Existing Modal Modes

**User Story:** As an existing user, I want the Login, Forgot Password, and CAPTCHA flows to continue working exactly as before, so that the signup redesign does not regress any other functionality.

#### Acceptance Criteria

1. THE SignUp_Wizard redesign SHALL NOT modify the logic or layout of the Sign In form within `LogIn.jsx`.
2. THE SignUp_Wizard redesign SHALL NOT modify the Forgot Password flow (steps 1–4) within `LogIn.jsx`.
3. THE SignUp_Wizard redesign SHALL NOT modify the CAPTCHA popup or the failed-attempt tracking logic within `LogIn.jsx`.
4. IF `isSignUp` state is `false` (Sign In mode), THEN THE SignUp_Wizard SHALL NOT be mounted in the DOM, so that it cannot interfere with Sign In form layout, tab order, or form submission.
5. THE SignUp_Wizard SHALL preserve the existing `isExpanding` re-entry guard (when `isExpanding` is `true`, the mode-toggle action is a no-op), the mode-toggle transition timing, and the overlay panel animation between Sign In and Sign Up views.
