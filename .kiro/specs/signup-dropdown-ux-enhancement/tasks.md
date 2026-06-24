# Implementation Plan: Signup Dropdown UX Enhancement

## Overview

Replace the three inconsistent dropdown controls in `Step3_InstitutionalDetails` (`LogIn.jsx`) with a single unified `FloatingSearchableDropdown` component. This involves adding a `filterOptions` pure function, a `useDebounce` hook, the `YEAR_LEVEL_OPTIONS` constant, the new component, swapping the three field usages in Step 3, and removing the now-unused `FloatingDatalistField` definition.

All changes are confined to `client/src/components/pages/LogIn.jsx`.

---

## Tasks

- [x] 1. Add `filterOptions` pure function and `YEAR_LEVEL_OPTIONS` constant
  - [x] 1.1 Implement `filterOptions(query, options, searchKey, subtitleKey, maxItems)`
    - Add a module-level pure function above `FloatingSearchableDropdown`
    - Empty `query` → return `options.slice(0, maxItems)` immediately, no string matching
    - Non-empty `query` → iterate options, push matches (case-insensitive on `searchKey` and `subtitleKey`), break early once `result.length === maxItems`
    - Never mutate the input `options` array; return a new array
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 1.2 Write property tests for `filterOptions`
    - **Property 1: Max-5 invariant** — for any `options` array and any `query`, result length ≤ `maxItems`
    - **Property 4: Empty-query default** — for any non-empty `options` array, `filterOptions('', options, 'name', 'abbreviation', 5)` equals `options.slice(0, 5)`
    - **Property 10: Case-insensitive match** — for any `query`, every item in result satisfies `item[searchKey].toLowerCase().includes(query.toLowerCase()) || item[subtitleKey]?.toLowerCase().includes(query.toLowerCase())`
    - **Property 11: filterOptions immutability** — input array reference and contents unchanged after call
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 1.3 Add `YEAR_LEVEL_OPTIONS` module-level constant
    - Declare as `const` outside any component so it is never reallocated on re-render
    - Five entries: `{ id: 1..5, name: '1st Year'..'5th Year', abbreviation: 'Y1'..'Y5' }`
    - _Requirements: 4.2_

- [x] 2. Implement `FloatingSearchableDropdown` component
  - [x] 2.1 Implement `useDebounce` hook inside `FloatingSearchableDropdown`
    - Accept `value` (string) and `delayMs` (number)
    - Use `useRef` to store the timer ID (avoids extra renders)
    - Clear previous timer on each value change; fire `setState` after `delayMs`
    - Clean up timer on unmount
    - _Requirements: 1.3_

  - [x] 2.2 Build the floating-label shell (visual structure)
    - Replicate the `FloatingInputField` layout exactly: `pt-6` wrapper, `h-12` field container, floating label with `top`/`transform` inline style
    - Derive `borderColor`, `iconColor`, `separatorColor`, `labelColor` from `error` and `isFocused` state using emerald/rose/slate tokens
    - Render left icon + vertical separator + text input, matching `FloatingInputField` class structure
    - Apply `opacity-50 cursor-not-allowed` styles when `disabled === true`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.3 Implement dropdown open/close logic and outside-click handler
    - `onFocus`: set `isFocused(true)` and `setIsOpen(true)` (always opens, regardless of `value` length)
    - `onBlur`: set `isFocused(false)` only — **do NOT close** here to avoid eating the item click
    - `onChange`: propagate `props.onChange(e.target.value)`; if value becomes `''` call `props.onClear?.()`; keep `isOpen(true)`
    - `onMouseDown` on item: call `props.onSelect(option)`, set input display text, `setIsOpen(false)`
    - Outside mousedown: attach `document.addEventListener('mousedown', ...)` in `useEffect`; close when event target is outside the wrapper ref
    - Gate all open behavior on `!disabled`
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 2.6, 3.2_

  - [x] 2.4 Render the upward dropdown list
    - Show list only when `isOpen && !disabled`
    - Position with `bottom-full mb-2 z-50` so it opens upward above the input
    - Header row: `"{displayed.length} Result(s)"`; use `BookOpen` icon matching existing style
    - Item rows: avatar circle (initials from `subtitleKey` or `displayKey`), primary text, subtitle line — matching `FloatingSearchDropdown` item design, using emerald hover tokens instead of lime
    - Empty state: render `emptyMessage` string with `Search` icon when `displayed.length === 0`
    - Cap displayed items using `filterOptions(debouncedQuery, options, searchKey, subtitleKey, 5)`
    - _Requirements: 1.2, 1.4, 1.5, 1.8, 1.9, 2.7_

  - [ ]* 2.5 Write property tests for `FloatingSearchableDropdown` behavior
    - **Property 2: Focus-open invariant** — when not `disabled`, focusing input always results in `isOpen === true`
    - **Property 6: Outside-click closure** — mousedown outside wrapper closes dropdown without calling `onSelect` or `onChange`
    - **Property 7: Disabled passthrough** — when `disabled === true`, no interaction opens the dropdown
    - **Property 8: Error state propagation** — when `error === true`, border/icon/label all use rose tokens, no emerald tokens on those elements
    - **Property 9: Label float consistency** — label is floated iff `isFocused || value.length > 0`
    - **Validates: Requirements 1.1, 1.6, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2_

  - [ ]* 2.6 Write unit tests for `FloatingSearchableDropdown` rendering and interaction
    - On render: dropdown closed
    - On focus: dropdown opens with ≤5 items
    - On item click: `onSelect` called, dropdown closes, input text = `option[displayKey]`
    - `disabled=true`: input non-interactive, dropdown never opens
    - `error=true`: border class contains `rose-500`
    - `value=""` after clear: shows first 5 defaults on next focus
    - _Requirements: 1.1, 1.2, 1.5, 2.3, 2.6, 3.2_

- [x] 3. Checkpoint — Verify `filterOptions` and `FloatingSearchableDropdown` in isolation
  - Ensure all tests pass. Ask the user if questions arise before proceeding to Step 3 wiring.

- [x] 4. Replace Step 3 field usages and remove legacy component
  - [x] 4.1 Replace Organization field in `Step3_InstitutionalDetails`
    - Remove the outer `<div className="relative w-full pt-6">` wrapper and manual label that currently wrap `FloatingSearchDropdown`
    - Replace `<FloatingSearchDropdown ... />` with `<FloatingSearchableDropdown id="signup-org" ... />` using the exact props shown in the design's example usage
    - Wire `onSelect` to update `orgInput`, `locationId`, clear `groupInput`/`groupId`, and mark `touched.orgInput`
    - Wire `onClear` to reset `locationId`, `groupInput`, `groupId`
    - Preserve the existing `locationsError` retry message below the field
    - _Requirements: 5.1, 5.2, 5.3, 8.1_

  - [x] 4.2 Replace Community Group field in `Step3_InstitutionalDetails`
    - Replace `<FloatingDatalistField ... />` with `<FloatingSearchableDropdown id="signup-group" ... />`
    - Pass `disabled={!locationId || isSubmitting}` to enforce org-first dependency
    - Wire `onSelect` to update `groupInput`, `groupId`, mark `touched.groupInput`
    - Wire `onClear` to set `groupId` to `null`
    - Preserve the existing `groupsError` retry message below the field
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 8.2_

  - [x] 4.3 Replace Year Level field in `Step3_InstitutionalDetails`
    - Replace `<FloatingInputField id="signup-yearlevel" ... />` with `<FloatingSearchableDropdown id="signup-yearlevel" ... options={YEAR_LEVEL_OPTIONS} />`
    - Keep the existing `{userType === 'Student' && ...}` conditional guard
    - Wire `onSelect` to set `yearLevel` to `opt.name` and mark `touched.yearLevel`
    - Wire `onClear` to set `yearLevel` to `''`
    - Preserve the existing `touched.yearLevel` error message below the field
    - _Requirements: 4.1, 4.3_

  - [x] 4.4 Remove `FloatingDatalistField` component definition
    - Confirm `FloatingDatalistField` is no longer referenced anywhere in `LogIn.jsx` after task 4.2
    - Delete the entire `FloatingDatalistField` function definition block from `LogIn.jsx`
    - _Requirements: 8.3_

  - [ ]* 4.5 Write property tests for Step 3 field wiring
    - **Property 12: Community Group disabled when no organization** — for any wizard state where `locationId` is `null`, Community Group `FloatingSearchableDropdown` receives `disabled={true}`
    - **Property 5: Selection closure and display-key fidelity** — clicking an item calls `onSelect` with the option, sets input text to `option[displayKey]`, closes dropdown
    - **Property 3: Debounce idempotence** — rapid keystrokes produce exactly one filter evaluation 300ms after the final keystroke
    - **Validates: Requirements 1.3, 1.5, 3.1, 3.2_

- [x] 5. Final checkpoint — Ensure all tests pass
  - Run the full test suite. Confirm Organization, Community Group, and Year Level all render and interact correctly. Confirm `FloatingDatalistField` is absent from the file. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for an MVP delivery
- All changes are confined to a single file: `client/src/components/pages/LogIn.jsx`
- `FloatingSelectField` and `FloatingInputField` are not touched — only their usage inside Step 3 is partially replaced
- The legacy `FloatingSearchDropdown` component definition can remain in the file (it is no longer used in Step 3 but is not explicitly required to be removed)
- Property tests use fast-check (already in the project's JS/TS ecosystem)
- Each task references specific requirements for traceability

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5"] }
  ]
}
```
