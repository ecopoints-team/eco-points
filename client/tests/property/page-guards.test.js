/**
 * Property H — Admin_UI page guard completeness.
 *
 *   For every (page P, role X) quartet, the `RequirePermission` guard SHALL:
 *     - render the protected content iff
 *         X ∈ Admin_Role_Set ∧ category(P) ∈ permission_categories(X);
 *     - otherwise call `router.replace` with `/rewards` when X ∈ {user,
 *       dependent}, else with `/admin`, and SHALL NOT render the protected
 *       content.
 *
 * Validates: Requirements 2.3, 2.4, 2.5, 2.11
 *
 * Mocks `next/navigation` to capture `router.replace` invocations and mocks
 * `useAuth` from `AuthContext` to inject test users without any real auth
 * bootstrap. The `ROLE_PERMISSIONS` map is mirrored client-side from
 * `server/app/middleware.py` (Phase 2 task 6.1) — keeping it as a literal
 * fixture in this file is intentional so the test fails loudly if either
 * surface drifts away from the audited Admin_Role_Set.
 *
 * Run via:  `npm test -- tests/property/page-guards.test.js`
 */
import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ── Mock fixtures ────────────────────────────────────────────────────────
//
// `vi.mock` factories are hoisted above `import` statements, so any state
// they close over must be declared via `vi.hoisted` to live in the same
// hoisted scope. We expose plain mutable holders rather than `vi.fn()` so
// the mock factories don't need to import vitest.
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    state: {
        currentUser: null,
        isInitialized: true,
    },
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
    usePathname: () => '/admin',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: mocks.state.currentUser,
        isInitialized: mocks.state.isInitialized,
    }),
}));

// Component under test — imported AFTER `vi.mock` declarations so the mocks
// resolve before the real `AuthContext` module is loaded transitively.
import RequirePermission from '../../src/components/admin/RequirePermission.jsx';

// ── Authoritative ROLE_PERMISSIONS (mirrored from middleware.py) ─────────
const ADMIN_ROLE_SET = new Set([
    'superadmin',
    'head_admin',
    'auditor',
    'technician',
    'inventory_officer',
]);

const ROLE_PERMISSIONS = {
    superadmin: new Set([
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    ]),
    head_admin: new Set([
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    ]),
    auditor: new Set([
        'logs', 'analytics', 'sessions', 'settings',
        'leaderboard', 'dashboard',
    ]),
    technician: new Set([
        'machines', 'logs', 'settings', 'dashboard',
    ]),
    inventory_officer: new Set([
        'rewards', 'logs', 'settings', 'dashboard',
    ]),
};

const NON_ADMIN_ROLES = ['user', 'dependent'];
const ALL_ROLES = [...ADMIN_ROLE_SET, ...NON_ADMIN_ROLES];

// ── Page → category mapping (Phase 2 task 6.5) ───────────────────────────
const PAGES = [
    { page: 'analytics',         category: 'analytics' },
    { page: 'bulk-sessions',     category: 'sessions' },
    { page: 'leaderboards',      category: 'leaderboard' },
    { page: 'locations',         category: 'locations' },
    { page: 'logs/access',       category: 'logs' },
    { page: 'logs/bottles',      category: 'logs' },
    { page: 'logs/machines',     category: 'logs' },
    { page: 'logs/rewards',      category: 'logs' },
    { page: 'logs/transactions', category: 'logs' },
    { page: 'machines',          category: 'machines' },
    { page: 'rewards',           category: 'rewards' },
    { page: 'settings',          category: 'settings' },
    { page: 'users',             category: 'users' },
    { page: 'users/permissions', category: 'users' },
    { page: 'profile',           category: 'dashboard' },
];

// All (page, role) pairs — fed to fast-check as `examples` so the property
// is exercised on every quartet at least once before random sampling kicks
// in. Without this, 50 random runs cannot cover 15 × 7 = 105 combinations.
const ALL_PAIRS = [];
for (const page of PAGES) {
    for (const role of ALL_ROLES) {
        ALL_PAIRS.push([page, role]);
    }
}

/** Permission categories derived from `role`. Non-admin roles get []. */
function permissionCategories(role) {
    const set = ROLE_PERMISSIONS[role];
    return set ? [...set].sort() : [];
}

/** Reset shared mock state and unmount any prior render. */
function resetState() {
    cleanup();
    mocks.replaceCalls.length = 0;
    mocks.pushCalls.length = 0;
    mocks.state.currentUser = null;
    mocks.state.isInitialized = true;
}

/**
 * Render the guard for a given role + category and return a snapshot of the
 * observable behavior: whether the protected content was painted to the DOM
 * and which paths `router.replace` was invoked with.
 */
function renderGuard({ role, category }) {
    mocks.state.isInitialized = true;
    mocks.state.currentUser = {
        id: 1,
        email: `${role}@ecopoints.local`,
        role,
        permission_categories: permissionCategories(role),
    };

    const { container, queryByTestId } = render(
        React.createElement(
            RequirePermission,
            { category },
            React.createElement('div', { 'data-testid': 'protected' }, 'SECRET'),
        ),
    );

    return {
        rendered: queryByTestId('protected') !== null,
        replaceCalls: [...mocks.replaceCalls],
        html: container.innerHTML,
    };
}

/**
 * Compute the expected outcome for a (page, role) pair from the spec rules.
 * Returned as `{ rendered: bool, replaceTarget: string|null }`.
 */
function expectedOutcome(role, category) {
    if (NON_ADMIN_ROLES.includes(role)) {
        return { rendered: false, replaceTarget: '/rewards' };
    }
    if (ADMIN_ROLE_SET.has(role) && ROLE_PERMISSIONS[role].has(category)) {
        return { rendered: true, replaceTarget: null };
    }
    // Admin role lacking the required category.
    return { rendered: false, replaceTarget: '/admin' };
}

// ── The property ────────────────────────────────────────────────────────
describe('Property H — Admin_UI page guard completeness', () => {
    beforeEach(() => {
        resetState();
    });

    test('protected content renders iff role is admin and has the required category', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...PAGES),
                fc.constantFrom(...ALL_ROLES),
                (pageDef, role) => {
                    resetState();
                    const expected = expectedOutcome(role, pageDef.category);
                    const observed = renderGuard({ role, category: pageDef.category });

                    // ── Render assertion ────────────────────────────────
                    if (expected.rendered) {
                        if (!observed.rendered) {
                            throw new Error(
                                `expected protected content to render for ` +
                                `role=${role} page=${pageDef.page} category=${pageDef.category}, ` +
                                `but it was absent (html=${observed.html})`,
                            );
                        }
                    } else if (observed.rendered) {
                        throw new Error(
                            `protected content leaked through guard for ` +
                            `role=${role} page=${pageDef.page} category=${pageDef.category}`,
                        );
                    }

                    // ── Redirect assertion ──────────────────────────────
                    if (expected.replaceTarget === null) {
                        if (observed.replaceCalls.length !== 0) {
                            throw new Error(
                                `expected no router.replace for permitted ` +
                                `role=${role} page=${pageDef.page}, but got ` +
                                `${JSON.stringify(observed.replaceCalls)}`,
                            );
                        }
                    } else {
                        if (observed.replaceCalls.length !== 1) {
                            throw new Error(
                                `expected exactly one router.replace for ` +
                                `role=${role} page=${pageDef.page} category=${pageDef.category}, ` +
                                `but got ${JSON.stringify(observed.replaceCalls)}`,
                            );
                        }
                        if (observed.replaceCalls[0] !== expected.replaceTarget) {
                            throw new Error(
                                `expected router.replace(${expected.replaceTarget}) for ` +
                                `role=${role} page=${pageDef.page} category=${pageDef.category}, ` +
                                `but got router.replace(${observed.replaceCalls[0]})`,
                            );
                        }
                    }

                    return true;
                },
            ),
            {
                numRuns: 50,
                examples: ALL_PAIRS,
            },
        );
    });
});
