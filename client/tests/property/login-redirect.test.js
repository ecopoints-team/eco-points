/**
 * Property Y — Login redirect (Phase 5).
 *
 *   For every role R, mounting `LogIn.jsx` with a mocked `auth.login()`
 *   (injected via `useAuth()`) that resolves to `{ user: { role: R } }`
 *   and a mocked router, the Client SHALL navigate to:
 *     - `/admin`   iff R ∈ Admin_Role_Set
 *     - `/rewards` otherwise
 *   AND `router.push` SHALL NEVER be invoked with `/profile` for any role.
 *
 * Validates: Requirements 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13
 *
 * The seven roles are the canonical Phase 5 seed set (Requirement 5.2):
 *   { superadmin, head_admin, auditor, technician, inventory_officer,
 *     user, dependent }
 *
 * The Admin_Role_Set is the five-role admin subset, mirrored from
 * `server/app/middleware.py` and from the literal set declared inside
 * `LogIn.jsx`. Keeping it as a literal fixture in this file is intentional
 * so the test fails loudly if either surface drifts.
 *
 * Mocking strategy:
 *   - `next/navigation`           → spy on `router.push` / `router.replace`
 *   - `AuthContext.useAuth`       → inject a parameterized `login()`
 *   - `services/api` (auth)       → stub `getPublicLocations` / `getPublicGroups`
 *                                   so the sign-up useEffects never reach
 *                                   the network even on a tab toggle
 *   - `react-google-recaptcha`    → defensive stub (component is not
 *                                   rendered on the initial sign-in form)
 *
 * Run via:  `npx vitest run tests/property/login-redirect.test.js`
 */
import { describe, test, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';

// ── Hoisted mock state ────────────────────────────────────────────────────
//
// `vi.mock` factories are hoisted above `import` statements, so any state
// they close over must live in a `vi.hoisted` block to share the same
// hoisted scope. We expose plain mutable holders (rather than `vi.fn()`
// instances) so the mock factories don't need to import vitest.
const mocks = vi.hoisted(() => ({
    pushCalls: [],
    replaceCalls: [],
    // Default impl returns a non-admin role; per-iteration code overwrites
    // this before submitting the form so the redirect branch sees the
    // role under test.
    loginImpl: async () => ({ user: { role: 'user' } }),
}));

// ── Mock next/navigation: capture every router.push call ──────────────────
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: (path) => { mocks.pushCalls.push(path); },
        replace: (path) => { mocks.replaceCalls.push(path); },
        back: () => {},
        forward: () => {},
        refresh: () => {},
        prefetch: () => {},
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// ── Mock AuthContext: inject a parameterized login() ──────────────────────
//
// LogIn.jsx pulls `login` from `useAuth()` and awaits it. The redirect
// branch reads `data?.user?.role`, so all the test needs is a controllable
// resolved value. Bypassing the real AuthContext also avoids touching the
// `services/api` graph, the `/auth/me` bootstrap probe, and the locations
// fetch that AuthContext.login fires after a successful sign-in.
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        login: (...args) => mocks.loginImpl(...args),
        logout: async () => {},
        currentUser: null,
        isInitialized: true,
        isLoading: false,
    }),
}));

// ── Mock services/api: keep the module graph fully synthetic ──────────────
//
// LogIn.jsx imports `auth as authApi` from `'../../services/api'` and
// invokes `authApi.getPublicLocations()` / `authApi.getPublicGroups()`
// inside useEffects gated on `isSignUp` / `locationId`. Those side effects
// do not fire on the sign-in form path, but stubbing them out keeps the
// module evaluation hermetic.
vi.mock('../../src/services/api', () => ({
    auth: {
        login: (...args) => mocks.loginImpl(...args),
        getPublicLocations: async () => [],
        getPublicGroups: async () => [],
        register: async () => ({}),
    },
}));

// ── Mock react-google-recaptcha ───────────────────────────────────────────
//
// The widget is only mounted when the CAPTCHA popup is open (after a
// failed login attempt). The test never reaches that path, but the import
// is evaluated at module load — stubbing it avoids any side effects from
// the real package's module body.
vi.mock('react-google-recaptcha', () => ({
    default: () => null,
}));

// Component under test — imported AFTER vi.mock declarations so the mocks
// resolve before the real modules are loaded transitively.
import LogIn from '../../src/components/pages/LogIn.jsx';

// ── Authoritative role sets (Phase 5 seed set) ────────────────────────────
const ALL_ROLES = [
    'superadmin',
    'head_admin',
    'auditor',
    'technician',
    'inventory_officer',
    'user',
    'dependent',
];

const ADMIN_ROLE_SET = new Set([
    'superadmin',
    'head_admin',
    'auditor',
    'technician',
    'inventory_officer',
]);

/** Reset shared mock state and unmount any prior render. */
function resetState() {
    cleanup();
    mocks.pushCalls.length = 0;
    mocks.replaceCalls.length = 0;
    mocks.loginImpl = async () => ({ user: { role: 'user' } });
}

/**
 * Mount LogIn.jsx, fill the sign-in form, submit it, and resolve once the
 * post-login redirect has been observed (or a hard 2 s timeout fires).
 *
 * Returns a snapshot of `router.push` call arguments observed during the
 * iteration. `router.replace` is captured separately for diagnostic
 * output but is not part of the property under test.
 */
async function attemptLoginAs(role) {
    mocks.loginImpl = async () => ({ user: { role } });

    const { container } = render(React.createElement(LogIn, {}));

    // Locate sign-in form inputs by their stable ids. The sign-up form on
    // the right uses different element shapes (no `id` attributes), so
    // `#login-*` is unambiguous.
    const credInput = container.querySelector('#login-credential');
    const passInput = container.querySelector('#login-password');
    if (!credInput || !passInput) {
        throw new Error(
            'LogIn.jsx sign-in form inputs missing — did the markup change?',
        );
    }

    // Populate the controlled inputs so `handleLogin` has values to pass
    // to `login(...)`. The values themselves are irrelevant — only the
    // mocked resolution shape (`data.user.role`) drives the redirect.
    fireEvent.change(credInput, { target: { value: 'test@example.local' } });
    fireEvent.change(passInput, { target: { value: 'TestPass!23' } });

    const form = credInput.closest('form');
    if (!form) {
        throw new Error('login-credential input is not inside a <form>');
    }

    fireEvent.submit(form);

    // The submit handler awaits `login(...)`. waitFor flushes microtasks
    // until either router.push fires or the 2 s timeout elapses. A
    // timeout indicates that the redirect branch never ran — that is
    // itself a property failure (some role produced no navigation at
    // all) and the surrounding assertion will surface it as
    // "expected router.push(...) but got []".
    try {
        await waitFor(
            () => {
                if (mocks.pushCalls.length === 0) {
                    throw new Error('router.push not yet invoked');
                }
            },
            { timeout: 2000 },
        );
    } catch {
        /* fall through — let the property assertion produce the diagnostic */
    }

    return [...mocks.pushCalls];
}

// ── The property ─────────────────────────────────────────────────────────
describe('Property Y — Login redirect', () => {
    beforeEach(() => {
        resetState();
    });

    afterEach(() => {
        resetState();
    });

    test(
        'post-login redirects to /admin for admin roles, /rewards otherwise, and never to /profile',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(...ALL_ROLES),
                    async (role) => {
                        resetState();

                        const pushCalls = await attemptLoginAs(role);

                        // Universal: /profile is NEVER a post-login target.
                        if (pushCalls.includes('/profile')) {
                            throw new Error(
                                `router.push("/profile") was called for role=${role}; ` +
                                `the Login_Modal MUST NEVER use /profile as a redirect ` +
                                `target. Observed pushes: ${JSON.stringify(pushCalls)}`,
                            );
                        }

                        const expectedPath = ADMIN_ROLE_SET.has(role)
                            ? '/admin'
                            : '/rewards';
                        const wrongPath = expectedPath === '/admin'
                            ? '/rewards'
                            : '/admin';

                        // Conditional: the correct landing page is targeted.
                        if (!pushCalls.includes(expectedPath)) {
                            throw new Error(
                                `expected router.push("${expectedPath}") for role=${role} ` +
                                `(Admin_Role_Set membership = ${ADMIN_ROLE_SET.has(role)}), ` +
                                `but got ${JSON.stringify(pushCalls)}`,
                            );
                        }

                        // Reciprocal: the OTHER landing page is not used.
                        if (pushCalls.includes(wrongPath)) {
                            throw new Error(
                                `router.push("${wrongPath}") leaked through for role=${role}; ` +
                                `expected only "${expectedPath}". ` +
                                `Observed: ${JSON.stringify(pushCalls)}`,
                            );
                        }

                        return true;
                    },
                ),
                {
                    numRuns: 50,
                    examples: ALL_ROLES.map((role) => [role]),
                },
            );
        },
        30_000,
    );
});
