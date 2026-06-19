/**
 * Property 1: Bug Condition — Unauthenticated Visitor Renders Protected Route.
 *
 * Bugfix spec: user-route-protection (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on UNFIXED code. A failing run is the
 * SUCCESS case here: it proves the missing-guard bug exists, because the
 * protected page shells paint and `router.replace('/?login=true')` is never
 * fired for a fully-initialized, unauthenticated visitor. The SAME test
 * encodes the expected post-fix behavior and validates the fix (Task 3.3)
 * once `RequireAuth` wraps every protected route.
 *
 * Scoped PBT slice (the concrete `isBugCondition` slice from design):
 *   route ∈ { /profile, /rewards, /redeem-history, /leaderboard, /qr }
 *   currentUser = null, isInitialized = true   (fixed)
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
 *
 * Run via:  npx vitest run tests/property/route-protection-bug.test.js
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ── Hoisted mock state ─────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    replaceCalls: [],
    pushCalls: [],
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: (path) => { mocks.replaceCalls.push(path); },
        push: (path) => { mocks.pushCalls.push(path); },
        back: () => {},
        forward: () => {},
        refresh: () => {},
        prefetch: () => {},
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Bug-condition slice: fully initialized, no authenticated user.
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({ currentUser: null, isInitialized: true }),
}));

// UIContext stub — RequireAuth no longer uses it, but other page components may.
vi.mock('../../src/context/UIContext', () => ({
    useUI: () => ({
        openLoginModal: () => {},
        isLoginOpen: false,
        closeLoginModal: () => {},
    }),
}));

// Synchronous stub for next/dynamic — returns a component that paints a
// marker string.
vi.mock('next/dynamic', () => ({
    default: () => () => 'PROTECTED_DYNAMIC_CONTENT',
}));

// Heavy, network-bound page bodies stubbed to marker strings.
vi.mock('../../src/components/pages/ProfileSection', () => ({
    default: () => 'PROTECTED_PROFILE_CONTENT',
}));
vi.mock('../../src/components/website/Footer', () => ({
    default: () => 'FOOTER_CONTENT',
}));

// Pages under test — imported AFTER the vi.mock declarations.
import ProfilePage from '../../app/profile/page.js';
import RewardsPage from '../../app/rewards/page.js';
import RedeemHistoryPage from '../../app/redeem-history/page.js';
import LeaderboardPage from '../../app/leaderboard/page.js';
import QRPage from '../../app/qr/page.js';

const QR_SECRET = 'MAINTENANCE:SECRET-KEY-999';

const ROUTES = {
    '/profile': ProfilePage,
    '/rewards': RewardsPage,
    '/redeem-history': RedeemHistoryPage,
    '/leaderboard': LeaderboardPage,
    '/qr': QRPage,
};
const ROUTE_KEYS = Object.keys(ROUTES);

function resetState() {
    cleanup();
    mocks.replaceCalls.length = 0;
    mocks.pushCalls.length = 0;
}

function renderRoute(route) {
    const Page = ROUTES[route];
    const { container } = render(React.createElement(Page));
    return {
        redirectedToLogin: mocks.replaceCalls.includes('/?login=true'),
        protectedContentRendered: container.innerHTML.trim() !== '',
        html: container.innerHTML,
    };
}

describe('Property 1: Bug Condition — unauthenticated visitor on a protected route', () => {
    beforeEach(resetState);

    test('every protected route redirects to /?login=true and paints no protected content', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ROUTE_KEYS), (route) => {
                resetState();
                const result = renderRoute(route);

                expect(
                    result.redirectedToLogin,
                    `route ${route}: expected router.replace('/?login=true'), ` +
                    `but observed replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
                ).toBe(true);

                expect(
                    result.protectedContentRendered,
                    `route ${route}: protected content leaked before redirect: ` +
                    `${result.html.slice(0, 160)}`,
                ).toBe(false);

                if (route === '/qr') {
                    expect(
                        result.html.includes(QR_SECRET),
                        `route /qr exposed ${QR_SECRET} before redirect`,
                    ).toBe(false);
                }

                return true;
            }),
            { numRuns: 20, examples: ROUTE_KEYS.map((r) => [r]) },
        );
    });
});
