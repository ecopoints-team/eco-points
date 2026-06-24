# Requirements Document

## Introduction

This feature improves the login modal in the EcoPoints Next.js/React application by redesigning the Email and Password input fields with sophisticated floating label and icon interactions. The goal is to elevate the visual fidelity and user experience of the sign-in form, aligning it with the existing emerald green brand identity. The redesign targets the `ElasticInput` component used exclusively in the login (sign-in) side of the `LogIn.jsx` modal, and introduces a new `FloatingInputField` component implementing the peer-based floating label pattern with dynamic icons, a separator line, password toggle, and error state styling.

## Glossary

- **FloatingInputField**: The new reusable React component that replaces `ElasticInput` in the sign-in form. It encapsulates all floating label, icon, separator, and error state logic.
- **FloatingLabel**: The `<label>` element that starts centered inside the input (left-aligned next to the icon) and floats to the upper border when the field is focused or contains a value.
- **LeftIcon**: The Lucide icon (`Mail` or `Lock`) rendered on the left side of each input field.
- **Separator**: A vertical `w-px h-6` line between the `LeftIcon` and the input area that fades in when the field is active.
- **Peer**: Tailwind CSS utility class applied to the `<input>` element to allow sibling elements to style themselves based on the input's state (`focus`, `not-placeholder-shown`).
- **ErrorState**: The visual mode applied to all field elements (border, label, icon, separator) when a validation error is present.
- **PasswordToggle**: The `Eye`/`EyeOff` Lucide button on the right side of the password field that toggles input visibility.
- **EmeraldGreen**: The brand active color `#10B981` (Tailwind `emerald-500`).
- **LoginForm**: The sign-in form (`<form onSubmit={handleLogin}>`) inside `LogIn.jsx`.

---

## Requirements

### Requirement 1: Floating Label Behavior

**User Story:** As a user opening the login modal, I want the input labels to clearly indicate what each field is for and animate gracefully when I interact with them, so that the form feels polished and easy to understand.

#### Acceptance Criteria

1. THE `FloatingInputField` SHALL render a `<label>` element that is vertically centered inside the input container and left-aligned beside the `LeftIcon` (or at the input's left padding edge when no `LeftIcon` is present) with `font-normal` weight and default font size when the input has no value and is not focused.
2. WHEN the `<input>` inside `FloatingInputField` receives focus, THE `FloatingInputField` SHALL transition the `FloatingLabel` so that it overlaps the top border of the input container, vertically centered on that border line, with a font size of `text-[11px]` and `font-bold` weight.
3. WHEN the `<input>` inside `FloatingInputField` contains one or more characters (i.e., `value` is non-empty), THE `FloatingInputField` SHALL keep the `FloatingLabel` in the floated position (top border, `text-[11px]`, `font-bold`) regardless of focus state.
4. THE `FloatingInputField` SHALL implement the label float transition using Tailwind's `peer` utility on the `<input>` and `peer-focus` / `peer-[:not(:placeholder-shown)]` modifier classes on the `<label>`, without requiring JavaScript-managed state for label position.
5. THE `FloatingLabel` SHALL apply a smooth CSS `transition` covering position, font-size, and font-weight properties, with a duration of at least `200ms`, so that the label animates smoothly between both the resting and floated states.
6. IF the `<input>` loses focus and its value is empty (length = 0), THEN THE `FloatingInputField` SHALL return the `FloatingLabel` to its resting position (vertically centered, `font-normal`, default font size).

---

### Requirement 2: Left-Aligned Icon Behavior

**User Story:** As a user, I want icons in each input field to give me a visual hint about what to enter and to respond when I interact with the field, so that the interface feels alive and communicative.

#### Acceptance Criteria

1. THE `FloatingInputField` SHALL render a `LeftIcon` (Lucide `Mail` for the email/credential field, Lucide `Lock` for the password field) on the left side of the input container at a size of 18×18 px.
2. WHILE the `<input>` inside `FloatingInputField` is not focused AND its value is an empty string (length = 0), THE `LeftIcon` SHALL display `text-slate-400` color.
3. WHEN the `<input>` inside `FloatingInputField` is focused AND the `error` prop is `false`, THE `LeftIcon` SHALL transition its color to `text-emerald-500` (`#10B981`). This emerald color SHALL NOT appear when the input merely contains a value without focus.
4. WHILE the `<input>` inside `FloatingInputField` contains a non-empty value AND is not focused AND the `error` prop is `false`, THE `LeftIcon` SHALL display `text-emerald-400` as a subtle filled-state indicator.
5. IF the `error` prop is `true`, THEN THE `LeftIcon` SHALL display `text-rose-500`, overriding both the focused (`text-emerald-500`) and filled-unfocused (`text-emerald-400`) colors.
6. THE `LeftIcon` color transition SHALL use a CSS `transition-colors` duration of `300ms`.

---

### Requirement 3: Dynamic Separator

**User Story:** As a user, I want a subtle visual separator between the icon and the label area that appears when I interact with a field, so that the input feels structured and premium.

#### Acceptance Criteria

1. THE `FloatingInputField` SHALL render a vertical `Separator` element with dimensions `w-px h-6` positioned between the `LeftIcon` and the input/label area. IF no `LeftIcon` is present, THE `Separator` SHALL NOT be rendered.
2. WHILE the `<input>` inside `FloatingInputField` is not focused AND its value is empty, THE `Separator` SHALL be `opacity-0` (invisible).
3. WHEN the `<input>` inside `FloatingInputField` is focused, THE `Separator` SHALL bidirectionally transition between `opacity-0` and `opacity-100` — transitioning to `opacity-100` on focus gain and transitioning back to `opacity-0` on focus loss if the value is empty.
4. IF the `<input>` contains a non-empty value AND is not focused, THEN THE `Separator` SHALL remain at `opacity-100` (visible as long as the field has content).
5. IF the `error` prop is `true`, THEN THE `Separator` SHALL display `bg-rose-200`; OTHERWISE THE `Separator` SHALL display `bg-slate-300`.
6. THE `Separator` opacity transition SHALL use `transition-opacity` with a duration of `200ms`.

---

### Requirement 4: Password Visibility Toggle

**User Story:** As a user entering my password, I want to be able to toggle password visibility so that I can verify I typed it correctly without re-entering it.

#### Acceptance Criteria

1. IF `FloatingInputField` is rendered with `type="password"`, THEN THE `FloatingInputField` SHALL render a `PasswordToggle` button on the right side of the input container.
2. THE `PasswordToggle` button SHALL have `type="button"` to prevent accidental form submission when rendered inside a `<form>`.
3. THE `PasswordToggle` button SHALL have an `aria-label` of `"Show password"` when the password is hidden and `"Hide password"` when the password is visible, so that screen reader users understand its purpose.
4. WHILE the password visibility state is hidden (default), THE `PasswordToggle` SHALL render the Lucide `Eye` icon and the underlying `<input>` SHALL have `type="password"`.
5. WHEN the `PasswordToggle` button is clicked and the current visibility state is hidden, THE `FloatingInputField` SHALL switch the `<input>` type to `"text"` and replace the `Eye` icon with the Lucide `EyeOff` icon.
6. WHEN the `PasswordToggle` button is clicked and the current visibility state is visible, THE `FloatingInputField` SHALL switch the `<input>` type back to `"password"` and restore the `Eye` icon.
7. IF `FloatingInputField` is rendered with `type="text"` or `type="email"`, THEN THE `FloatingInputField` SHALL NOT render a `PasswordToggle` button.

---

### Requirement 5: Error State Styling

**User Story:** As a user who submits incorrect credentials, I want the input fields to clearly signal the error visually so that I immediately understand something needs to be corrected.

#### Acceptance Criteria

1. THE `FloatingInputField` SHALL accept an `error` boolean prop that, when `true`, activates the error visual state across all sub-elements.
2. IF `error` is `true`, THEN THE input container border SHALL use `border-rose-500` instead of the default or focus border color.
3. IF `error` is `true`, THEN THE `FloatingLabel` SHALL use `text-rose-500` color, overriding both the default label color and the focused emerald label color.
4. IF `error` is `true`, THEN THE `LeftIcon` SHALL use `text-rose-500`, overriding all three icon states: default (`text-slate-400`), focused (`text-emerald-500`), and filled-unfocused (`text-emerald-400`).
5. IF `error` is `true`, THEN THE `Separator` SHALL use `bg-rose-200` color.
6. WHEN `error` transitions from `true` to `false`, THE `FloatingInputField` SHALL restore each element to the style appropriate for its current focus and value state: default styles if the field is empty and unfocused, focus styles if focused, or filled styles if it contains a value.

---

### Requirement 6: Integration into the Login Form

**User Story:** As a developer maintaining this codebase, I want the new `FloatingInputField` to be a drop-in replacement for `ElasticInput` in the login form so that the redesign is fully applied without breaking existing behavior.

#### Acceptance Criteria

1. THE `LoginForm` in `LogIn.jsx` SHALL use `FloatingInputField` for the credential (username/email) input, replacing the existing `ElasticInput` component.
2. THE `LoginForm` in `LogIn.jsx` SHALL use `FloatingInputField` for the password input, replacing the existing `ElasticInput` component, and SHALL pass the appropriate props to enable the `PasswordToggle`.
3. THE `FloatingInputField` SHALL accept at minimum the following props: `id`, `type`, `label`, `icon`, `value`, `onChange`, `required`, and `error`, so that the `LoginForm`'s existing data binding requires no restructuring.
4. THE `FloatingInputField` SHALL forward `onFocus` and `onBlur` event handler props, if provided, to the underlying `<input>` element.
5. WHEN the `LoginForm` receives an authentication error response from the server, THE `LoginForm` SHALL set `error={true}` on both `FloatingInputField` instances to activate the error state simultaneously.
6. THE existing `ElasticInput` component definition SHALL remain present in the file but SHALL NOT be rendered anywhere in `LogIn.jsx`, so that it is available for future reference without affecting the active UI.

---

### Requirement 7: Accessibility and Interaction Hygiene

**User Story:** As any user interacting with the login form, I want the inputs to be accessible and behave correctly with keyboard navigation, so that the modal is usable for everyone.

#### Acceptance Criteria

1. THE `FloatingInputField` SHALL associate the `<label>` with the `<input>` via matching `htmlFor` and `id` attributes, so that a mouse click on the label results in the `<input>` receiving focus.
2. THE `FloatingLabel` SHALL not intercept pointer events, so that a click anywhere in the input area — including over the label text — triggers focus on the underlying `<input>` rather than the label element.
3. WHEN the `PasswordToggle` button receives keyboard focus and the user activates it via `Enter` or `Space`, THE `FloatingInputField` SHALL toggle the password visibility state, identical to a mouse click.
4. THE `PasswordToggle` button SHALL have a visible focus indicator (e.g., a focus ring) when focused via keyboard, so that keyboard users can identify it as the currently focused element.
5. THE `FloatingInputField` SHALL be implemented so that sibling and child elements positioned relative to the field boundary (label floating position, icon placement) are correctly scoped to the field container without overlapping adjacent elements.
6. THE `<input>` element inside `FloatingInputField` SHALL be configured so that the CSS `:not(:placeholder-shown)` selector evaluates to `true` only when the field contains real user-entered content, not when it is visually empty.
7. THE `PasswordToggle` button SHALL have an `aria-label` that accurately reflects the current toggle state: `"Show password"` when the password is hidden and `"Hide password"` when the password is visible.
