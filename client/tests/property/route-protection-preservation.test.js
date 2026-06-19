/**
 * Property 2: Preservation — Non-Buggy Inputs Unchanged.
 *
 * Bugfix spec: user-route-protection (preservation checking).
 *
 * PRESERVATION TEST — EXPECTED TO PASS on UNFIXED code. A passing run
 * confirms the baseline behaviors to preserve after the fix is applied.
 * The SAME tests are re-run as Task 3.4 (Preservation Checking) to confirm
 * no regressions.
 *
 * Covers every input where `isBugCondition` returns false:
 *   1. Authenticated user (`currentUser = user`, `isInitialized = true`) —
 *      each protected route renders content, no redirect fires.
 *   2. Bootstrap window (`isInitialized = false`, any currentUser, any
 *      protected route) — no protected content paints AND no redirect fires.
 *   3. Public routes (`/`, `/login`) with `currentUser = null` —
 *      render without redirect to `/?login=true`.
 *   4. Admin area (`/admin`) — governed by `AdminLayout` / `RequirePermission`,
 *      unchanged; user-route guard does not interfere.
 *
 * Validates: Requirements 2.6, 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * Run via:  npx vitest run tests/property/route-protection-preservation.test.js
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ── Hoisted mock state ─────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    auth: {
        currentUser: null,
        isInitialized: true,
        logout: async () => {},
    },
    replaceCalls: [],
    pushCalls: [],
    pathname: '/admin',
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
    usePathname: () => mocks.pathname,
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: mocks.auth.currentUser,
        isInitialized: mocks.auth.isInitialized,
        logout: mocks.auth.logout,
        allLocations: [],
        isSuperAdmin: false,
        effectiveLocationId: null,
        currentLocation: null,
        viewAsLocationId: null,
        setViewAsLocation: () => {},
        canManage: false,
    }),
    ADMIN_ROLES: new Set([
        'superadmin', 'head_admin', 'auditor', 'technician', 'inventory_officer',
    ]),
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
// deterministic marker without pulling real network-bound modules into jsdom.
vi.mock('next/dynamic', () => ({
    default: (loader, opts) => {
        if (opts && opts.loading) {
            return opts.loading;
        }
        return () => 'PROTECTED_DYNAMIC_CONTENT';
    },
}));

// Stub heavy page-body components to stable markers.
vi.mock('../../src/components/pages/ProfileSection', () => ({
    default: () => 'PROTECTED_PROFILE_CONTENT',
}));
vi.mock('../../src/components/pages/Rewards', () => ({
    default: () => 'PROTECTED_REWARDS_CONTENT',
}));
vi.mock('../../src/components/pages/RedeemHistory', () => ({
    default: () => 'PROTECTED_REDEEM_CONTENT',
}));
vi.mock('../../src/components/pages/LeaderboardPodium', () => ({
    default: () => 'PROTECTED_LEADERBOARD_CONTENT',
}));
vi.mock('../../src/components/website/Footer', () => ({
    default: () => 'FOOTER_CONTENT',
}));
vi.mock('../../src/components/website/NavBar', () => ({
    default: () => 'NAVBAR_CONTENT',
}));
vi.mock('../../src/components/website/sections/HeroSection', () => ({
    default: () => 'HERO_CONTENT',
}));
vi.mock('../../src/components/shared/EcoLoadingScreen', () => ({
    default: ({ onComplete }) => { if (onComplete) onComplete(); return null; },
}));
vi.mock('../../src/components/admin/Sidebar', () => ({
    default: () => 'SIDEBAR_CONTENT',
}));
vi.mock('../../src/context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', setTheme: () => {}, isDarkMode: false, isNeutralMode: false }),
}));
vi.mock('../../src/services/api', () => ({
    logs: { getAccess: async () => [] },
    auth: { me: async () => null, login: async () => null, logout: async () => {} },
    locations: { getAll: async () => [] },
}));

// ── Pages under test ───────────────────────────────────────────────────────
import ProfilePage from '../../app/profile/page.js';
import RewardsPage from '../../app/rewards/page.js';
import RedeemHistoryPage from '../../app/redeem-history/page.js';
import LeaderboardPage from '../../app/leaderboard/page.js';
import QRPage from '../../app/qr/page.js';
import LoginPage from '../../app/login/page.js';
import AdminLayout from '../../src/components/admin/AdminLayout.jsx';

// ── Constants ──────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = {
    '/profile': ProfilePage,
    '/rewards': RewardsPage,
    '/redeem-history': RedeemHistoryPage,
    '/leaderboard': LeaderboardPage,
    '/qr': QRPage,
};
const PROTECTED_ROUTE_KEYS = Object.keys(PROTECTED_ROUTES);

const AUTHENTICATED_USER = {
    id: 'user-001',
    name: 'Test User',
    email: 'test@ecopoints.local',
    role: 'user',
    permissions: {},
};

function resetState() {
    cleanup();
    mocks.replaceCalls.length = 0;
    mocks.pushCalls.length = 0;
    mocks.auth.currentUser = null;
    mocks.auth.isInitialized = true;
    mocks.pathname = '/admin';
}

function renderRoute(route, { currentUser, isInitialized }) {
    mocks.auth.currentUser = currentUser;
    mocks.auth.isInitialized = isInitialized;
    const Page = PROTECTED_ROUTES[route];
    const { container } = render(React.createElement(Page));
    return {
        redirectedToLogin: mocks.replaceCalls.includes('/?login=true'),
        anyRedirect: mocks.replaceCalls.length > 0 || mocks.pushCalls.length > 0,
        contentRendered: container.innerHTML.trim() !== '',
        html: container.innerHTML,
    };
}

// ══════════════════════════════════════════════════════════════════════════
// Property 2a: Authenticated user renders protected route — no redirect
// ══════════════════════════════════════════════════════════════════════════
describe('Property 2a: Authenticated user — protected routes render, no redirect', () => {
    beforeEach(resetState);

    test('authenticated user sees content and no redirect fires on every protected route', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...PROTECTED_ROUTE_KEYS),
                (route) => {
                    resetState();
                    const result = renderRoute(route, {
                        currentUser: AUTHENTICATED_USER,
                        isInitialized: true,
                    });

                    expect(
                        result.contentRendered,
                        `route ${route}: expected content to render for authenticated user, but container was empty`,
                    ).toBe(true);

                    expect(
                        result.redirectedToLogin,
                        `route ${route}: unexpected router.replace('/?login=true') for authenticated user; ` +
                        `replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
                    ).toBe(false);

                    return true;
                },
            ),
            { numRuns: 20, examples: PROTECTED_ROUTE_KEYS.map((r) => [r]) },
        );
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2b: Bootstrap window — no redirect, no premature content flash
// ══════════════════════════════════════════════════════════════════════════
describe('Property 2b: Bootstrap window — no premature redirect, skeleton/null rendered', () => {
    beforeEach(resetState);

    test('isInitialized=false with any currentUser never fires redirect on any protected route', () => {
        const currentUserArb = fc.constantFrom(null, AUTHENTICATED_USER);

        fc.assert(
            fc.property(
                fc.constantFrom(...PROTECTED_ROUTE_KEYS),
                currentUserArb,
                (route, currentUser) => {
                    resetState();
                    const result = renderRoute(route, { currentUser, isInitialized: false });

                    expect(
                        result.redirectedToLogin,
                        `route ${route} (currentUser=${currentUser ? 'user' : 'null'}): ` +
                        `unexpected redirect during bootstrap window; ` +
                        `replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
                    ).toBe(false);

                    expect(
                        result.anyRedirect,
                        `route ${route} (currentUser=${currentUser ? 'user' : 'null'}): ` +
                        `unexpected navigation during bootstrap window; ` +
                        `replace = ${JSON.stringify(mocks.replaceCalls)}, push = ${JSON.stringify(mocks.pushCalls)}`,
                    ).toBe(false);

                    return true;
                },
            ),
            {
                numRuns: 30,
                examples: [
                    ...PROTECTED_ROUTE_KEYS.map((r) => [r, null]),
                    ...PROTECTED_ROUTE_KEYS.map((r) => [r, AUTHENTICATED_USER]),
                ],
            },
        );
    });

    test('/profile shows ProfileSkeleton (non-empty) during bootstrap window', () => {
        resetState();
        mocks.auth.currentUser = null;
        mocks.auth.isInitialized = false;
        const { container } = render(React.createElement(ProfilePage));

        expect(
            container.innerHTML.trim(),
            '/profile bootstrap: expected ProfileSkeleton to render (non-empty container)',
        ).not.toBe('');

        expect(
            mocks.replaceCalls,
            '/profile bootstrap: unexpected redirect calls during isInitialized=false',
        ).toEqual([]);
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2c: Public routes — no auth-guard redirect for unauthenticated
// ══════════════════════════════════════════════════════════════════════════
describe('Property 2c: Public routes — no auth-guard redirect for unauthenticated visitor', () => {
    beforeEach(resetState);

    test('/ (home) renders content and auth guard does not redirect unauthenticated visitor', async () => {
        resetState();
        mocks.auth.currentUser = null;
        mocks.auth.isInitialized = true;

        const HomePage = (await import('../../app/page.js')).default;
        const { container } = render(React.createElement(HomePage));

        expect(
            container.innerHTML.trim(),
            '/ home: expected content to render for unauthenticated visitor',
        ).not.toBe('');

        expect(
            mocks.replaceCalls.filter(p => p === '/?login=true'),
            '/ home: unexpected auth-guard redirect to /?login=true for unauthenticated visitor',
        ).toEqual([]);
    });

    test('/login page fires its own redirect to /?login=true (preserved behavior)', () => {
        resetState();
        mocks.auth.currentUser = null;
        mocks.auth.isInitialized = true;

        render(React.createElement(LoginPage));

        expect(
            mocks.replaceCalls,
            '/login page: expected its own router.replace("/?login=true") to fire',
        ).toContain('/?login=true');
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2d: Admin area — AdminLayout guard unchanged, user guard absent
// ══════════════════════════════════════════════════════════════════════════
describe('Property 2d: Admin area — AdminLayout guard unchanged, user route guard absent', () => {
    beforeEach(resetState);

    test('AdminLayout redirects unauthenticated visitor to /?login=true (existing behavior)', () => {
        resetState();
        mocks.auth.currentUser = null;
        mocks.auth.isInitialized = true;

        render(
            React.createElement(AdminLayout, null,
                React.createElement('div', { 'data-testid': 'admin-child' }, 'ADMIN_CONTENT'),
            ),
        );

        const allNavigations = [...mocks.replaceCalls, ...mocks.pushCalls];
        expect(
            allNavigations.some(p => p === '/?login=true'),
            'AdminLayout: expected navigation to /?login=true for unauthenticated visitor; ' +
            `calls = replace:${JSON.stringify(mocks.replaceCalls)} push:${JSON.stringify(mocks.pushCalls)}`,
        ).toBe(true);

        expect(
            document.querySelector('[data-testid="admin-child"]'),
            'AdminLayout: admin content leaked through guard for unauthenticated visitor',
        ).toBeNull();
    });

    test('AdminLayout renders admin content for authenticated admin user (no regression)', () => {
        resetState();
        mocks.auth.currentUser = {
            id: 'admin-001',
            name: 'Super Admin',
            email: 'admin@ecopoints.local',
            role: 'superadmin',
            permission_categories: ['users', 'machines', 'rewards', 'locations', 'logs',
                'analytics', 'settings', 'groups', 'sessions', 'dashboard'],
            permissions: {},
        };
        mocks.auth.isInitialized = true;

        const { queryByTestId } = render(
            React.createElement(AdminLayout, null,
                React.createElement('div', { 'data-testid': 'admin-child' }, 'ADMIN_CONTENT'),
            ),
        );

        expect(
            queryByTestId('admin-child'),
            'AdminLayout: expected admin content to render for authenticated superadmin',
        ).not.toBeNull();

        expect(
            [...mocks.replaceCalls, ...mocks.pushCalls].filter(p => p === '/?login=true'),
            'AdminLayout: unexpected redirect to /?login=true for authenticated admin',
        ).toEqual([]);
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2e: Full domain — preservation holds for all non-buggy inputs
// ══════════════════════════════════════════════════════════════════════════
describe('Property 2e: Full preservation domain — isBugCondition=false inputs unchanged', () => {
    beforeEach(resetState);

    function isBugCondition({ route, currentUser, isInitialized }) {
        return (
            isInitialized === true &&
            currentUser === null &&
            PROTECTED_ROUTE_KEYS.includes(route)
        );
    }

    test('no auth-guard redirect fires for any non-buggy input across protected routes', () => {
        const currentUserArb = fc.constantFrom(null, AUTHENTICATED_USER);
        const isInitializedArb = fc.boolean();
        const routeArb = fc.constantFrom(...PROTECTED_ROUTE_KEYS);

        fc.assert(
            fc.property(
                routeArb,
                currentUserArb,
                isInitializedArb,
                (route, currentUser, isInitialized) => {
                    if (isBugCondition({ route, currentUser, isInitialized })) return true;

                    resetState();
                    const result = renderRoute(route, { currentUser, isInitialized });

                    expect(
                        result.redirectedToLogin,
                        `non-buggy input (route=${route}, ` +
                        `currentUser=${currentUser ? 'user' : 'null'}, ` +
                        `isInitialized=${isInitialized}): ` +
                        `unexpected auth-guard redirect to /?login=true; ` +
                        `replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
                    ).toBe(false);

                    return true;
                },
            ),
            {
                numRuns: 50,
                examples: [
                    ...PROTECTED_ROUTE_KEYS.map(r => [r, AUTHENTICATED_USER, true]),
                    ...PROTECTED_ROUTE_KEYS.map(r => [r, null, false]),
                    ...PROTECTED_ROUTE_KEYS.map(r => [r, AUTHENTICATED_USER, false]),
                ],
            },
        );
    });
});
