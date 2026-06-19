# Remaining SQA Fixes — Implementation Plan

## Summary

7 remaining tasks from the SQA report. After investigation, **3 are real bugs**, **2 need design decisions**, and **2 are WAD** (Working As Designed).

---

## Real Bugs (fix immediately)

### 2.3 — Add User Bad Request (SQA 2.5.1)

**Root Cause**: Two issues in [AddRegularUserModal.jsx](file:///c:/Users/pc/Documents/Github/client/src/components/admin/AddRegularUserModal.jsx#L192-L207):

1. **Type mismatch**: `communityGroupId` (L204) is sent as a **string** from dropdown state, but `UserCreateSchema` (server) expects `Optional[int]` with `strict=True` → Pydantic rejects strings for int fields → HTTP 400
2. **Unknown field**: `isAdmin: false` (L206) is not declared in `UserCreateSchema` → `extra='forbid'` rejects it → HTTP 400 `UNKNOWN_FIELD`
3. **`locationId`** (L205) may also be a string from `currentLocation?.id` — needs `parseInt()`

**Fix** — [AddRegularUserModal.jsx](file:///c:/Users/pc/Documents/Github/client/src/components/admin/AddRegularUserModal.jsx#L192-L207):
```diff
  const payload = {
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      username: username.trim() || undefined,
      email: email.trim(),
      phone: phone || undefined,
      password,
      userType,
      yearLevel: showYearLevel && yearLevel ? yearLevel : undefined,
-     communityGroupId: showGroupField && communityGroupId ? communityGroupId : undefined,
-     locationId: effectiveLocationId,
-     isAdmin: false,
+     communityGroupId: showGroupField && communityGroupId ? parseInt(communityGroupId) : undefined,
+     locationId: effectiveLocationId ? parseInt(effectiveLocationId) : undefined,
  };
```

- Remove `isAdmin` — not in schema, not needed (backend sets `role='user'` by default)
- `parseInt()` for `communityGroupId` and `locationId` to satisfy `strict=True`

**Verify**: Users → Add User → fill form → submit → user appears in table (no Bad Request)

---

### 2.4 — Add Reward Not Appearing (SQA 2.7.1)

**Root Cause**: In [rewards/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/rewards/page.js#L455-L501):

The `handleSubmit` at L455 has correct local state update at L489-496 (`setRewards(prev => [{ ... }, ...prev])`), so the reward *should* appear. The actual issue is:
1. L498-500: errors are silently swallowed with `console.error` — user sees no feedback
2. L501: `setShowModal(false)` runs even on failure — user thinks it succeeded

**Fix** — [rewards/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/rewards/page.js#L498-L501):
```diff
          } catch (err) {
-             console.error('Failed to save reward:', err);
+             alert(err.message || 'Failed to save reward');
+             return;
          }
          setShowModal(false);
```

- Surface errors via `alert()` (consistent with other fixes)
- `return` on error so modal stays open for retry

**Verify**: Rewards → Add Reward → fill form → submit → reward appears (or error shown)

---

### 2.5 — Dashboard Location Filter (SQA 2.1.1 + 3.1)

**Root Cause**: The dashboard page [admin/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/page.js) needs investigation — the file doesn't follow the `/dashboard/page.js` convention. Since it's a 47KB file, the issue is likely that `effectiveLocationId` is not in all `useEffect` dependency arrays.

**Fix**: 
- Audit every `useEffect` in the dashboard for missing `effectiveLocationId` dependency
- Ensure all dashboard API calls pass `effectiveLocationId` as location parameter
- When `effectiveLocationId` changes (via "View As"), data should re-fetch automatically

**Verify**: Switch "View As" location → all dashboard stat cards update

> [!IMPORTANT]
> This task requires reading the full 47KB dashboard page to identify all stale dependency arrays. I'll audit every `useEffect` during implementation.

---

## Design Decisions Needed

### 3.2 — Leaderboard Role Filter (SQA 2.8.2)

**SQA Report**: "Test Technician account did not show when filter was 'staff'"

> [!IMPORTANT]
> **Question**: Should the "Staff" filter on the leaderboard include admin-role users like `technician`? The SQA tester expected a technician to appear under "Staff", but:
> - `technician` is an **admin role** (`role` field), not a **user type** (`userType` field)
> - "Staff" typically maps to `userType: 'staff'` which is a non-admin user type
> 
> Options:
> 1. **Staff = `userType: 'staff'` only** (current behavior, technically correct)
> 2. **Staff = `userType: 'staff'` OR `role IN (technician, head_admin, auditor)`** (includes admin staff)
> 3. **Mark as WAD** and explain to SQA that technicians are admin-role accounts, not "Staff" user type

### 3.3 — Analytics Role Filter (SQA 3.1.3)

**SQA Report**: "Does not show users for each role when switching Student/Faculty/Staff"

The analytics page at [analytics/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/analytics/page.js#L425-L431) shows a `userTypePieData` pie chart derived from `data.userTypeDistribution` (server-side aggregation). There's **no client-side role filter** on this page — the pie chart shows all user types from the server.

> [!IMPORTANT]
> **Question**: Is the SQA test expecting a dropdown filter that doesn't exist? The analytics page has no role selector — it shows a pie chart of all user type distribution. Options:
> 1. **Add a role filter dropdown** to the analytics page (new feature)
> 2. **Mark as WAD** — analytics shows aggregate distribution, not per-role filtering
> 3. **The SQA test is about a different page** — needs clarification

---

## WAD (Working As Designed)

### 3.4 — Chart Toggle Monthly/Yearly Blank (SQA 2.9.3)

**Analysis**: The analytics page [analytics/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/analytics/page.js#L288-L302) correctly handles all three time ranges:
- `week` → `weeklyTrendData` (from `data.dailyTrends`)
- `month` → `yearFilteredTrendData` (filtered by year)
- `year` → aggregated from all months

Charts appear blank because there is **no data** for the selected period — if all bottle sessions happened in the current week, monthly/yearly aggregations would have data. This is a **data availability issue**, not a code bug.

**Optional enhancement**: Add "No data for this period" empty state message when `trendFilteredData.length === 0`.

### 3.5 — Year Filter Only Shows 2026 (SQA 2.9.5)

**Analysis**: The year picker at [analytics/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/analytics/page.js#L259-L264) derives available years from actual data timestamps (`availableTrendYears`). Since all data was created in 2026, only 2026 appears. This is **correct behavior** — showing 2025 with no data would be misleading.

**Verdict**: WAD. No code change needed.

### 3.6 — Duplicate of 3.1

Already resolved when we added `redemptionCode` to the rewards log search filter.

---

## Proposed Changes

### [AddRegularUserModal.jsx](file:///c:/Users/pc/Documents/Github/client/src/components/admin/AddRegularUserModal.jsx)
- L204: `parseInt(communityGroupId)` 
- L205: `parseInt(effectiveLocationId)`
- L206: Remove `isAdmin: false`

### [rewards/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/rewards/page.js)
- L498-501: Surface error via `alert()`, add `return` to keep modal open on failure

### [admin/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/page.js)
- Audit all `useEffect` blocks for missing `effectiveLocationId` dependency
- Ensure dashboard API calls re-fetch when location changes

### Optional: [analytics/page.js](file:///c:/Users/pc/Documents/Github/client/app/admin/analytics/page.js)
- Add empty state message when chart data is empty (3.4 enhancement)

---

## Verification Plan

### Automated
```bash
cd client && npm run build     # zero errors
cd client && npm test           # all 22 tests pass
cd server && python -m pytest -m "not integration" -q  # all 223 tests pass
```

### Manual
1. **Add User**: Users → Add User → fill form → submit → user appears in table
2. **Add Reward**: Rewards → Add Reward → fill form → submit → reward appears in list
3. **Dashboard Filter**: Switch "View As" → dashboard cards refresh
4. **Chart Toggle**: Toggle Weekly/Monthly/Yearly → see data or "No data" message
