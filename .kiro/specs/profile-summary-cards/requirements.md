# Requirements Document

## Introduction

This feature adds two premium summary cards — **Current Balance** and **Rewards Redeemed** — plus confirms and enhances an existing ambient background layer, all within `ProfileSection.jsx` of the EcoPoints app. The cards give users an immediate at-a-glance view of their EcoPoints standing before they scroll into activity detail. All data is sourced from the existing `currentUser` auth context and the `allRedemptions` state array already fetched on component mount. No new files, external dependencies, or API calls are introduced.

---

## Glossary

- **ProfileSection**: The React component (`ProfileSection.jsx`) that renders the user's profile dashboard page.
- **CurrentBalanceCard**: The premium dark forest-green summary card that displays the user's live spendable EcoPoints balance and lifetime accumulated total.
- **RewardsRedeemedCard**: The premium vibrant-gradient summary card that displays the count of redeemed rewards and total EcoPoints spent on redemptions.
- **AmbientBackground**: The fixed decorative layer (`z-0`) behind the entire profile page that provides glassmorphic visual depth using blob orbs and an SVG grid texture.
- **SummaryCardsRow**: The two-column grid layout container that holds `CurrentBalanceCard` and `RewardsRedeemedCard` side by side, placed above `ProfileHeatmap`.
- **ProfileHeatmap**: The existing activity heatmap component already rendered in the main column of `ProfileSection`, whose position must remain unchanged.
- **currentUser**: The authenticated user object sourced from `useAuth()`, providing `points` (live spendable balance) and `lifetimePoints` (total ever earned).
- **allRedemptions**: The component-level state array of `Redemption` objects fetched from `rewardsApi.getMyRedemptions()` on mount.
- **Redemption**: An object in `allRedemptions` representing a single reward redemption; contains `pointsCost` (number), `status` (string), and `rewardName` (string).
- **EP**: Abbreviation for EcoPoints, displayed as a unit label alongside numeric values.
- **pointsSpent**: The derived sum of all `pointsCost` values across `allRedemptions`, used as the footer value on `RewardsRedeemedCard`.
- **fmt**: The existing helper function in `ProfileSection.jsx` that returns `'—'` for `null`/`undefined`/empty values and the original value otherwise.
- **Space Mono**: The monospace typeface used for all numeric data display in the cards, already configured in `tailwind.config.js`.
- **Blob Orb**: A large, absolutely-positioned `<div>` with heavy CSS blur, low opacity, and a brand color, used as a decorative element in the `AmbientBackground`.
- **Zap**: The Lucide React icon used as a watermark and label icon on `CurrentBalanceCard`.
- **ShoppingBag**: The Lucide React icon used as a watermark and label icon on `RewardsRedeemedCard`.

---

## Requirements

### Requirement 1: Current Balance Card Display

**User Story:** As a logged-in user, I want to see my current EcoPoints balance prominently on my profile, so that I can quickly understand how many points I have available to spend.

#### Acceptance Criteria

1. IF `currentUser` data is available, THEN THE `CurrentBalanceCard` SHALL display the user's current spendable EcoPoints balance as the main value, formatted with locale-specific thousands separators (e.g., `1250` → `"1,250"`).
2. IF `currentUser` data is available, THEN THE `CurrentBalanceCard` SHALL display the user's lifetime accumulated EcoPoints in a footer area labelled "Total Accumulated", formatted with locale-specific thousands separators.
3. IF `currentUser.points` is absent or not a number at render time, THEN THE `CurrentBalanceCard` SHALL display `0` as the balance without rendering a blank, "undefined", or "NaN" value.
4. IF `currentUser.lifetimePoints` is absent or not a number at render time, THEN THE `CurrentBalanceCard` SHALL display `0` in the Total Accumulated footer without rendering a blank, "undefined", or "NaN" value.
5. WHILE user data is being fetched and `currentUser` is not yet populated, THE `CurrentBalanceCard` SHALL display `0` for both the balance and Total Accumulated values rather than rendering blank or errored content.
6. THE `CurrentBalanceCard` SHALL render the label "CURRENT BALANCE" in visually distinct uppercase lettering with wide letter spacing.
7. THE `CurrentBalanceCard` SHALL render the main numeric value in a large, bold, monospace typeface, with an "EP" unit label visually adjacent and smaller in size.
8. THE `CurrentBalanceCard` SHALL render a large, low-opacity lightning bolt icon as a decorative watermark anchored to the top-right of the card, visually behind the main content.
9. THE `CurrentBalanceCard` SHALL render a small lightning bolt icon as an accent beside the card label at full brand-green opacity.
10. THE `CurrentBalanceCard` SHALL render the "Total Accumulated" footer area as a visually distinct, dark semi-transparent panel at the bottom of the card.
11. THE `CurrentBalanceCard` SHALL render two decorative blurred colour circles — one near the top-right corner and one near the bottom-left corner — to create an internal lighting effect within the card.
12. THE `CurrentBalanceCard` SHALL use a dark forest green as its base background colour, consistent with the EcoPoints brand palette.
13. THE `CurrentBalanceCard` SHALL maintain a minimum rendered height sufficient to display all content without visual collapse at any supported viewport width.

---

### Requirement 2: Rewards Redeemed Card Display

**User Story:** As a logged-in user, I want to see how many rewards I have redeemed and how many points I have spent, so that I can track my redemption history at a glance.

#### Acceptance Criteria

1. WHEN `ProfileSection` renders, THE `RewardsRedeemedCard` SHALL display the total count of items in `allRedemptions` as the main value.
2. WHEN `ProfileSection` renders, THE `RewardsRedeemedCard` SHALL display the total points spent across all redemptions — summed from each redemption's point cost — formatted with locale-specific thousands separators in a footer labelled "Points Spent".
3. IF a `Redemption` object is missing a point cost value, THEN its contribution to the points-spent total SHALL be treated as `0`, leaving the sum unaffected.
4. WHILE `allRedemptions` is an empty array (including before the first fetch completes), THE `RewardsRedeemedCard` SHALL display `0` as the item count and `0 EP` as the points-spent footer value without a blank or error state.
5. WHILE the redemptions fetch is in progress and `allRedemptions` has not yet been populated, THE `RewardsRedeemedCard` SHALL display `0` for both the item count and points-spent values rather than rendering blank or errored content.
6. WHEN the redemptions fetch fails, THE `RewardsRedeemedCard` SHALL continue to display `0` for both the item count and points-spent values; no error message or error boundary SHALL be surfaced within the card.
7. THE `RewardsRedeemedCard` SHALL render the label "REWARDS REDEEMED" in visually distinct uppercase lettering with wide letter spacing.
8. THE `RewardsRedeemedCard` SHALL render the main numeric value in a large, bold, monospace typeface, with an "Items" unit label visually adjacent and smaller in size.
9. THE `RewardsRedeemedCard` SHALL render a large, low-opacity shopping bag icon as a decorative watermark anchored to the top-right of the card and rotated slightly, visually behind the main content.
10. THE `RewardsRedeemedCard` SHALL render a small shopping bag icon inside a frosted-glass container beside the card label.
11. THE `RewardsRedeemedCard` SHALL render the "Points Spent" footer area as a frosted-glass panel at the bottom of the card, displaying the computed points-spent value in a monospace typeface.
12. THE `RewardsRedeemedCard` SHALL render one decorative blurred white circle near the bottom-left corner to create an internal lighting effect within the card.
13. THE `RewardsRedeemedCard` SHALL use a vibrant green-to-teal gradient as its background, consistent with the EcoPoints brand palette.
14. THE `RewardsRedeemedCard` SHALL maintain a minimum rendered height sufficient to display all content without visual collapse at any supported viewport width.

---

### Requirement 3: Ambient Background Layer

**User Story:** As a user viewing the profile page, I want the page to have a premium visual depth, so that the interface feels polished and consistent with the EcoPoints brand.

#### Acceptance Criteria

1. THE `AmbientBackground` element SHALL be positioned fixed behind all page content with `z-index: 0`, cover the full viewport via `inset: 0`, clip any overflow, and never receive or block pointer events.
2. THE `AmbientBackground` SHALL include `aria-hidden="true"` so assistive technologies do not announce the decorative layer.
3. THE `AmbientBackground` SHALL render exactly 4 Blob Orb elements, each positioned at a distinct corner or region of the viewport (top-left, bottom-right, middle-right, bottom-left), using EcoPoints brand colors (Emerald, Teal, and Forest Green variants).
4. THE `AmbientBackground` SHALL apply a blur between 100 px and 150 px and an opacity between 5% and 10% to each Blob Orb so that the orbs are visible but clearly subordinate to foreground content.
5. THE `AmbientBackground` SHALL animate each Blob Orb with a slow, continuous CSS keyframe animation using `mix-blend-multiply`, with each animation cycle lasting between 18 and 26 seconds, creating a subtle organic motion.
6. THE `AmbientBackground` SHALL render a full-viewport SVG grid/cube repeating texture at an opacity no greater than 5% to provide a faint textural overlay without competing with foreground content.
7. THE `AmbientBackground` SHALL use a near-white base background color consistent with the EcoPoints light-mode surface palette.

---

### Requirement 4: Layout and Placement

**User Story:** As a user, I want the summary cards to appear at the top of my profile content area above the activity heatmap, so that I see my key stats first when the page loads.

#### Acceptance Criteria

1. THE `SummaryCardsRow` SHALL be rendered as the first visible content element inside the main content column of the `ProfileSection` root grid.
2. THE `SummaryCardsRow` SHALL appear above `ProfileHeatmap` in document order so that summary cards are visually presented before the activity heatmap on every render.
3. THE `ProfileHeatmap` and `RecentActivity` components SHALL retain their existing positions immediately after `SummaryCardsRow` in the same layout column and SHALL NOT be removed, reordered relative to each other, or re-parented.
4. THE `SummaryCardsRow` SHALL contain both `CurrentBalanceCard` and `RewardsRedeemedCard` within a single, horizontally-responsive grid container that is governed by the `sm` breakpoint.
5. THE `CurrentBalanceCard` SHALL appear to the left of `RewardsRedeemedCard` when both cards are displayed side by side (viewport ≥ `sm`).
6. THE `AmbientBackground` layer SHALL remain visually behind all card content at all times; no Blob Orb or texture element SHALL overlap or obscure any interactive element in `SummaryCardsRow`.

---

### Requirement 5: Responsive Behavior

**User Story:** As a user on a mobile device, I want the summary cards to stack vertically so that each card is fully readable without horizontal scrolling.

#### Acceptance Criteria

1. WHILE the viewport width is below the `sm` breakpoint (640px), THE `SummaryCardsRow` SHALL display `CurrentBalanceCard` and `RewardsRedeemedCard` in a single-column layout, each occupying 100% of the container width.
2. WHILE the viewport width is at or above the `sm` breakpoint (640px), THE `SummaryCardsRow` SHALL display both cards side by side in a two-column layout at equal width.
3. WHILE the viewport width is at or above the `lg` breakpoint (1024px), THE `SummaryCardsRow` SHALL maintain the two-column layout without reverting to single-column.
4. THE `CurrentBalanceCard` SHALL clip any absolutely-positioned decorative child elements to the card's own boundary so they do not overflow or overlap adjacent content.
5. THE `RewardsRedeemedCard` SHALL clip any absolutely-positioned decorative child elements to the card's own boundary so they do not overflow or overlap adjacent content.

---

### Requirement 6: Data Handling and Null/Empty States

**User Story:** As a user whose redemption history has not yet loaded or whose points data is temporarily unavailable, I want the cards to display gracefully without errors, so that the page remains usable during partial data states.

#### Acceptance Criteria

1. WHEN the redemptions fetch fails, THE `ProfileSection` SHALL preserve `allRedemptions` as an empty array so that `RewardsRedeemedCard` displays `0 Items` and `0 EP`; no error message or error boundary SHALL be rendered within the card.
2. WHILE `allRedemptions` is an empty array before the first successful fetch, THE `RewardsRedeemedCard` SHALL display `0` as the item count and `0 EP` as the points-spent value; the rendered values SHALL NOT be blank, "undefined", or "NaN".
3. IF `currentUser.points` is absent or not a number at render time, THEN THE `CurrentBalanceCard` SHALL display `0` as the balance; the rendered value SHALL NOT be blank, "undefined", or "NaN".
4. IF `currentUser.lifetimePoints` is absent or not a number at render time, THEN THE `CurrentBalanceCard` SHALL display `0` in the Total Accumulated footer; the rendered value SHALL NOT be blank, "undefined", or "NaN".
5. IF a `Redemption` object in `allRedemptions` is missing its point cost field, THEN its contribution to the points-spent total SHALL be treated as `0`, and the aggregate sum SHALL remain unaffected for all other valid records.
6. THE `CurrentBalanceCard` and `RewardsRedeemedCard` SHALL remain fully renderable using only data already available in component scope (`currentUser` and `allRedemptions`) without requiring new side effects or memoised computations to handle null or missing values.
