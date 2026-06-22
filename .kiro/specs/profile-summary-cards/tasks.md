# Implementation Plan: Profile Summary Cards

## Overview

All changes are contained within a single file: `client/src/components/pages/ProfileSection.jsx`. The implementation adds two inline summary card components (`CurrentBalanceCard` and `RewardsRedeemedCard`) rendered in a `SummaryCardsRow` above `ProfileHeatmap`, confirms and enhances the existing `AmbientBackground` layer, and adds two pure helper functions along with their property-based tests.

No new files, new dependencies, or new API calls are required. `Zap` is the only addition to the existing `lucide-react` import.

---

## Tasks

- [x] 1. Extend the lucide-react import and add pure helper functions
  - [x] 1.1 Add `Zap` to the existing `lucide-react` named import alongside `ShoppingBag`
    - Open the import block at the top of `ProfileSection.jsx`
    - Append `Zap` to the destructured list — do not create a new import statement
    - _Requirements: 1.8, 1.9_

  - [x] 1.2 Define `formatBalance` and `computePointsSpent` as pure module-level functions
    - Place both functions near the existing `fmt` / `fmtPhone` helpers
    - `formatBalance(value)`: returns `'—'` when value is `null`/`undefined`, otherwise `value.toLocaleString()`
    - `computePointsSpent(redemptions)`: returns `redemptions.reduce((sum, r) => sum + (r.pointsCost ?? 0), 0)`
    - Both functions must never throw and must return the correct type for all inputs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 6.3, 6.4, 6.5_

  - [ ]* 1.3 Write property-based tests for `formatBalance` using fast-check
    - **Property 1: Non-null number input always returns a non-empty string**
    - **Validates: Requirements 1.1, 6.3**
    - **Property 2: `formatBalance(null)` and `formatBalance(undefined)` both return `'—'`**
    - **Validates: Requirements 1.3, 6.3**
    - **Property 3: For any integer n ≥ 0, `formatBalance(n)` contains no leading zeros (except `"0"` itself)**
    - **Validates: Requirements 1.1, 1.7**

  - [ ]* 1.4 Write property-based tests for `computePointsSpent` using fast-check
    - **Property 4: Result is always ≥ 0 for any array of non-negative `pointsCost` values**
    - **Validates: Requirements 2.2, 2.3**
    - **Property 5: Sum is additive — `computePointsSpent(A.concat(B)) === computePointsSpent(A) + computePointsSpent(B)`**
    - **Validates: Requirements 2.2, 6.5**
    - **Property 6: Redemptions with missing `pointsCost` contribute 0 — result equals sum of only the defined costs**
    - **Validates: Requirements 2.3, 6.5**

- [x] 2. Confirm and enhance the AmbientBackground layer
  - [x] 2.1 Verify the existing `AmbientBackground` `<div>` matches the required spec
    - Confirm: `position: fixed`, `inset: 0`, `zIndex: 0`, `pointerEvents: 'none'`, `overflow: 'hidden'`, `background: '#F8FAFC'`
    - Confirm: `aria-hidden="true"` attribute is present
    - If any attribute is missing or incorrect, update it in place
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 2.2 Ensure exactly 4 blob orb `<div>` elements are present with correct positioning and styling
    - Blob 1 — top-left, emerald (`#10B981`), `blur: 130px`, `opacity: 0.07`
    - Blob 2 — bottom-right, teal (`#00838F`), `blur: 120px`, `opacity: 0.08`
    - Blob 3 — middle-right, forest green (`#065F46`), `blur: 150px`, `opacity: 0.05`
    - Blob 4 — bottom-left, dark emerald (`#064E3B`), `blur: 100px`, `opacity: 0.06`
    - Each blob must have a distinct CSS animation name (`profileBlob1`–`profileBlob4`) with an 18–26 s cycle and `mix-blend-multiply`
    - Add or update blobs as needed; do not remove any existing blob that already meets spec
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 2.3 Add or confirm the SVG grid texture element inside `AmbientBackground`
    - Render a full-viewport `<svg>` with a `<defs><pattern>` repeating grid/cube at 32×32 px
    - Set `opacity: 0.03` on the SVG element
    - `<rect width="100%" height="100%" fill="url(#pgrid)" />` must cover the full viewport
    - _Requirements: 3.6_

  - [x] 2.4 Add `@keyframes profileBlob1`–`profileBlob4` inside a `<style>` tag at the end of `AmbientBackground`
    - Each keyframe animates `border-radius` and `translate` for slow organic morphing motion
    - Duration must be between 18 s and 26 s per blob (use different durations for each)
    - Confirm `mix-blend-multiply` is applied to each blob element
    - _Requirements: 3.5_

- [x] 3. Checkpoint — AmbientBackground complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the CurrentBalanceCard inline JSX
  - [x] 4.1 Build the `CurrentBalanceCard` markup inside the `SummaryCardsRow` grid
    - Root: `<div className="relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between min-h-[160px]" style={{ background: '#064E3B' }}>`
    - Decoration: two absolute blurred circles — `absolute -top-6 -right-6 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl` and `absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-teal-400/20 blur-2xl`
    - Watermark: `<Zap className="absolute top-3 right-3 text-emerald-300/10" size={80} />`
    - Label row: glow dot `<span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />` + `<Zap size={12} className="text-emerald-400" />` + uppercase label in `text-[10px] font-black tracking-widest text-emerald-300`
    - Main value: `text-5xl font-black text-white leading-none` using `fonts.data`, rendering `(currentUser?.points ?? 0).toLocaleString()`, with `"EP"` label in `text-sm font-bold text-emerald-300 mb-1`
    - Footer: `bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2` row with "Total Accumulated" label and `(currentUser?.lifetimePoints ?? 0).toLocaleString() + ' EP'`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13_

  - [ ]* 4.2 Write unit tests for CurrentBalanceCard rendering
    - Render with `currentUser = { points: 1250, lifetimePoints: 12400 }` — assert `"1,250"` and `"12,400 EP"` appear
    - Render with `currentUser = { points: null, lifetimePoints: undefined }` — assert both show `"0"` (not blank/NaN/undefined)
    - Render with `currentUser = null` — assert no crash and both values show `"0"`
    - _Requirements: 1.3, 1.4, 1.5, 6.3, 6.4_

- [x] 5. Implement the RewardsRedeemedCard inline JSX
  - [x] 5.1 Build the `RewardsRedeemedCard` markup inside the `SummaryCardsRow` grid
    - Root: `<div className="relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between min-h-[160px]" style={{ background: 'linear-gradient(135deg, #10B981, #00838F)' }}>`
    - Watermark: `<ShoppingBag className="absolute -top-2 -right-2 text-white/20 rotate-12" size={100} />`
    - Decoration: `absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 blur-2xl`
    - Label row: frosted icon container `w-5 h-5 rounded-md bg-white/20 backdrop-blur-md` wrapping `<ShoppingBag size={11} className="text-white" />` + uppercase label `text-[10px] font-black tracking-widest text-white/80`
    - Main value: `text-5xl font-black text-white leading-none` using `fonts.data`, rendering `allRedemptions.length`, with `"Items"` label in `text-sm font-bold text-white/70 mb-1`
    - Footer: `bg-white/10 backdrop-blur-md rounded-xl px-4 py-2` row with "Points Spent" label and `computePointsSpent(allRedemptions).toLocaleString() + ' EP'`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

  - [ ]* 5.2 Write unit tests for RewardsRedeemedCard rendering
    - Render with `allRedemptions = [{ pointsCost: 100 }, { pointsCost: 200 }]` — assert count `"2"` and footer `"300 EP"`
    - Render with `allRedemptions = []` — assert `"0"` count and `"0 EP"` footer
    - Render with `allRedemptions = [{ pointsCost: undefined }]` — assert count `"1"` and footer `"0 EP"`
    - Render and assert no crash when `allRedemptions` is `[]` (simulating failed fetch)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2, 6.5_

- [x] 6. Checkpoint — Both cards render correctly in isolation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Insert `SummaryCardsRow` into `ProfileSection` and wire layout
  - [x] 7.1 Wrap both card `<div>` elements in the `SummaryCardsRow` grid container
    - Grid container: `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`
    - `CurrentBalanceCard` must be the first child (left position at sm+)
    - `RewardsRedeemedCard` must be the second child (right position at sm+)
    - Both cards must include `overflow-hidden` so decorative absolute children are clipped to card bounds
    - _Requirements: 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Insert `SummaryCardsRow` as the first child of the `lg:col-span-3` flex column div, directly before `<ProfileHeatmap />`
    - Locate the `div` with `className` containing `lg:col-span-3` in the return block
    - Insert the `SummaryCardsRow` JSX block as the first child of that div
    - Confirm `<ProfileHeatmap />` remains immediately after `SummaryCardsRow` in document order
    - Confirm `<RecentActivity />` remains after `<ProfileHeatmap />` — do not reorder
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 7.3 Write integration tests for `SummaryCardsRow` placement and responsive layout
    - Render `ProfileSection` with mocked `AuthContext` and `rewardsApi` — assert `SummaryCardsRow` appears before `ProfileHeatmap` in the DOM
    - Assert both cards are rendered within a single container with `grid-cols-1 sm:grid-cols-2`
    - Assert `AmbientBackground` (fixed, `z-0`) is rendered before the content grid
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 5.1, 5.2_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- All implementation is in a single file: `client/src/components/pages/ProfileSection.jsx`
- `Zap` is the only new import; `ShoppingBag` is already imported
- `formatBalance` and `computePointsSpent` are module-level pure functions — no hooks or effects needed
- Property-based tests use the `fast-check` library already called out in the design document
- `overflow-hidden` on each card is required to contain decorative absolute-positioned children within card bounds (Requirements 5.4, 5.5)
- The `allRedemptions` state is initialised to `[]` and the fetch `catch` block silently keeps it as `[]`, so both cards always have valid input without additional guarding

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "5.1"] },
    { "id": 4, "tasks": ["4.2", "5.2"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2"] },
    { "id": 7, "tasks": ["7.3"] }
  ]
}
```
