# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Profile Page ReferenceError
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that navigating to /profile throws ReferenceError "Cannot access 'so' before initialization" (from Bug Condition in design)
  - Test that service worker returns Workbox no-response error for /profile requests
  - Test that circular dependencies exist in module graph: profile page → AuthContext → api barrel → auth module
  - The test assertions should match the Expected Behavior Properties from design: page loads successfully without ReferenceError
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Navigation to /profile causes ReferenceError in bundled JS", "Service worker no-response error observed")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Other Pages Load Successfully
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (routes other than /profile)
  - Observe: Navigate to / on unfixed code and verify it loads successfully
  - Observe: Navigate to /leaderboard on unfixed code and verify it loads successfully
  - Observe: Navigate to /login on unfixed code and verify authentication flow works
  - Observe: Navigate to /admin routes on unfixed code and verify admin pages load correctly
  - Observe: Service worker handles static assets with appropriate caching strategies
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees (e.g., test all non-profile routes)
  - Test that for all routes NOT equal to /profile, the page loads successfully
  - Test that static assets (images, CSS, JS) use correct caching strategies
  - Test that authentication checks work correctly for protected routes
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for profile page loading ReferenceError and circular dependencies

  - [x] 3.1 Eliminate circular dependencies in API barrel file
    - Replace barrel file imports in AuthContext with direct module imports
    - Change `import { auth as authApi, locations as locationsApi } from '../services/api'` in `client/src/context/AuthContext.js`
    - To `import * as authApi from '../services/api/auth'` and `import * as locationsApi from '../services/api/locations'`
    - Review all other files importing from `client/src/services/api/index.js` and replace with direct imports
    - Verify no module in the profile page import chain re-imports from a parent through the barrel
    - _Bug_Condition: isBugCondition(input) where input.url.pathname == '/profile' AND hasCircularDependency(input.moduleGraph)_
    - _Expected_Behavior: Page loads successfully without ReferenceError or TDZ violations_
    - _Preservation: Other pages continue to load successfully (Requirements 3.1-3.5)_
    - _Requirements: 1.1, 1.4, 2.1, 2.4, 3.1, 3.4_

  - [x] 3.2 Add "use client" directive to ProfileSection
    - Add `"use client";` as the first line of `client/src/components/pages/ProfileSection.jsx` (before all imports)
    - Verify all components imported by profile page that use React hooks have correct "use client" directives
    - Check ProfileHeader, ProfileSection, and any nested components for proper client/server component designation
    - _Bug_Condition: hasMissingClientDirective(input.components)_
    - _Expected_Behavior: Client components render correctly client-side without initialization errors_
    - _Preservation: Server-side components without hooks continue to render server-side (Requirement 3.3)_
    - _Requirements: 1.1, 1.5, 2.1, 2.5, 3.3_

  - [x] 3.3 Configure service worker NetworkFirst strategy for /profile
    - Modify `client/next.config.js` workboxOptions to include runtimeCaching configuration
    - Add NetworkFirst handler for /profile route:
      ```javascript
      workboxOptions: {
        disableDevLogs: true,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^\/profile$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'profile-page',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      }
      ```
    - _Bug_Condition: serviceWorkerCacheStrategyIncorrect(input.url)_
    - _Expected_Behavior: Service worker fetches /profile from network first, returns valid response_
    - _Preservation: Static assets continue to use appropriate caching strategies (Requirement 3.2)_
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.2_

  - [ ] 3.4 Rebuild application and verify bundle
    - Run production build: `npm run build` in client directory
    - Enable source maps if not already enabled to verify ReferenceError is resolved
    - Inspect bundled output for circular dependency warnings
    - Verify service worker configuration is correctly generated
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Profile Page Loads Successfully
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify navigation to /profile loads successfully without ReferenceError
    - Verify service worker returns valid response with NetworkFirst strategy
    - Verify no circular dependencies detected in module graph
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Other Pages Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify all non-profile routes still load successfully
    - Verify static assets use correct caching strategies
    - Verify authentication checks work correctly
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run full test suite including exploration, preservation, unit, and integration tests
  - Verify profile page loads successfully in production environment
  - Test navigation from all entry points (direct URL, link clicks, browser back/forward)
  - Verify all profile functionality works: viewing data, editing profile, QR code, redemption history
  - Verify other pages (/, /leaderboard, /login, /qr, /admin, /rewards) continue to work correctly
  - If any tests fail or questions arise, ask the user for guidance
