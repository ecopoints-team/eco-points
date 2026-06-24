# Implementation Plan: Login Modal Redesign

## Overview

Replace the `ElasticInput` component in the sign-in form with a new `FloatingInputField` component implementing peer-driven floating labels, dynamic icon color states, a vertical separator, password visibility toggle, and rose-500 error styling. All changes are confined to `client/src/components/pages/LogIn.jsx`. Tests live alongside the component using Vitest + @testing-library/react + fast-check.

---

## Tasks

- [x] 1. Define the `FloatingInputField` component in `LogIn.jsx`
  - Add `FloatingInputField` function above `ElasticInput` inside `LogIn.jsx`
  - Declare internal `showPassword` state with `useState(false)`
  - Derive `isPassword`, `inputType`, and `hasIcon` constants
  - Add `data-testid="icon-wrapper"` to the icon wrapper `<div>`
  - Add `data-testid="separator"` to the separator `<div>`
  - Wrap the outermost container `<div>` in a `group` class for `group-focus-within` support
  - Set `placeholder=" "` (single space) on the `<input>` to enable `:not(:placeholder-shown)`
  - Wire `htmlFor={id}` on `<label>` and `id={id}` on `<input>`
  - Add `pointer-events-none` to the `<label>`
  - _Requirements: 1.1, 1.4, 2.1, 3.1, 6.3, 7.1, 7.2, 7.6_

- [x] 2. Implement floating label peer-driven styling
  - [x] 2.1 Apply resting and floated Tailwind classes to `<label>`
    - Resting classes: `top-1/2 -translate-y-1/2 text-sm font-normal text-slate-400`
    - Floated classes (peer-focus): `peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-bold`
    - Floated classes (filled): `peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-bold`
    - Active color (no error): `peer-focus:text-emerald-500`
    - Filled color (no error): `peer-[:not(:placeholder-shown)]:text-emerald-600`
    - Error color override: `text-rose-500` (JSX ternary when `error` is true)
    - Transition: `transition-all duration-200`
    - Position the `<label>` as `absolute` within the `relative flex-1 h-full` wrapper
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.3_

  - [x]* 2.2 Write property test for filled-state styles (Property 1)
    - **Property 1: Filled-state styles applied for any non-empty value**
    - **Validates: Requirements 1.3, 2.4, 3.4**
    - File: `client/src/components/pages/FloatingInputField.test.jsx`
    - Use `fc.string({ minLength: 1 })` generator, render unfocused with `error={false}`
    - Assert `label` has `text-[11px]`, icon wrapper has `text-emerald-400`, separator has `opacity-100`

- [x] 3. Implement LeftIcon color states
  - [x] 3.1 Apply icon color classes to the icon wrapper `<div>`
    - Default color: `text-slate-400`
    - Focused color (no error): `group-focus-within:text-emerald-500` via container `group` class
    - Filled, unfocused color (no error): `text-emerald-400` when `value.length > 0 && !error` (JSX ternary)
    - Error color: `text-rose-500` when `error` is true (JSX ternary, highest priority)
    - Transition: `transition-colors duration-300`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x]* 3.2 Write unit tests for LeftIcon color states
    - Test `text-slate-400` when empty and unfocused
    - Test `text-emerald-400` when value non-empty and unfocused
    - Test `text-rose-500` when `error={true}` (empty value)
    - Test `text-rose-500` when `error={true}` (non-empty value)
    - _Requirements: 2.2, 2.4, 2.5_

- [x] 4. Implement the Separator visibility and color
  - [x] 4.1 Apply separator Tailwind classes and JS-derived opacity logic
    - Dimensions: `w-px h-6`
    - Opacity: `value.length > 0 ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100'`
    - Error color: `bg-rose-200` when `error` is true; default color: `bg-slate-300`
    - Transition: `transition-opacity duration-200`
    - Render separator only when `hasIcon` is true
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x]* 4.2 Write unit tests for Separator behavior
    - Test separator absent when no `icon` prop
    - Test `opacity-0` when empty and unfocused
    - Test `opacity-100` when value non-empty
    - Test `bg-rose-200` when `error={true}`
    - Test `bg-slate-300` when `error={false}`
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 5. Checkpoint — Ensure label, icon, and separator tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement container border and error state
  - [x] 6.1 Apply container border classes and error override
    - Base container: `relative flex items-center w-full h-14 border rounded-lg px-3 group`
    - Default border: `border-slate-200 focus-within:border-emerald-500`
    - Error border: `border-rose-500` (replaces above when `error` is true via JSX ternary)
    - Transition: `transition-colors duration-200`
    - _Requirements: 5.1, 5.2_

  - [x]* 6.2 Write property test for error prop overriding all elements (Property 2)
    - **Property 2: Error prop overrides all visual elements for any input state**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
    - File: `client/src/components/pages/FloatingInputField.test.jsx`
    - Use `fc.string()` (any value) and `fc.boolean()` generators
    - Assert container has `border-rose-500`, label has `text-rose-500`, icon wrapper has `text-rose-500`, separator has `bg-rose-200`

  - [x]* 6.3 Write property test for error clearance restoring styles (Property 3)
    - **Property 3: Error clearance restores context-appropriate styles**
    - **Validates: Requirements 5.6**
    - File: `client/src/components/pages/FloatingInputField.test.jsx`
    - Use `fc.string()` generator; render with `error={true}`, rerender with `error={false}`
    - Assert no `border-rose-500`, no `text-rose-500` on container/label/icon
    - If `value.length > 0`, assert icon has `text-emerald-400`

- [x] 7. Implement PasswordToggle button
  - [x] 7.1 Render `Eye`/`EyeOff` toggle button for `type="password"` fields
    - Render toggle only when `isPassword` is true
    - Button `type="button"` to prevent accidental form submission
    - `aria-label={showPassword ? "Hide password" : "Show password"}`
    - Click handler: `() => setShowPassword(p => !p)`
    - Show `<EyeOff size={18} />` when `showPassword` is true; `<Eye size={18} />` when false
    - Add keyboard focus ring class (e.g., `focus:ring-2 focus:ring-emerald-500/50`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.3, 7.4, 7.7_

  - [x]* 7.2 Write unit tests for PasswordToggle
    - Test toggle button absent when `type="text"` or `type="email"`
    - Test toggle button present when `type="password"`
    - Test `aria-label="Show password"` initially
    - Test click → input `type="text"`, `aria-label="Hide password"`, EyeOff icon
    - Test second click → input `type="password"`, `aria-label="Show password"`, Eye icon
    - Test `type="button"` attribute on toggle button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Implement `onFocus` / `onBlur` prop forwarding and structural tests
  - [x] 8.1 Forward `onFocus` and `onBlur` props to the underlying `<input>`
    - Pass `onFocus` and `onBlur` through to `<input onFocus={onFocus} onBlur={onBlur} />`
    - _Requirements: 6.4, 7.5_

  - [x]* 8.2 Write unit tests for structural and accessibility requirements
    - Test `label[htmlFor]` matches `input[id]`
    - Test label has `pointer-events-none`
    - Test input has `placeholder=" "` (single space)
    - Test `onFocus` and `onBlur` props forwarded correctly
    - Test no `PasswordToggle` when `type="text"`
    - _Requirements: 7.1, 7.2, 7.6, 6.4_

- [x] 9. Checkpoint — Ensure PasswordToggle and accessibility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integrate `FloatingInputField` into `LoginForm`
  - [x] 10.1 Replace both `ElasticInput` usages in the sign-in `<form>` with `FloatingInputField`
    - Replace credential input: `id="login-credential"`, `type="text"`, `label="Username or Email"`, `icon={<Mail size={18} />}`, `value={loginCredential}`, `onChange={(e) => { setLoginCredential(e.target.value); setError(""); }}`, `required`, `error={Boolean(error)}`
    - Replace password input: `id="login-password"`, `type="password"`, `label="Password"`, `icon={<Lock size={18} />}`, `value={loginPassword}`, `onChange={(e) => { setLoginPassword(e.target.value); setError(""); }}`, `required`, `error={Boolean(error)}`
    - Add `setError("")` call inside `onChange` handlers to clear error on user input (per design error-handling note)
    - Leave `ElasticInput` definition intact and unrendered
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x]* 10.2 Write integration tests for `LoginForm` context
    - Test both `FloatingInputField` instances render in the sign-in form
    - Test `error={true}` propagates to both fields when `error` state is non-empty
    - Test `ElasticInput` is defined in module but not present in rendered output
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fc.assert` with `{ numRuns: 100 }` minimum
- Each property test file should be placed at `client/src/components/pages/FloatingInputField.test.jsx`
- The `group` / `group-focus-within` pattern handles icon and separator focus color (CSS only)
- The `peer` / `peer-focus` / `peer-[:not(:placeholder-shown)]` pattern handles label float (CSS only)
- The separator's non-empty, unfocused opacity is JS-derived (value.length check) since peer only targets following siblings
- `ElasticInput` must remain defined but unrendered per Requirement 6.6

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "6.1", "7.1", "8.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.2", "6.2", "6.3", "7.2", "8.2"] },
    { "id": 3, "tasks": ["10.1"] },
    { "id": 4, "tasks": ["10.2"] }
  ]
}
```
