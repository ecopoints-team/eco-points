/**
 * Property 2: Preservation — Non-bug inputs unchanged.
 *
 * Bugfix spec: admin-session-separation (preservation checking).
 *
 * PRESERVATION TEST — EXPECTED TO PASS on UNFIXED code. A passing run
 * confirms the baseline behaviors to preserve after the fix. Re-run as
 * Task 3.3 to confirm no regressions.
 *
 * Covers every input where `isBugCondition` returns false:
 *   1. role ∈ {user, dependent}, isInitialized = true → content renders,
 *      no redirect, no logout.
 *   2. currentUser = null, isInitialized = true → no content,
 *      router.replace('/?login=true'), no logout.
 *   3. isInitialized = false (±user) → no content, no redirect, no logout.
 *
 * Admins inside /admin/* are out of RequireAuth scope (guarded by
 * AdminLayout) — documented as structural guarantee, not tested here.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 *
 * Run via:  npx vitest run tests/property/admin-session-preservation.test.js
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
        logout: null,
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
const NON_ADMIN_ROLES = ['user', 'dependent'];

function makeUser(role) {
    return {
        id: `${role}-001`,
        email: `${role}@ecopoints.local`,
        role,
        permissions: {},
    };
}

function resetState() {
    cleanup();
    mocks.replaceCalls.length = 0;
    mocks.auth.currentUser = null;
    mocks.auth.isInitialized = true;
    mocks.auth.logout = vi.fn().mockResolvedValue(undefined);
}

/**
 * Render RequireAuth wrapping a protected child with given auth state.
 */
function renderGuard({ currentUser, isInitialized }) {
    mocks.auth.currentUser = currentUser;
    mocks.auth.isInitialized = isInitialized;

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
        anyRedirect: mocks.replaceCalls.length > 0,
    };
}

// ══════════════════════════════════════════════════════════════════════════
// Property 2a: Non-admin authenticated user renders content, no redirect
// ══════════════════════════════════════════════════════════════════════════
describe('Preservation 2a: Non-admin authenticated user — renders, no redirect, no logout', () => {
    beforeEach(resetState);

    test('role ∈ {user, dependent} with isInitialized=true renders protected content', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...NON_ADMIN_ROLES),
                (role) => {
                    resetState();
                    const result = renderGuard({
                        currentUser: makeUser(role),
                        isInitialized: true,
                    });

                    expect(
                        result.protectedVisible,
                        `role=${role}: expected protected content to render`,
                    ).toBe(true);

                    expect(
                        result.redirectedToLogin,
                        `role=${role}: unexpected redirect to /?login=true`,
                    ).toBe(false);

                    expect(
                        result.logoutCalled,
                        `role=${role}: logout() should not be called for non-admin user`,
                    ).toBe(false);

                    return true;
                },
            ),
            {
                numRuns: 20,
                examples: NON_ADMIN_ROLES.map((r) => [r]),
            },
        );
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2b: Unauthenticated visitor — redirect, no content, no logout
// ══════════════════════════════════════════════════════════════════════════
describe('Preservation 2b: Unauthenticated visitor — redirect to /?login=true, no content', () => {
    beforeEach(resetState);

    test('currentUser=null, isInitialized=true redirects and renders no content', () => {
        resetState();
        const result = renderGuard({
            currentUser: null,
            isInitialized: true,
        });

        expect(
            result.protectedVisible,
            'unauthenticated: protected content leaked',
        ).toBe(false);

        expect(
            result.redirectedToLogin,
            `unauthenticated: expected router.replace('/?login=true'), ` +
            `but replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
        ).toBe(true);

        expect(
            result.logoutCalled,
            'unauthenticated: logout() should not be called — no session to invalidate',
        ).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2c: Bootstrap window — no content, no redirect, no logout
// ══════════════════════════════════════════════════════════════════════════
describe('Preservation 2c: Bootstrap window — no content, no redirect, no logout', () => {
    beforeEach(resetState);

    test('isInitialized=false with any currentUser does nothing', () => {
        const currentUserArb = fc.constantFrom(
            null,
            makeUser('user'),
            makeUser('dependent'),
        );

        fc.assert(
            fc.property(
                currentUserArb,
                (currentUser) => {
                    resetState();
                    const result = renderGuard({
                        currentUser,
                        isInitialized: false,
                    });

                    expect(
                        result.protectedVisible,
                        `bootstrap (currentUser=${currentUser?.role ?? 'null'}): ` +
                        'protected content should not render during bootstrap',
                    ).toBe(false);

                    expect(
                        result.anyRedirect,
                        `bootstrap (currentUser=${currentUser?.role ?? 'null'}): ` +
                        'no redirect should fire during bootstrap; ' +
                        `replace calls = ${JSON.stringify(mocks.replaceCalls)}`,
                    ).toBe(false);

                    expect(
                        result.logoutCalled,
                        `bootstrap (currentUser=${currentUser?.role ?? 'null'}): ` +
                        'logout() should not be called during bootstrap',
                    ).toBe(false);

                    return true;
                },
            ),
            {
                numRuns: 20,
                examples: [
                    [null],
                    [makeUser('user')],
                    [makeUser('dependent')],
                ],
            },
        );
    });
});

// ══════════════════════════════════════════════════════════════════════════
// Property 2d: Full domain — preservation over role × isInitialized
// ══════════════════════════════════════════════════════════════════════════
describe('Preservation 2d: Full domain — logout never called for non-bug inputs', () => {
    beforeEach(resetState);

    test('logout() is never called for any non-admin-role × isInitialized combination', () => {
        const roleArb = fc.constantFrom(...NON_ADMIN_ROLES);
        const isInitializedArb = fc.boolean();
        const hasUserArb = fc.boolean();

        fc.assert(
            fc.property(
                roleArb,
                isInitializedArb,
                hasUserArb,
                (role, isInitialized, hasUser) => {
                    resetState();
                    const currentUser = hasUser ? makeUser(role) : null;
                    const result = renderGuard({ currentUser, isInitialized });

                    expect(
                        result.logoutCalled,
                        `role=${role}, isInitialized=${isInitialized}, ` +
                        `hasUser=${hasUser}: logout() must never fire for non-bug input`,
                    ).toBe(false);

                    return true;
                },
            ),
            {
                numRuns: 50,
                examples: [
                    ['user', true, true],
                    ['user', true, false],
                    ['user', false, true],
                    ['user', false, false],
                    ['dependent', true, true],
                    ['dependent', true, false],
                    ['dependent', false, true],
                    ['dependent', false, false],
                ],
            },
        );
    });
});
