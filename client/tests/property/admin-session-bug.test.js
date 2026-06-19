/**
 * Property 1: Bug Condition — Admin denied and force-logged-out on protected
 * user route.
 *
 * Bugfix spec: admin-session-separation (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on UNFIXED code. A failing run proves
 * the bug exists: admin-role accounts render protected user content because
 * `RequireAuth` only checks `!currentUser` and performs no role inspection.
 *
 * The SAME test encodes the expected post-fix behavior (Task 3.2): once the
 * role-based denial branch is added, all assertions pass.
 *
 * Scoped PBT slice (the concrete `isBugCondition` slice from design):
 *   role ∈ ADMIN_ROLES = { superadmin, head_admin, auditor, technician, inventory_officer }
 *   isInitialized = true, currentUser ≠ null
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5
 *
 * Run via:  npx vitest run tests/property/admin-session-bug.test.js
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
        logout: null, // replaced per-test with vi.fn()
    },
    replaceCalls: [],
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: (path) => { mocks.replaceCalls.push(path); },
        push: () => {},
        back: () => {},
        forward: () => {},
        refresh: () => {},
        prefetch: () => {},
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: mocks.auth.currentUser,
        isInitialized: mocks.auth.isInitialized,
        logout: mocks.auth.logout,
    }),
    ADMIN_ROLES: new Set([
        'superadmin', 'head_admin', 'auditor', 'technician', 'inventory_officer',
    ]),
}));

// Component under test — imported AFTER vi.mock declarations.
import RequireAuth from '../../src/components/auth/RequireAuth.jsx';

// ── Constants ──────────────────────────────────────────────────────────────
const ADMIN_ROLES = [
    'superadmin', 'head_admin', 'auditor', 'technician', 'inventory_officer',
];

function resetState() {
    cleanup();
    mocks.replaceCalls.length = 0;
    mocks.auth.currentUser = null;
    mocks.auth.isInitialized = true;
    mocks.auth.logout = vi.fn().mockResolvedValue(undefined);
}

/**
 * Render RequireAuth wrapping a protected child with the given admin role.
 * Returns observable behavior snapshot.
 */
function renderWithAdminRole(role) {
    mocks.auth.currentUser = {
        id: `admin-${role}`,
        email: `${role}@ecopoints.local`,
        role,
        permissions: {},
    };
    mocks.auth.isInitialized = true;

    const { queryByTestId } = render(
        React.createElement(
            RequireAuth,
            null,
            React.createElement('div', { 'data-testid': 'protected' }, 'SECRET'),
        ),
    );

    return {
        protectedVisible: queryByTestId('protected') !== null,
        logoutCalled: mocks.auth.logout.mock.calls.length > 0,
        redirectedToLogin: mocks.replaceCalls.includes('/?login=true'),
    };
}

// ── The property ───────────────────────────────────────────────────────────
describe('Property 1: Bug Condition — Admin denied on protected user route', () => {
    beforeEach(resetState);

    test('every ADMIN_ROLES member is denied, force-logged-out, and redirected to /?login=true', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...ADMIN_ROLES),
                (role) => {
                    resetState();
                    const result = renderWithAdminRole(role);

                    // Protected content MUST NOT render.
                    expect(
                        result.protectedVisible,
                        `role=${role}: protected content leaked through RequireAuth`,
                    ).toBe(false);

                    // logout() MUST be called to invalidate the server session.
                    expect(
                        result.logoutCalled,
                        `role=${role}: logout() was never called — server session persists`,
                    ).toBe(true);

                    // router.replace('/?login=true') MUST fire.
                    expect(
                        result.redirectedToLogin,
                        `role=${role}: expected router.replace('/?login=true'), ` +
                        `but replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
                    ).toBe(true);

                    return true;
                },
            ),
            {
                numRuns: 20,
                examples: ADMIN_ROLES.map((r) => [r]),
            },
        );
    });
});
