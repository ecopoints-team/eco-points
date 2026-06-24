# Requirements Document

## Introduction

This feature replaces three inconsistent dropdown/input controls in Step 3 of the `SignUp_Wizard` (Organization, Community Group, and Year Level) with a single, unified `FloatingSearchableDropdown` component. The new component brings a consistent emerald-themed floating-label shell, an upward-rendering options list, immediate defaults on focus, and debounced search filtering — eliminating the legacy `FloatingSearchDropdown` (lime-themed, no floating label, results only on input) and `FloatingDatalistField` (native browser datalist) from the signup flow.

## Glossary

- **FloatingSearchableDropdown**: The new unified dropdown component introduced by this feature. Renders an input with a floating label and an upward-opening options list capped at 5 items.
- **FloatingSearchDropdown**: The legacy lime-themed dropdown component used for the Organization field before this feature. Replaced by `FloatingSearchableDropdown`.
- **FloatingDatalistField**: The native browser datalist component used for the Community Group field before this feature. Replaced by `FloatingSearchableDropdown`.
- **FloatingInputField**: The existing floating-label input component. Its visual shell (border, icon, separator, color states) is reused by `FloatingSearchableDropdown`. Unchanged by this feature.
- **FloatingSelectField**: The existing native select component used for the User Type field. Unchanged by this feature.
- **Step3_InstitutionalDetails**: The third step of the signup wizard, which contains the Organization, Community Group, Year Level, and User Type fields.
- **SignUp_Wizard**: The multi-step signup modal that owns all field state and orchestrates step navigation.
- **filterOptions**: The pure function inside `FloatingSearchableDropdown` that filters and caps the options list based on the current debounced query.
- **useDebounce**: The React hook that trails the typed input value by 300 ms before triggering a filter re-evaluation.
- **YEAR_LEVEL_OPTIONS**: The static, module-level constant array of five year-level entries used exclusively by the Year Level field.
- **DropdownOption**: The data shape accepted by `FloatingSearchableDropdown` — requires at minimum `id` and `name` fields; optionally `abbreviation`.
- **locationId**: The selected organization's numeric ID, owned by `SignUp_Wizard`. Its presence or absence controls whether the Community Group field is enabled.
- **displayKey**: The prop that specifies which field of a `DropdownOption` to display as the input's text after selection (default: `"name"`).
- **searchKey**: The prop that specifies which field of a `DropdownOption` to match against the typed query (default: `"name"`).
- **subtitleKey**: The prop that specifies the secondary field used for both display in the list and fallback search matching (default: `"abbreviation"`).

---

## Requirements

### Requirement 1: FloatingSearchableDropdown Core Behavior

**User Story:** As a new user completing signup, I want dropdown fields that immediately show relevant options when I click them and filter as I type, so that I can find and select my organization, group, and year level without friction.

#### Acceptance Criteria

1. WHEN a user focuses or clicks the `FloatingSearchableDropdown` input and the field is not disabled, THE `FloatingSearchableDropdown` SHALL open the options list immediately, regardless of the current input value.
2. WHEN the `FloatingSearchableDropdown` input value is an empty string, THE `FloatingSearchableDropdown` SHALL display the first 5 items of the full `options` prop array in the dropdown list.
3. WHEN a user types into the `FloatingSearchableDropdown` and stops typing for 300 milliseconds, THE `FloatingSearchableDropdown` SHALL call `filterOptions(debouncedQuery, options, searchKey, subtitleKey, 5)` and replace the currently displayed items with the returned array; during the 300ms debounce window, the previously displayed list SHALL remain visible without changes.
4. WHILE the `FloatingSearchableDropdown` dropdown list is open, THE `FloatingSearchableDropdown` SHALL display at most 5 items at all times.
5. WHEN a user clicks an item in the dropdown list, THE `FloatingSearchableDropdown` SHALL call `onSelect` with the selected `DropdownOption`, set the input's displayed text to `option[displayKey]`, and close the dropdown list.
6. WHEN a `mousedown` event fires outside the `FloatingSearchableDropdown` wrapper element, THE `FloatingSearchableDropdown` SHALL close the dropdown list without calling `onSelect` or `onChange`.
7. WHEN the user clears the input to an empty string, THE `FloatingSearchableDropdown` SHALL call both `onChange('')` and the `onClear` callback if provided, so that parent state remains consistent.
8. IF the `filterOptions` function returns an empty array for the current query, THEN THE `FloatingSearchableDropdown` SHALL display the `emptyMessage` string inside the dropdown list instead of an item list.
9. THE `FloatingSearchableDropdown` SHALL pass `filterOptions` a `query` equal to the current debounced input text, the full `options` prop array, the `searchKey` prop, the `subtitleKey` prop, and `maxItems = 5`; `filterOptions` SHALL return a `DropdownOption[]` of length ≤ 5 that the component renders directly.

---

### Requirement 2: Visual Shell and State Styling

**User Story:** As a new user, I want the dropdown fields to match the visual style of other fields in the signup form, so that the form feels consistent and clear feedback is provided for focus, error, and disabled states.

#### Acceptance Criteria

1. THE `FloatingSearchableDropdown` SHALL render a floating label, left icon, vertical separator, and border using the same layout, dimensions (`h-12`, `pt-6` wrapper), and Tailwind class structure as `FloatingInputField`.
2. WHEN `error` is `false` and the field is focused, THE `FloatingSearchableDropdown` SHALL apply `border-emerald-500` to the container border, `text-emerald-500` to the icon, and `text-emerald-600` to the floating label.
3. WHEN `error` is `true`, THE `FloatingSearchableDropdown` SHALL apply `border-rose-500` to the container border, `text-rose-500` to the icon, and `text-rose-500` to the floating label; no `emerald` color token SHALL appear on the border, icon, or label elements while `error` is `true`.
4. WHEN the field is focused or the input value has one or more characters, THE `FloatingSearchableDropdown` SHALL render the floating label at `top: 24px, transform: translateY(-50%)` (floated above-border position).
5. WHEN the field is not focused and the input value is an empty string, THE `FloatingSearchableDropdown` SHALL render the floating label at `top: 48px, transform: translateY(-50%)` (resting in-field position).
6. WHEN `disabled` is `true`, THE `FloatingSearchableDropdown` SHALL render the field container with `opacity-50` and the input element with `cursor-not-allowed`.
7. THE `FloatingSearchableDropdown` SHALL render the dropdown options list with `bottom-full mb-2` positioning and `z-50` so it appears above the input field in an upward direction.

---

### Requirement 3: Disabled State — Community Group Dependency

**User Story:** As a new user, I want the Community Group field to be locked until I have selected an Organization, so that I cannot submit an invalid group-without-organization combination.

#### Acceptance Criteria

1. WHILE no Organization has been selected (i.e., `locationId` is `null` or `undefined`), THE `Step3_InstitutionalDetails` SHALL pass `disabled={true}` to the Community Group `FloatingSearchableDropdown`.
2. WHEN `disabled` is `true`, THE `FloatingSearchableDropdown` SHALL not open the dropdown list on focus, click, or any user interaction.
3. WHEN an Organization is selected and `locationId` is set, THE `Step3_InstitutionalDetails` SHALL pass `disabled={false}` to the Community Group `FloatingSearchableDropdown`, enabling interaction.

---

### Requirement 4: Year Level Field — Static Options

**User Story:** As a Student completing signup, I want a Year Level field that shows all available year options immediately on focus, so that I can select my year without typing.

#### Acceptance Criteria

1. WHEN `userType` is `'Student'`, THE `Step3_InstitutionalDetails` SHALL render a `FloatingSearchableDropdown` for Year Level using `YEAR_LEVEL_OPTIONS` as the `options` prop.
2. THE `Step3_InstitutionalDetails` SHALL supply `YEAR_LEVEL_OPTIONS` as a static constant containing exactly five entries: `'1st Year'`, `'2nd Year'`, `'3rd Year'`, `'4th Year'`, and `'5th Year'`, each with a corresponding `abbreviation` (`'Y1'`–`'Y5'`).
3. WHEN `userType` is not `'Student'`, THE `Step3_InstitutionalDetails` SHALL not render the Year Level `FloatingSearchableDropdown`.

---

### Requirement 5: Organization Field — API-Backed Options

**User Story:** As a new user, I want the Organization field to show institutions from the platform's database, so that I can find and select my real institution.

#### Acceptance Criteria

1. THE `Step3_InstitutionalDetails` SHALL supply the result of `authApi.getPublicLocations()` as the `options` prop to the Organization `FloatingSearchableDropdown`.
2. WHEN the Organization `FloatingSearchableDropdown` fires `onSelect`, THE `SignUp_Wizard` SHALL update `locationId` to the selected option's `id`, clear the Community Group input, and clear `groupId`.
3. WHEN the Organization `FloatingSearchableDropdown` fires `onClear`, THE `SignUp_Wizard` SHALL set `locationId` to `null`, clear the Community Group input, and set `groupId` to `null`.
4. IF `authApi.getPublicLocations()` rejects, THEN THE `Step3_InstitutionalDetails` SHALL display a rose-colored inline error message with a retry action below the Organization field.

---

### Requirement 6: Community Group Field — API-Backed Options

**User Story:** As a new user, I want the Community Group field to show only groups belonging to my selected organization, so that I can pick the correct group for my institution.

#### Acceptance Criteria

1. THE `Step3_InstitutionalDetails` SHALL supply the result of `authApi.getPublicGroups(locationId)` as the `options` prop to the Community Group `FloatingSearchableDropdown`, scoped to the currently selected `locationId`.
2. WHEN the Community Group `FloatingSearchableDropdown` fires `onSelect`, THE `SignUp_Wizard` SHALL update `groupId` to the selected option's `id`.
3. WHEN the Community Group `FloatingSearchableDropdown` fires `onClear`, THE `SignUp_Wizard` SHALL set `groupId` to `null`.
4. IF `authApi.getPublicGroups(locationId)` rejects, THEN THE `Step3_InstitutionalDetails` SHALL display a rose-colored inline error message with a retry action below the Community Group field.

---

### Requirement 7: filterOptions Algorithm

**User Story:** As a developer, I want a well-specified pure filter function, so that the dropdown's search behavior is predictable and testable independently of the React component.

#### Acceptance Criteria

1. WHEN `filterOptions` is called with an empty `query` string, THE `filterOptions` function SHALL return `options.slice(0, maxItems)` without evaluating any string match.
2. WHEN `filterOptions` is called with a non-empty `query`, THE `filterOptions` function SHALL return only items whose `option[searchKey]` or `option[subtitleKey]` contains `query` using case-insensitive comparison, up to `maxItems` items.
3. THE `filterOptions` function SHALL return an array of length at most `maxItems` for any combination of `query` and `options`.
4. THE `filterOptions` function SHALL not mutate the input `options` array.
5. WHEN `filterOptions` is called with an `options` array of length zero, THE `filterOptions` function SHALL return an empty array.

---

### Requirement 8: Legacy Component Replacement

**User Story:** As a developer, I want the legacy `FloatingSearchDropdown` and `FloatingDatalistField` components removed from the signup flow, so that the codebase has a single consistent dropdown pattern.

#### Acceptance Criteria

1. THE `LogIn.jsx` file SHALL replace all usages of `FloatingSearchDropdown` in `Step3_InstitutionalDetails` with `FloatingSearchableDropdown`.
2. THE `LogIn.jsx` file SHALL replace all usages of `FloatingDatalistField` in `Step3_InstitutionalDetails` with `FloatingSearchableDropdown`.
3. WHERE `FloatingDatalistField` is no longer referenced anywhere in `LogIn.jsx` after the migration, THE `LogIn.jsx` file SHALL remove the `FloatingDatalistField` component definition.
4. THE `FloatingSelectField` component and all `FloatingInputField` usages outside of Step 3 SHALL remain unchanged.
