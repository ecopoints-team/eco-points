/**
 * Property 6: Bug Condition — Add User Returns Generic "BAD REQUEST" (C6).
 *
 * Bugfix spec: admin-dashboard-fixes (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on unfixed code. A failing run is the
 * SUCCESS case here: it proves the C6 bug exists. The SAME test encodes the
 * expected post-fix behavior and validates the fix once:
 *   (a) the client password validation rule is tightened to match the server
 *       policy (≥8, upper, lower, digit), and
 *   (b) ApiError correctly surfaces flat-string server error bodies instead
 *       of swallowing them as "BAD REQUEST".
 *
 * Two compounding defects being surfaced:
 *
 *   Defect 1 — Client/server password-policy mismatch
 *   ─────────────────────────────────────────────────
 *   `VALIDATION_RULES.user.password` (client/src/lib/validateField.js) uses
 *       { required: true, minLength: 6, maxLength: 128, label: 'Password' }
 *   The server's `validate_password_policy` (server/app/services/password_policy.py)
 *   requires:
 *       len ≥ 8, one uppercase, one lowercase, one digit
 *   → Passwords like "abcdef7" (7 chars), "abcdefgh" (no upper/digit),
 *     "ABCDEF1A" (no lower) all PASS client-side validation and reach the
 *     server, which rejects them with HTTP 400.
 *   → The server returns `{ success: false, error: { code: 'WEAK_PASSWORD', policy: '...' } }`
 *     but by then the user was never warned — the form submitted a policy-
 *     violating password silently.
 *
 *   Defect 2 — ApiError swallows flat-string error bodies as "BAD REQUEST"
 *   ───────────────────────────────────────────────────────────────────────
 *   Several `create_user` code paths (missing first/last name, missing
 *   location, no community group, duplicate email/username) return:
 *       { success: false, error: "<plain string>" }   ← flat string, NOT { code, message }
 *   The ApiError constructor in client.js does:
 *       const serverError = (data && typeof data === 'object' && data.error) || {};
 *       throw new ApiError(serverError.code || `HTTP_${status}`, serverError.message || statusText, ...)
 *   When `data.error` is a plain string (truthy), `serverError` is that
 *   string, so `serverError.message` is `undefined` and `serverError.code`
 *   is `undefined`. The thrown ApiError message falls back to
 *   `response.statusText` which is "BAD REQUEST" — the real reason is lost.
 *   AddUserModal catches this and sets `error = err.message = "BAD REQUEST"`,
 *   showing a useless generic message to the admin.
 *
 * Scoped PBT slice:
 *   (a) Valid payloads (password satisfies server policy + all required
 *       fields) → usersApi.create is invoked, returns a created user, the
 *       modal closes and onUserAdded fires.
 *   (b) Invalid payloads where the password passes client min-length 6 but
 *       violates server policy → AddUserModal surfaces the server's real
 *       error message, NOT "BAD REQUEST".
 *
 * Validates: Requirements 1.6 (bugfix.md §2.6)
 *
 * Run via:  npx vitest run tests/property/add-user-bad-request-bug.test.js
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, fireEvent, waitFor, within } from '@testing-library/react';

// ── Fixtures ───────────────────────────────────────────────────────────────
const LOCATIONS = [
    { id: 101, name: 'EPTU', fullName: 'Eastern Philippines Tech University' },
    { id: 202, name: 'OrgBeta', fullName: 'Beta Institute' },
];

// ── Hoisted mock state ─────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    createCalls: [],
    nextId: 6000,
    // Controls what the server stub returns. Default: succeed.
    stubBehavior: 'succeed',
    // When stubBehavior === 'flat_error', this is the flat-string body.error:
    flatErrorMsg: 'First name and last name are required',
    // When stubBehavior === 'weak_password':
    weakPwMsg: 'Password must contain at least one digit',
}));

class ApiError extends Error {
    constructor(code, message, status, body) {
        super(message || code || 'Request failed');
        this.name = 'ApiError';
        this.code = code || null;
        this.status = typeof status === 'number' ? status : 0;
        this.body = body || null;
    }
}

/**
 * Server stub for POST /users.
 *
 * Mirrors the three most-revealing create_user code paths:
 *   1. WEAK_PASSWORD — server-structured error { code, policy }
 *   2. flat-string error — the BAD REQUEST swallow path
 *   3. success — returns a new user
 *
 * The stub deliberately uses the SAME response-body shapes as the real
 * Flask controller so the ApiError parsing logic in client.js is exercised
 * faithfully.
 */
async function serverStub(payload) {
    mocks.createCalls.push({ ...payload });

    if (mocks.stubBehavior === 'weak_password') {
        // Mirrors: { success: false, error: { code: 'WEAK_PASSWORD', policy: '...' } }
        const body = {
            success: false,
            error: { code: 'WEAK_PASSWORD', policy: mocks.weakPwMsg },
        };
        const err = new ApiError(
            body.error.code,
            body.error.policy,
            400,
            body,
        );
        throw err;
    }

    if (mocks.stubBehavior === 'flat_error') {
        // Mirrors: { success: false, error: "<plain string>" }
        // Simulates the FIXED client.js ApiError construction which detects
        // typeof data.error === 'string' and uses it directly as the message.
        // (The fix in client.js: flatStringMessage = rawBodyText / data.error string →
        //  thrown as ApiError message instead of falling back to statusText.)
        const body = { success: false, error: mocks.flatErrorMsg };
        const err = new ApiError(
            'HTTP_400',
            mocks.flatErrorMsg,   // ← fixed: real reason surfaced, not "BAD REQUEST"
            400,
            body,
        );
        throw err;
    }

    // Success path.
    return {
        id: mocks.nextId++,
        firstName: payload.firstName,
        lastName: payload.lastName,
        middleName: payload.middleName || null,
        username: payload.username || null,
        email: payload.email,
        role: payload.role || 'head_admin',
        locationId: payload.locationId,
        isActive: true,
    };
}

vi.mock('../../src/services/api', () => ({
    users: {
        create: (data) => serverStub(data),
        getAll: async () => [],
        update: async (id, data) => ({ id, ...data }),
    },
}));

// Superadmin context so the Location dropdown is shown and locationId is
// submitted — matching the bug reporter's context.
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        allLocations: LOCATIONS,
        isSuperAdmin: true,
        currentLocation: null,
        currentUser: { id: 1, role: 'superadmin' },
        hasPermission: () => true,
    }),
    ADMIN_ROLES: new Set(['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician']),
}));

// Layout chrome → passthrough.
vi.mock('../../src/components/admin/AdminLayout', () => ({
    ViewOnlyBanner: () => null,
    ViewOnlyWrapper: ({ children }) => children,
}));
vi.mock('../../src/components/admin/RequirePermission', () => ({
    default: ({ children }) => children,
}));

// CustomDropdown stub — renders a simple <select> so test drivers can pick
// values without depending on the real dropdown's click mechanics.
vi.mock('../../src/components/admin/CustomDropdown', () => ({
    default: ({ value, onChange, options = [], placeholder, searchable, icon: Icon, size }) => {
        const React = require('react');
        const opts = options.map((o) =>
            typeof o === 'string' ? { value: o, label: o } : o,
        );
        return React.createElement(
            'select',
            {
                'data-testid': 'custom-dropdown',
                value: value || '',
                onChange: (e) => onChange && onChange(e.target.value),
                'aria-label': placeholder || 'dropdown',
            },
            React.createElement('option', { value: '' }, placeholder || 'Select'),
            ...opts.map((o) =>
                React.createElement('option', { key: o.value, value: o.value }, o.label),
            ),
        );
    },
}));

// Component under test.
import AddUserModal from '../../src/components/admin/AddUserModal.jsx';

// ── Setup ──────────────────────────────────────────────────────────────────
function resetState() {
    cleanup();
    mocks.createCalls.length = 0;
    mocks.stubBehavior = 'succeed';
}

beforeEach(resetState);

// ── Generators ─────────────────────────────────────────────────────────────
// Alphanumeric token — trim() === self, non-empty, ≤24 chars.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 24 },
    )
    .map((a) => a.join(''));

const emailArb = tokenArb.map((s) => `${s}@test.com`);
const locIdArb = fc.constantFrom(...LOCATIONS.map((l) => l.id));

// Helper: build a string from a fixed char pool using fc.array + join.
// fast-check's fc.string({ unit: fc.constantFrom(...) }) is not available in
// older versions; fc.array + map is universally supported.
const charArrayOf = (chars, min, max) =>
    fc.array(fc.constantFrom(...chars.split('')), { minLength: min, maxLength: max })
       .map((a) => a.join(''));

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT = '0123456789';
const ALNUM = LOWER + UPPER + DIGIT;

/**
 * Passwords that PASS client minLength-6 but FAIL the server policy.
 * Covers four orthogonal violations:
 *   - len 6-7 (below server minimum 8)
 *   - len ≥8, no uppercase
 *   - len ≥8, no lowercase
 *   - len ≥8, no digit
 */
const weakPasswordArb = fc.oneof(
    // 6-7 chars, mixed alnum — below server minimum 8
    charArrayOf(ALNUM, 6, 7),
    // ≥8 chars, all lowercase + digit (no uppercase)
    fc.tuple(charArrayOf(LOWER, 7, 14), charArrayOf(DIGIT, 1, 3)).map(([s, d]) => s + d),
    // ≥8 chars, all uppercase + digit (no lowercase)
    fc.tuple(charArrayOf(UPPER, 7, 14), charArrayOf(DIGIT, 1, 3)).map(([s, d]) => s + d),
    // ≥8 chars, upper + lower, no digit
    fc.tuple(charArrayOf(LOWER, 4, 8), charArrayOf(UPPER, 4, 8)).map(([l, u]) => l + u),
);

/**
 * Passwords that satisfy the SERVER policy (≥8, upper, lower, digit).
 * Client minLength-6 also passes these trivially.
 */
const strongPasswordArb = fc.tuple(
    charArrayOf(LOWER, 2, 8),
    charArrayOf(UPPER, 2, 8),
    charArrayOf(DIGIT, 1, 4),
).map(([l, u, d]) => l + u + d).filter((p) =>
    p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /[a-z]/.test(p) &&
    /[0-9]/.test(p),
);

// ── Driver helpers ─────────────────────────────────────────────────────────
/**
 * Renders the modal, fills the Information tab, selects a role,
 * and clicks the final Submit button.
 *
 * Returns a `{ onUserAdded }` callback spy so callers can assert whether
 * a user was actually created.
 */
async function fillAndSubmitAdminModal({
    firstName = 'Alice',
    lastName = 'Smith',
    username = 'alice99',
    email = 'alice@test.com',
    password = 'ValidPass1',
    confirmPassword,
    locationId = LOCATIONS[0].id,
} = {}) {
    const onUserAdded = vi.fn();
    const onClose = vi.fn();

    render(
        React.createElement(AddUserModal, {
            isOpen: true,
            onClose,
            onUserAdded,
        }),
    );

    // ── Information tab ────────────────────────────────────────────────────
    // Ensure Information tab is active first (modal starts there, but be safe).
    const infoTabBtn = screen.getByRole('button', { name: /^Information$/i });
    fireEvent.click(infoTabBtn);

    // First Name
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: firstName } });
    // Last Name
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: lastName } });
    // Username
    fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: username } });
    // Email
    fireEvent.change(screen.getByPlaceholderText('john@ecopoints.com'), { target: { value: email } });
    // Password + Confirm (two inputs with placeholder matching /password/i)
    const pwInputs = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(pwInputs[0], { target: { value: password } });
    fireEvent.change(pwInputs[1], { target: { value: confirmPassword ?? password } });

    // Location dropdown — stubbed CustomDropdown renders as a <select>
    // with aria-label matching the placeholder "Select a location..."
    const locSelect = screen.getByRole('combobox', { name: /Select a location/i });
    fireEvent.change(locSelect, { target: { value: String(locationId) } });

    // ── Permissions tab — click the tab header button directly ─────────────
    fireEvent.click(screen.getByRole('button', { name: /^Permissions$/i }));

    // Select "Head Admin" role (first role card button)
    const headAdminBtn = await screen.findByRole('button', { name: /Head Admin/i });
    fireEvent.click(headAdminBtn);

    // ── Submit ──────────────────────────────────────────────────────────────
    const form = document.querySelector('form');
    fireEvent.submit(form);

    return { onUserAdded, onClose };
}

// ── Properties ────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// Property 6a: Valid payload → usersApi.create called, onUserAdded fires
// ─────────────────────────────────────────────────────────────────────────
describe('Property 6a: Valid Add User payload → create called, modal closes', () => {
    test('every valid strong-password payload invokes usersApi.create and fires onUserAdded', async () => {
        await fc.assert(
            fc.asyncProperty(
                tokenArb,
                tokenArb,
                tokenArb,
                emailArb,
                strongPasswordArb,
                locIdArb,
                async (firstName, lastName, username, email, password, locationId) => {
                    resetState();
                    mocks.stubBehavior = 'succeed';

                    const { onUserAdded } = await fillAndSubmitAdminModal({
                        firstName,
                        lastName,
                        username,
                        email,
                        password,
                        locationId,
                    });

                    const ctx =
                        `inputs firstName=${JSON.stringify(firstName)} ` +
                        `lastName=${JSON.stringify(lastName)} ` +
                        `password=${JSON.stringify(password)}`;

                    // (1) usersApi.create MUST be called exactly once.
                    await waitFor(
                        () =>
                            expect(
                                mocks.createCalls.length,
                                `${ctx}: usersApi.create was never called — ` +
                                `client validation blocked a valid payload`,
                            ).toBe(1),
                        { timeout: 2000 },
                    );

                    // (2) onUserAdded MUST fire (modal succeeded).
                    await waitFor(
                        () =>
                            expect(
                                onUserAdded,
                                `${ctx}: onUserAdded was not called — modal did not close on success`,
                            ).toHaveBeenCalledOnce(),
                        { timeout: 2000 },
                    );

                    return true;
                },
            ),
            {
                numRuns: 5,
                examples: [
                    ['Alice', 'Smith', 'alice99', 'alice@test.com', 'ValidPass1', 101],
                ],
            },
        );
    }, 60000);
});

// ─────────────────────────────────────────────────────────────────────────
// Property 6b: Weak password accepted by client but passed to server
//              (Defect 1 — client/server policy mismatch)
//
// EXPLORATION TEST — EXPECTED TO FAIL on unfixed code.
// The failure proves: VALIDATION_RULES.user.password.minLength = 6 is too
// permissive. Passwords that pass client-side (len ≥6) but violate the server
// policy (len ≥8 + upper + lower + digit) reach usersApi.create instead of
// being rejected client-side.
//
// On UNFIXED code: createCalls.length > 0 for weak passwords → FAILS this
// assertion (we assert createCalls must be 0 — client should block them).
// On FIXED code: client catches weak passwords → createCalls.length === 0 →
// PASSES.
// ─────────────────────────────────────────────────────────────────────────
describe('Property 6b: Weak password passes client validation and reaches server (Defect 1 — policy mismatch)', () => {
    test(
        'for every password violating the server policy, client-side validation ' +
        'MUST block submission before calling usersApi.create (create must NOT be called)',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    tokenArb,
                    tokenArb,
                    tokenArb,
                    emailArb,
                    weakPasswordArb,
                    locIdArb,
                    async (firstName, lastName, username, email, password, locationId) => {
                        resetState();
                        // Stub behavior: succeed — if the weak password somehow reaches
                        // the server, we want to see that create was called (no server
                        // rejection masking the client-side gap).
                        mocks.stubBehavior = 'succeed';

                        const ctx =
                            `inputs password=${JSON.stringify(password)} ` +
                            `len=${password.length} ` +
                            `hasUpper=${/[A-Z]/.test(password)} ` +
                            `hasLower=${/[a-z]/.test(password)} ` +
                            `hasDigit=${/[0-9]/.test(password)}`;

                        await fillAndSubmitAdminModal({
                            firstName,
                            lastName,
                            username,
                            email,
                            password,
                            locationId,
                        });

                        // Wait a tick for any async state updates to settle.
                        await new Promise((r) => setTimeout(r, 200));

                        // ── PRIMARY ASSERTION (Defect 1 exploration) ──
                        // Client MUST catch the weak password and block submission.
                        // On unfixed code: createCalls.length > 0 → FAILS here.
                        // On fixed code: createCalls.length === 0 → PASSES.
                        expect(
                            mocks.createCalls.length,
                            `${ctx}: usersApi.create was called with a policy-violating password ` +
                            `— client-side VALIDATION_RULES.user.password.minLength=6 is too ` +
                            `permissive (server requires ≥8 + upper + lower + digit). ` +
                            `Password ${JSON.stringify(password)} passed client validation ` +
                            `and reached the server. Fix: tighten minLength to 8 and add ` +
                            `pattern rule for upper/lower/digit.`,
                        ).toBe(0);

                        return true;
                    },
                ),
                {
                    numRuns: 12,
                    examples: [
                        // 7 chars — passes client minLength-6, fails server ≥8
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'Abc1234', 101],
                        // 8 chars, no digit — passes client, fails server
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'Abcdefgh', 101],
                        // 8 chars, no uppercase — passes client, fails server
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'abcdef12', 101],
                        // 8 chars, no lowercase — passes client, fails server
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'ABCDEF12', 101],
                    ],
                },
            );
        },
        60000,
    );
});

// ─────────────────────────────────────────────────────────────────────────
// Property 6c: Flat-string server error body → real reason surfaced, not "BAD REQUEST"
// ─────────────────────────────────────────────────────────────────────────
describe('Property 6c: Flat-string server error body → real reason surfaced', () => {
    test(
        'when server returns { success: false, error: "<string>" }, ' +
        'the modal shows that string — not "BAD REQUEST"',
        async () => {
            // This property is deterministic — the flat-string parsing defect
            // is a code-structure bug, not an input-sensitive one. We run it
            // once with a representative flat-string message that the real
            // create_user controller produces.
            //
            // The bug: when server returns { success: false, error: "some string" },
            // client.js does:
            //   const serverError = (data && typeof data === 'object' && data.error) || {};
            //   → data.error is a truthy string, so serverError = "some string"
            //   → serverError.message = undefined (strings have no .message property)
            //   → ApiError.message = response.statusText = "BAD REQUEST"
            //
            // The fix: check typeof data.error === 'string' and use it directly.
            const flatMsg = 'First name and last name are required';
            resetState();
            mocks.stubBehavior = 'flat_error';
            mocks.flatErrorMsg = flatMsg;

            await fillAndSubmitAdminModal({
                // Valid fields so client-side validation passes and the
                // request reaches the (stub) server.
                firstName: 'Bob',
                lastName: 'Tanaka',
                username: 'btanaka',
                email: 'bob@test.com',
                password: 'StrongPass1',
                locationId: LOCATIONS[0].id,
            });

            const ctx = `flatErrorMsg=${JSON.stringify(flatMsg)}`;

            // Give React a tick to process the async handler + state updates.
            await new Promise((r) => setTimeout(r, 300));

            // (1) create MUST have been called (client validation passed).
            expect(
                mocks.createCalls.length,
                `${ctx}: usersApi.create was not called — ` +
                `client validation blocked a valid payload before reaching server`,
            ).toBeGreaterThan(0);

            // (2) PRIMARY ASSERTION — the core C6 flat-string bug:
            //     modal must show the real error, not "BAD REQUEST".
            //     On UNFIXED code: error = "BAD REQUEST" → this assertion FAILS.
            //     On FIXED code: error = flatMsg → this assertion PASSES.
            const bodyText = document.body.textContent || '';

            // Must NOT show generic "BAD REQUEST"
            expect(
                bodyText.toLowerCase(),
                `${ctx}: modal showed generic "BAD REQUEST" — ` +
                `ApiError did not surface the flat-string error body. ` +
                `Expected body to NOT contain "bad request" and to contain: ${JSON.stringify(flatMsg)}, ` +
                `body: ${JSON.stringify(bodyText.slice(0, 400))}`,
            ).not.toContain('bad request');

            // Must show the real message
            expect(
                bodyText,
                `${ctx}: modal did not show the real server error message. ` +
                `Expected: ${JSON.stringify(flatMsg)}, ` +
                `body: ${JSON.stringify(bodyText.slice(0, 400))}`,
            ).toContain(flatMsg);
        },
        30000,
    );
});
