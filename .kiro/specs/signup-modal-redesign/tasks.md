# Implementation Plan: Sign-Up Modal Redesign

## Overview

Replace the legacy 2-phase sign-up form in `LogIn.jsx` with a polished 3-step `SignUp_Wizard` that uses the `FloatingInputField` floating-label design language. The wizard lives entirely inside `LogIn.jsx`, uses Tailwind CSS and Lucide-React icons, preserves the existing API contract, and must not disturb the Login, Forgot Password, or CAPTCHA flows.

## Tasks

- [x] 1. Create shared sub-components: `Progress_Bar`, `FloatingDatalistField`, and `FloatingSelectField`
  - [x] 1.1 Implement `Progress_Bar` component
    - Define `Progress_Bar` as a named function in `LogIn.jsx` (or a co-located file)
    - Render three numbered step indicators connected by two connector lines using the Tailwind class mapping from the design (current / completed / upcoming states)
    - Accept `currentStep: 1 | 2 | 3` as the only prop
    - Use `transition-colors duration-300` for smooth visual updates
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 1.2 Write property test for `Progress_Bar` step indicator states
    - **Property 2: Progress_Bar always reflects current step**
    - **Validates: Requirements 1.2, 1.3, 1.4**
    - For each step value in {1, 2, 3}, assert that the indicator for that step has the "current" Tailwind classes, indicators with `n < currentStep` have the "completed" classes, and indicators with `n > currentStep` have the "upcoming" classes

  - [x] 1.3 Implement `FloatingDatalistField` component
    - Define `FloatingDatalistField` in `LogIn.jsx` adopting the same floating-label, icon, separator, and color-state visual shell as `FloatingInputField`
    - Render `<input list="{id}-list">` + `<datalist id="{id}-list">` populated from the `options` prop
    - On `onChange`, case-insensitively match the input value against `options[].name`; call `onOptionSelect` with the matched object or `null`
    - Accept the full `FloatingDatalistFieldProps` interface from the design (id, label, icon, value, onChange, onOptionSelect, options, required, error, onFocus, onBlur, disabled)
    - _Requirements: 4.8_

  - [x] 1.4 Implement `FloatingSelectField` component
    - Define `FloatingSelectField` in `LogIn.jsx` styled to visually match the `FloatingInputField` shell (border, icon, separator, floating label)
    - Render a native `<select>` inside the shell with the provided `options` array
    - Accept: id, label, icon, value, onChange, options, onBlur, error, disabled
    - _Requirements: 4.1_

- [x] 2. Implement `Step1_AccountCredentials`
  - [x] 2.1 Build the Step 1 form layout and field wiring
    - Define `Step1_AccountCredentials` in `LogIn.jsx`
    - Render four `FloatingInputField` instances: Email, Username, Password, Confirm Password
    - Wire each field's `onBlur` to set the corresponding `touched` flag
    - Render per-field validation error messages only when `touched` is `true` and the field is invalid (password errors list each unmet criterion individually)
    - Render the password match indicator below Confirm Password per design: visible only when both fields are non-empty, "Match" in `text-emerald-600` or "Mismatch" in `text-rose-500`
    - Render the "Next Step" button (disabled when `!step1Valid`) and a "Sign In" link below
    - Use Lucide-React icons: `Mail`, `AtSign`, `Lock`, `ArrowRight`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.2 Write property test — untouched fields never show errors (Property 3)
    - **Property 3: Untouched fields never show validation errors**
    - **Validates: Requirements 2.2**
    - For any arbitrary string value typed into a field without an `onBlur` event, assert that no error message is visible below that field

  - [ ]* 2.3 Write property test — email validation (Property 4)
    - **Property 4: Email validation correctly classifies all inputs**
    - **Validates: Requirements 2.3**
    - For arbitrary strings: assert valid email pattern accepted, invalid patterns rejected, error shown iff touched and invalid

  - [ ]* 2.4 Write property test — username validation (Property 5)
    - **Property 5: Username validation correctly classifies all inputs**
    - **Validates: Requirements 2.4**
    - For arbitrary strings: assert 3–30 chars of `[a-zA-Z0-9._]` accepted, others rejected

  - [ ]* 2.5 Write property test — password error message lists exactly unmet criteria (Property 6)
    - **Property 6: Password error message lists exactly the unmet criteria**
    - **Validates: Requirements 2.5**
    - For arbitrary password strings (touched field): assert error items match precisely the set of unmet rules

  - [ ]* 2.6 Write property test — match indicator visibility and value (Property 7)
    - **Property 7: Password match indicator is shown iff both fields are non-empty**
    - **Validates: Requirements 2.6**
    - For any `(password, confirmPassword)` pair: indicator absent when either is empty; "Match" when equal, "Mismatch" when not

  - [ ]* 2.7 Write property test — Step 1 Next button enabled iff all four fields valid (Property 8)
    - **Property 8: Step 1 "Next Step" button enabled iff all four fields pass validation**
    - **Validates: Requirements 2.7**
    - For valid `(email, username, password)` combos + matching confirm: button enabled; for any single invalid field or mismatched confirm: button disabled

- [x] 3. Checkpoint — Ensure all Step 1 tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement `Step2_PersonalDetails`
  - [x] 4.1 Build the Step 2 form layout and field wiring
    - Define `Step2_PersonalDetails` in `LogIn.jsx`
    - Render four `FloatingInputField` instances: First Name, Middle Name (label includes "(optional)"), Last Name, Phone Number
    - Phone field: display a `+63` prefix badge positioned with Tailwind absolute positioning per the design sketch
    - Wire each required field's `onBlur` to set the corresponding `touched` flag; Middle Name does not gate the "Next Step" button
    - Render per-field error messages only when touched and invalid (name regex: 1–50 chars of letters/spaces/hyphens/apostrophes; phone regex: `^9\d{9}$`)
    - Render "Back" and "Next Step" buttons; "Next Step" disabled when `!step2Valid`
    - Use Lucide-React icons: `User`, `Phone`, `ArrowLeft`, `ArrowRight`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 4.2 Write property test — name field validation (Property 9)
    - **Property 9: Name field validation correctly classifies all inputs**
    - **Validates: Requirements 3.3, 3.4**
    - For arbitrary strings: assert the name regex accepts valid names and rejects empty, too-long, and invalid-character inputs

  - [ ]* 4.3 Write property test — phone validation (Property 10)
    - **Property 10: Phone validation correctly classifies all inputs**
    - **Validates: Requirements 3.5**
    - For arbitrary strings: assert exactly 10 digits starting with `9` accepted, all others rejected

  - [ ]* 4.4 Write property test — Step 2 Next button enabled iff required fields valid (Property 11)
    - **Property 11: Step 2 "Next Step" button enabled iff required fields pass**
    - **Validates: Requirements 3.6**
    - For valid `(firstName, lastName, phone)` combos: button enabled; Middle Name value must not affect button state

- [x] 5. Implement `Step3_InstitutionalDetails`
  - [x] 5.1 Build the Step 3 form layout and static field wiring
    - Define `Step3_InstitutionalDetails` in `LogIn.jsx`
    - Render `FloatingDatalistField` for Organization and Community Group
    - Render `FloatingSelectField` for User Type with options: Student, Alumni, Faculty, Staff, Employee
    - Conditionally render `FloatingInputField` for Year Level only when `userType === 'Student'`
    - Clear `yearLevel` when User Type changes to a non-Student value
    - Render T&C and PP checkboxes with inline link buttons (`onOpenTC` / `onOpenPP`)
    - Render a `submitError` paragraph below the button row when non-empty
    - Render "Back" and "Create Account" buttons; "Create Account" shows `<Loader2>` spinner when `isSubmitting`, disabled when `!step3Valid || isSubmitting`; "Back" disabled when `isSubmitting`
    - Disable all Step 3 inputs while `isSubmitting`
    - Use Lucide-React icons: `Building2`, `Users`, `BookOpen`, `ArrowLeft`, `Loader2`
    - _Requirements: 4.1, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 5.7, 5.8_

  - [x] 5.2 Wire `authApi.getPublicLocations()` on first Step 3 entry
    - Call `getPublicLocations()` when Step 3 is first entered (use a `useEffect` inside `Step3_InstitutionalDetails` or a `useEffect` in `SignUp_Wizard` gated on `step === 3`)
    - Populate `locationsList`; on failure set `locationsError` with retry affordance
    - _Requirements: 4.2, 4.3_

  - [x] 5.3 Wire `authApi.getPublicGroups(locationId)` on Organization selection
    - When `locationId` changes to a non-null value, call `getPublicGroups(locationId)` and populate `communityGroups`
    - On failure set `groupsError` with retry affordance
    - When Organization changes to a different value, clear `groupInput` and `groupId`
    - Disable Community Group `FloatingDatalistField` when `locationId` is null
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [ ]* 5.4 Write property test — organization change clears community group (Property 13)
    - **Property 13: Organization change clears Community Group**
    - **Validates: Requirements 4.6**
    - For any two distinct organization selections, after switching from org1 to org2 assert `groupInput === ''` and `groupId === null`

  - [ ]* 5.5 Write property test — Step 3 Create Account button guard (Property 14)
    - **Property 14: Step 3 "Create Account" button enabled iff all required conditions are met**
    - **Validates: Requirements 4.13**
    - For arbitrary `(locationId, userType, groupId, tcChecked, ppChecked, yearLevel)` combos: button enabled iff all conditions satisfied including the Student/yearLevel conditional

- [x] 6. Checkpoint — Ensure all Step 2 and Step 3 tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `SignUp_Wizard` — top-level orchestration, submission, and step rendering
  - [x] 7.1 Define `SignUp_Wizard` with full state and derived values
    - Add the `SignUp_Wizard` named function to `LogIn.jsx`
    - Declare all `useState` variables from the design's internal state table
    - Compute all derived values inline: `emailValid`, `usernameValid`, `passwordRules`, `passwordValid`, `confirmMatchValid`, `firstNameValid`, `lastNameValid`, `phoneValid`, `step1Valid`, `step2Valid`, `step3Valid`, `showMatchIndicator`, `passwordsMatch`
    - Implement `buildPayload()` as described in the design
    - Render `<Progress_Bar currentStep={step} />` and conditionally render `Step1_AccountCredentials`, `Step2_PersonalDetails`, `Step3_InstitutionalDetails` based on `step`
    - Render `{showTCModal && <TC_Modal />}` and `{showPPModal && <PP_Modal />}` overlays
    - _Requirements: 1.1, 1.3, 1.4, 2.8, 3.7, 4.1_

  - [x] 7.2 Implement `handleSubmit` and API submission flow
    - On "Create Account" click: set `isSubmitting = true`, clear `submitError`, call `authApi.register(buildPayload())`
    - On success: reset all fields to defaults, reset `step` to 1, call `onSwitchToSignIn()`
    - On error: extract error message, set `submitError`, set `isSubmitting = false`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 7.3 Write property test — back navigation preserves all field values (Property 12)
    - **Property 12: Back navigation preserves all field values across steps**
    - **Validates: Requirements 3.8, 4.14**
    - For arbitrary field value sets: after advancing Step 1→2→3 and pressing Back twice, assert every field value is unchanged

  - [ ]* 7.4 Write property test — register payload built correctly (Property 15)
    - **Property 15: Register payload is constructed correctly from form state**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
    - Call `buildPayload()` directly with arbitrary valid inputs; assert `name`, `phone`, `userType`, `middleName`, `groupId`, `yearLevel` match the derived formulas from the design

  - [ ]* 7.5 Write property test — untouched fields never show errors (full wizard context, Property 3)
    - **Property 3: Untouched fields never show validation errors (full wizard)**
    - **Validates: Requirements 2.2**
    - Mount `SignUp_Wizard` and verify that no error text appears for any field before `onBlur` is triggered on that field

- [x] 8. Implement `TC_Modal` and `PP_Modal` overlay components
  - [x] 8.1 Implement `TC_Modal`
    - Define `TC_Modal` in `LogIn.jsx` as a full-screen overlay rendered on top of the wizard
    - Display the Terms and Conditions text in a scrollable container
    - Render a close button that calls `onClose()`
    - Style with Tailwind; must not navigate away or close the signup modal
    - _Requirements: 4.11_

  - [x] 8.2 Implement `PP_Modal`
    - Define `PP_Modal` in `LogIn.jsx` following the same overlay pattern as `TC_Modal`
    - Display the Privacy Policy text in a scrollable container
    - Render a close button that calls `onClose()`
    - _Requirements: 4.12_

- [x] 9. Implement Save/Restore dialog and `LogIn.jsx` integration
  - [x] 9.1 Add save/restore snapshot state to `LogIn.jsx`
    - Add `savedSnapshot: SignUpSnapshot | null` and `showRestoreDialog: boolean` state in `LogIn` (preserving the existing `saveSignUpData` / `restoreSignUpData` pattern)
    - When `isSignUp` transitions to `false` and at least one wizard field is non-empty, call `onSaveSnapshot` to capture the current snapshot
    - _Requirements: 6.1_

  - [x] 9.2 Implement `RestoreDialog` component and wiring
    - Define `RestoreDialog` in `LogIn.jsx` rendered as an overlay when `showRestoreDialog` is `true`
    - Render exactly two action buttons: "Start Fresh" and "Restore"
    - "Restore" repopulates all fields from the snapshot via `savedSnapshot` passed as `savedSnapshot` prop to `SignUp_Wizard`, then clears the snapshot and closes the dialog
    - "Start Fresh" discards the snapshot and resets the wizard to Step 1 with all fields empty
    - Clicking outside the dialog (backdrop click) behaves as "Start Fresh"
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.3 Write property test — save/restore round-trip (Property 16)
    - **Property 16: Save/restore round-trip recovers exact field values**
    - **Validates: Requirements 6.1, 6.3**
    - For arbitrary `SignUpSnapshot` records: assert that saving then restoring produces a wizard state identical to the snapshot (all fields + step number)

- [x] 10. Wire `SignUp_Wizard` into `LogIn.jsx` and guard existing flows
  - [x] 10.1 Mount `SignUp_Wizard` conditionally in `LogIn` return
    - Replace the legacy sign-up form section with `{isSignUp && <SignUp_Wizard ... />}` — wizard is not mounted when `isSignUp` is `false`
    - Pass the required props: `onSwitchToSignIn`, `onSaveSnapshot`, `savedSnapshot`, `onSnapshotConsumed`
    - Preserve the `isExpanding` re-entry guard, mode-toggle transition timing, and overlay panel animation
    - Verify that Sign In form, Forgot Password flow, and CAPTCHA popup are completely untouched in JSX and logic
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 10.2 Write unit tests for DOM gating and existing flow compatibility
    - Assert `SignUp_Wizard` is not in the DOM when `isSignUp` is `false`
    - Assert the Sign In form still submits with its original handler when `isSignUp` is `false`
    - Assert Forgot Password steps still render correctly
    - _Requirements: 7.4, 7.1, 7.2, 7.3_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property test file: `client/src/components/pages/LogIn.test.jsx` (alongside the source)
- Property tests use **fast-check** (`fc`) with a minimum of 100 iterations per test
- Unit tests use **Vitest** + **@testing-library/react**
- All styling uses Tailwind CSS exclusively; Lucide-React for all icons
- Sub-components (`Progress_Bar`, `FloatingDatalistField`, `FloatingSelectField`, `Step1_AccountCredentials`, `Step2_PersonalDetails`, `Step3_InstitutionalDetails`, `TC_Modal`, `PP_Modal`, `RestoreDialog`) are all defined as named functions inside or alongside `LogIn.jsx` — no new files required unless preferred
- The `Register_Payload` shape must not change; `buildPayload()` is the single source of truth

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.2", "2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "4.2", "4.3", "4.4", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "7.1", "8.1", "8.2"] },
    { "id": 4, "tasks": ["5.4", "5.5", "7.2", "9.1"] },
    { "id": 5, "tasks": ["7.3", "7.4", "7.5", "9.2"] },
    { "id": 6, "tasks": ["9.3", "10.1"] },
    { "id": 7, "tasks": ["10.2"] }
  ]
}
```
