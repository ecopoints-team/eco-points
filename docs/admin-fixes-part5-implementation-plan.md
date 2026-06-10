# Admin Dashboard Fixes — Part 5 Implementation Plan

Scope: implement skeleton loading across admin pages, fix dashboard refresh behavior, and remove Leaderboards.

Goals

- Make the dashboard feel fast and consistent by adding skeletons to all cards and tables listed in Part 5.
- Ensure the Dashboard Overview refresh triggers a page-level reload and skeleton activation.
- Remove the Leaderboards menu and any related runtime references.

Targets

- Frontend paths (likely): `client/app/admin`, `client/app/leaderboard`, `client/src/components`, `client/app/layout.js` or `client/layout.js`.

Tasks

1. Discovery (0.5 day)
   - Locate components for: Overview cards, `Recycling Analytics` card, `Real-Time Bottle Logs` tables, Location/Machine/User Management/Reward Inventory/Bulk Session/System Logs cards, and the Leaderboards menu.
   - Identify the refresh button implementation (where the event originates).

2. Implementation (1–2 days)
   - Add a small, reusable `SkeletonCard` and `SkeletonTable` component under `client/src/components/ui/`.
   - Replace/loading wrappers: Wrap the Recycling Analytics card, Real-Time Bottle Logs summary tables, and the cards in Location/Machine/User/Reward/BulkSession/SystemLogs with skeletons that show when data is loading.
   - Update the Dashboard Overview refresh button handler to trigger a page-level reload or re-fetch that sets a global `isLoading` state used by skeletons.
   - Ensure Analytics page refresh also sets skeletons when appropriate.

3. Cleanup (0.5 day)
   - Remove `client/app/leaderboard` directory and navigation links. Run a code search to remove remaining imports.

4. Tests & Docs (0.5 day)
   - Add a small visual smoke test or unit test to ensure skeletons render on loading state.
   - Update `docs/admin-fixes-notes.md` and this plan with implementation details and a PR checklist.

Implementation notes

- Use a simple prop-driven skeleton: `loading` boolean toggles skeleton vs content.
- Prefer non-breaking changes: add skeleton wrappers rather than refactor internal component logic.
- For the refresh behavior, prefer setting a top-level loading state (e.g., React Context or Redux) so all skeletons respond consistently.

Deliverables

- `client/src/components/ui/SkeletonCard.jsx` and `SkeletonTable.jsx` (or `.tsx` per project conventions).
- Code changes that wrap the specified cards/tables with the skeleton loading.
- Updated navigation with Leaderboards removed.
- Tests and PR notes.

Risks

- Removing Leaderboards may break pages if references remain; ensure thorough search and fix imports.
- Global loading state changes can affect other UI; scope changes carefully.

Next step

- With your approval, I'll start Discovery: locate the affected components and list filenames to change.
