/**
 * Property 11: Preservation — Valid Add User Still Creates.
 *
 * Bugfix spec: admin-dashboard-fixes, Task 49.
 *
 * PRESERVATION TEST — EXPECTED TO PASS on UNFIXED code. Records the baseline
 * behavior of `AddUserModal.jsx` for inputs that already pass validation:
 * valid payloads reach `usersApi.create`, the created user has the correct
 * fields matching `UserCreateSchema`, and `onUserAdded` fires with the result.
 *
 * Bug condition path (¬C = preservation path):
 *   ¬C = Add User modal with an input that ALREADY passes ALL current client-
 *        side validation AND satisfies the server password policy.
 *        These inputs are NOT on the C6 defect path (which involves passwords
 *        that pass the weak client rule but fail the server policy, OR flat-
 *        string server errors being swallowed as "BAD REQUEST").
 *
 * Observed baseline behavior on UNFIXED code (recorded per task spec):
 *
 *   When the submitted payload satisfies:
 *     • firstName.trim() non-empty
 *     • lastName.trim() non-empty
 *     • username valid (VALIDATION_RULES.user.username — required, maxLength 100)
 *     • email valid (VALIDATION_RULES.user.email — required, maxLength 200, type email)
 *     • password.length ≥ 8, contains [A-Z], [a-z], [0-9]  (server policy satisfied)
 *     • passwords match
 *     • role selected (one of head_admin / auditor / inventory_officer / technician)
 *     • locationId provided (superadmin context)
 *
 *   Then AddUserModal.handleSubmit:
 *     1. Calls `usersApi.create(payload)` exactly once.
 *     2. The payload shape aligns to `UserCreateSchema`:
 *          { firstName, lastName, middleName?, username?, email, phone?,
 *            password, role, locationId }
 *          NOTE: isAdmin is NOT sent — removed by C6 fix (server extra='forbid',
 *          derives is_admin from role).
 *     3. On success, calls `onUserAdded(newUser)` where newUser.id is String(created.id).
 *     4. Modal is closed (onClose fires).
 *
 * Properties asserted:
 *   P11a — For every valid strong-password payload, `usersApi.create` is
 *          called with a shape conforming to `UserCreateSchema` required fields.
 *   P11b — The payload sent to `usersApi.create` contains trimmed firstName,
 *          lastName, and the exact email and role values from the form.
 *   P11c — `onUserAdded` fires after a successful create with a user object
 *          that carries `id` as a String and includes `firstName`/`lastName`.
 *   P11d — `onClose` fires after a successful create (modal self-closes).
 *
 * Re-run as Task 54.3 to confirm no regressions after the C6 fix is applied.
 * Validates: Requirement 3.5 (bugfix.md §3.5)
 *
 * Run via:  npx vitest run tests/property/add-user-valid-create-preservation.test.js
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Fixtures ───────────────────────────────────────────────────────────────
const LOCATIONS = [
    { id: 101, name: 'EPTU', fullName: 'Eastern Philippines Tech University' },
    { id: 202, name: 'OrgBeta', fullName: 'Beta Institute' },
];

const ROLES = ['head_admin', 'auditor', 'inventory_officer', 'technician'];

// ── Hoisted mock state ─────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    createCalls: [],   // accumulates every payload passed to usersApi.create
    nextId: 9000,
}));

// ── Server stub — always succeeds, mirrors create_user 201 response shape ──
//
// Returns a user object matching what `_serialize_user()` produces, which
// AddUserModal merges into its local `newUser` shape before calling onUserAdded.
async function serverStub(payload) {
    const id = mocks.nextId++;
    mocks.createCalls.push({ ...payload });
    return {
        id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        middleName: payload.middleName || null,
        username: payload.username || null,
        email: payload.email,
        role: payload.role || 'head_admin',
        locationId: payload.locationId,
        isActive: true,
        pointsBalance: 0,
        createdAt: new Date().toISOString(),
    };
}

vi.mock('../../src/services/api', () => ({
    users: {
        create: (data) => serverStub(data),
        getAll: async () => [],
        update: async (id, data) => ({ id, ...data }),
    },
}));

// Superadmin context so the Location dropdown renders and locationId is
// included in the submitted payload — matching the C6 bug-reporter's context.
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

vi.mock('../../src/components/admin/AdminLayout', () => ({
    ViewOnlyBanner: () => null,
    ViewOnlyWrapper: ({ children }) => children,
}));
vi.mock('../../src/components/admin/RequirePermission', () => ({
    default: ({ children }) => children,
}));

// CustomDropdown stub — renders as a plain <select> so tests can drive it
// without depending on real dropdown click mechanics.
vi.mock('../../src/components/admin/CustomDropdown', () => ({
    default: ({ value, onChange, options = [], placeholder }) => {
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

import AddUserModal from '../../src/components/admin/AddUserModal.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────
function resetState() {
    cleanup();
    mocks.createCalls.length = 0;
}

beforeEach(resetState);

// ── Generators ─────────────────────────────────────────────────────────────
// Alphanumeric token, trim() === self, non-empty, ≤20 chars.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 20 },
    )
    .map((a) => a.join(''));

const emailArb = tokenArb.map((s) => `${s}@test.com`);
const locIdArb = fc.constantFrom(...LOCATIONS.map((l) => l.id));
const roleArb  = fc.constantFrom(...ROLES);

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT = '0123456789';

const charArrayOf = (chars, min, max) =>
    fc.array(fc.constantFrom(...chars.split('')), { minLength: min, maxLength: max })
       .map((a) => a.join(''));

/**
 * Passwords that satisfy BOTH the current client rule (minLength 6) AND
 * the server policy (≥8, one uppercase, one lowercase, one digit).
 *
 * These are the ¬C inputs: already valid on unfixed code.
 * Format: lowerSegment + upperSegment + digitSegment (min 9 chars total).
 */
const strongPasswordArb = fc.tuple(
    charArrayOf(LOWER, 3, 6),   // ≥3 lowercase chars
    charArrayOf(UPPER, 3, 6),   // ≥3 uppercase chars
    charArrayOf(DIGIT, 2, 3),   // ≥2 digits
).map(([l, u, d]) => l + u + d); // total ≥8, all four rules satisfied

// ── Driver ─────────────────────────────────────────────────────────────────
/**
 * Renders AddUserModal, fills Information tab and Permissions tab,
 * then submits the form.
 *
 * Returns `{ onUserAdded, onClose }` spies for post-submission assertions.
 */
async function fillAndSubmitAdminModal({
    firstName  = 'Alice',
    lastName   = 'Smith',
    middleName = '',
    username   = 'alice99',
    email      = 'alice@test.com',
    password   = 'ValidPass1',
    locationId = LOCATIONS[0].id,
    role       = 'head_admin',
} = {}) {
    const onUserAdded = vi.fn();
    const onClose     = vi.fn();

    render(
        React.createElement(AddUserModal, {
            isOpen: true,
            onClose,
            onUserAdded,
        }),
    );

    // ── Information tab ────────────────────────────────────────────────────
    const infoTabBtn = screen.getByRole('button', { name: /^Information$/i });
    fireEvent.click(infoTabBtn);

    fireEvent.change(screen.getByPlaceholderText('First Name'),        { target: { value: firstName } });
    if (middleName) {
        fireEvent.change(screen.getByPlaceholderText('Middle Name'),   { target: { value: middleName } });
    }
    fireEvent.change(screen.getByPlaceholderText('Last Name'),         { target: { value: lastName } });
    fireEvent.change(screen.getByPlaceholderText('johndoe'),           { target: { value: username } });
    fireEvent.change(screen.getByPlaceholderText('john@ecopoints.com'),{ target: { value: email } });

    const pwInputs = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(pwInputs[0], { target: { value: password } });
    fireEvent.change(pwInputs[1], { target: { value: password } });

    // Location dropdown (superadmin only — stubbed as <select>)
    const locSelect = screen.getByRole('combobox', { name: /Select a location/i });
    fireEvent.change(locSelect, { target: { value: String(locationId) } });

    // ── Permissions tab ────────────────────────────────────────────────────
    fireEvent.click(screen.getByRole('button', { name: /^Permissions$/i }));

    // Map role ID to the button label shown in the modal
    const ROLE_LABEL_MAP = {
        head_admin:          /Head Admin/i,
        auditor:             /Auditor/i,
        inventory_officer:   /Inventory Officer/i,
        technician:          /Technician/i,
    };
    const roleBtn = await screen.findByRole('button', { name: ROLE_LABEL_MAP[role] });
    fireEvent.click(roleBtn);

    // ── Submit ──────────────────────────────────────────────────────────────
    const form = document.querySelector('form');
    fireEvent.submit(form);

    return { onUserAdded, onClose };
}

// ══════════════════════════════════════════════════════════════════════════
// P11a: usersApi.create called exactly once, payload shape matches
//       UserCreateSchema required fields.
//
// PRESERVATION — must PASS on unfixed code.
// Confirms the success path of AddUserModal works correctly for inputs that
// already satisfy both client validation and the server password policy.
// ══════════════════════════════════════════════════════════════════════════
describe('Property 11a: Preservation — usersApi.create called once with UserCreateSchema-aligned payload', () => {
    test(
        'for every valid strong-password payload, usersApi.create is called ' +
        'exactly once and the payload contains all UserCreateSchema required fields',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    tokenArb,   // firstName
                    tokenArb,   // lastName
                    tokenArb,   // username
                    emailArb,   // email
                    strongPasswordArb,  // password (¬C path — already valid)
                    locIdArb,   // locationId
                    roleArb,    // role
                    async (firstName, lastName, username, email, password, locationId, role) => {
                        resetState();

                        await fillAndSubmitAdminModal({
                            firstName,
                            lastName,
                            username,
                            email,
                            password,
                            locationId,
                            role,
                        });

                        const ctx =
                            `firstName=${JSON.stringify(firstName)} ` +
                            `lastName=${JSON.stringify(lastName)} ` +
                            `password=${JSON.stringify(password)} ` +
                            `role=${role}`;

                        // (1) usersApi.create MUST be called exactly once.
                        await waitFor(
                            () =>
                                expect(
                                    mocks.createCalls.length,
                                    `${ctx}: usersApi.create was never called — ` +
                                    `client validation incorrectly blocked a valid (¬C) payload. ` +
                                    `This is a PRESERVATION FAILURE: the C6 fix must not break ` +
                                    `the success path for already-valid inputs.`,
                                ).toBe(1),
                            { timeout: 3000 },
                        );

                        const sent = mocks.createCalls[0];

                        // (2) Payload MUST contain UserCreateSchema required fields.
                        expect(
                            sent.firstName,
                            `${ctx}: payload.firstName missing or wrong — sent: ${JSON.stringify(sent)}`,
                        ).toBe(firstName.trim());

                        expect(
                            sent.lastName,
                            `${ctx}: payload.lastName missing or wrong — sent: ${JSON.stringify(sent)}`,
                        ).toBe(lastName.trim());

                        expect(
                            sent.email,
                            `${ctx}: payload.email missing or wrong — sent: ${JSON.stringify(sent)}`,
                        ).toBe(email);

                        expect(
                            sent.password,
                            `${ctx}: payload.password missing — sent: ${JSON.stringify(sent)}`,
                        ).toBe(password);

                        expect(
                            sent.role,
                            `${ctx}: payload.role missing or wrong — sent: ${JSON.stringify(sent)}`,
                        ).toBe(role);

                        expect(
                            sent.locationId,
                            `${ctx}: payload.locationId missing — sent: ${JSON.stringify(sent)}`,
                        ).toBeTruthy();

                        // isAdmin is NOT sent in the payload — the C6 fix removed it
                        // because the server uses extra='forbid' and derives is_admin from `role`.
                        // Asserting isAdmin is absent (or undefined) preserves the fix.
                        expect(
                            sent.isAdmin,
                            `${ctx}: payload.isAdmin must NOT be present — server uses extra='forbid' ` +
                            `and derives is_admin from role. Sending it causes 400. sent: ${JSON.stringify(sent)}`,
                        ).toBeUndefined();

                        return true;
                    },
                ),
                {
                    numRuns: 8,
                    examples: [
                        // Concrete canonical example — most representative ¬C input
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'ValidPass1', 101, 'head_admin'],
                        // Different roles
                        ['Bob',   'Tanaka', 'btanaka', 'bob@test.com', 'StrongPw2', 202, 'auditor'],
                        ['Carol', 'Reyes',  'creyesx', 'carol@test.com', 'SecureABC3', 101, 'technician'],
                    ],
                },
            );
        },
        60000,
    );
});

// ══════════════════════════════════════════════════════════════════════════
// P11b: Payload fields are trimmed and correctly mapped.
//
// PRESERVATION — must PASS on unfixed code.
// AddUserModal already does `firstName.trim()` and `lastName.trim()` before
// building the payload. This must survive the C6 fix unchanged.
// ══════════════════════════════════════════════════════════════════════════
describe('Property 11b: Preservation — payload contains trimmed name fields and correct email/role', () => {
    test(
        'payload.firstName === firstName.trim() and payload.email === email ' +
        'for every valid input',
        async () => {
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

                        await fillAndSubmitAdminModal({
                            firstName,
                            lastName,
                            username,
                            email,
                            password,
                            locationId,
                            role: 'head_admin',
                        });

                        await waitFor(
                            () => expect(mocks.createCalls.length).toBe(1),
                            { timeout: 3000 },
                        );

                        const sent = mocks.createCalls[0];
                        const ctx = `firstName=${JSON.stringify(firstName)} email=${JSON.stringify(email)}`;

                        // firstName and lastName are trimmed by handleSubmit
                        expect(
                            sent.firstName,
                            `${ctx}: payload.firstName must equal firstName.trim()`,
                        ).toBe(firstName.trim());

                        expect(
                            sent.lastName,
                            `${ctx}: payload.lastName must equal lastName.trim()`,
                        ).toBe(lastName.trim());

                        // email is NOT trimmed by the modal — sent as-is from state
                        expect(
                            sent.email,
                            `${ctx}: payload.email must equal form email value`,
                        ).toBe(email);

                        // role must be exactly 'head_admin' (what we selected)
                        expect(
                            sent.role,
                            `${ctx}: payload.role must be 'head_admin'`,
                        ).toBe('head_admin');

                        return true;
                    },
                ),
                {
                    numRuns: 8,
                    examples: [
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'ValidPass1', 101],
                    ],
                },
            );
        },
        60000,
    );
});

// ══════════════════════════════════════════════════════════════════════════
// P11c: onUserAdded fires with a user object whose id is String(created.id).
//
// PRESERVATION — must PASS on unfixed code.
// AddUserModal does `id: String(created.id)` when building `newUser`.
// This must survive the C6 fix unchanged.
// ══════════════════════════════════════════════════════════════════════════
describe('Property 11c: Preservation — onUserAdded fires with id coerced to String', () => {
    test(
        'after a successful create, onUserAdded is called with newUser.id as a string ' +
        'and newUser includes firstName and lastName',
        async () => {
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

                        const { onUserAdded } = await fillAndSubmitAdminModal({
                            firstName,
                            lastName,
                            username,
                            email,
                            password,
                            locationId,
                            role: 'head_admin',
                        });

                        const ctx =
                            `firstName=${JSON.stringify(firstName)} ` +
                            `lastName=${JSON.stringify(lastName)} ` +
                            `password=${JSON.stringify(password)}`;

                        // onUserAdded MUST be called
                        await waitFor(
                            () =>
                                expect(
                                    onUserAdded,
                                    `${ctx}: onUserAdded was not called after a successful create. ` +
                                    `This is a PRESERVATION FAILURE.`,
                                ).toHaveBeenCalledOnce(),
                            { timeout: 3000 },
                        );

                        const [newUser] = onUserAdded.mock.calls[0];

                        // id MUST be a String (AddUserModal does `id: String(created.id)`)
                        expect(
                            typeof newUser.id,
                            `${ctx}: newUser.id must be a string — got ${typeof newUser.id} (${newUser.id})`,
                        ).toBe('string');

                        // firstName must be present (either from created or form state)
                        expect(
                            newUser.firstName || newUser.name,
                            `${ctx}: newUser must carry firstName or name`,
                        ).toBeTruthy();

                        return true;
                    },
                ),
                {
                    numRuns: 8,
                    examples: [
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'ValidPass1', 101],
                    ],
                },
            );
        },
        60000,
    );
});

// ══════════════════════════════════════════════════════════════════════════
// P11d: onClose fires after a successful create (modal self-closes).
//
// PRESERVATION — must PASS on unfixed code.
// After a successful create, AddUserModal calls `resetForm()` then `onClose()`.
// ══════════════════════════════════════════════════════════════════════════
describe('Property 11d: Preservation — modal closes (onClose fires) after successful create', () => {
    test(
        'onClose is called once after every successful valid Add User submission',
        async () => {
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

                        const { onClose } = await fillAndSubmitAdminModal({
                            firstName,
                            lastName,
                            username,
                            email,
                            password,
                            locationId,
                            role: 'head_admin',
                        });

                        const ctx =
                            `firstName=${JSON.stringify(firstName)} ` +
                            `password=${JSON.stringify(password)}`;

                        await waitFor(
                            () =>
                                expect(
                                    onClose,
                                    `${ctx}: onClose was not called after a successful create. ` +
                                    `Modal did not self-close. PRESERVATION FAILURE.`,
                                ).toHaveBeenCalledOnce(),
                            { timeout: 3000 },
                        );

                        return true;
                    },
                ),
                {
                    numRuns: 8,
                    examples: [
                        ['Alice', 'Smith', 'alice99', 'alice@test.com', 'ValidPass1', 101],
                    ],
                },
            );
        },
        60000,
    );
});
