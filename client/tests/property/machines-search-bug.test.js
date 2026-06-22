/**
 * Property 4: Bug Condition — Machine Search Throws getLocationName TDZ (C4).
 *
 * Bugfix spec: admin-dashboard-fixes (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on UNFIXED code. A failing run is the
 * SUCCESS case here: it proves the C4 bug exists. The SAME test encodes the
 * expected post-fix behavior and validates the fix once `getLocationName` is
 * defined/hoisted before the `displayedMachines` useMemo.
 *
 * Root cause being surfaced (temporal dead zone):
 *   `displayedMachines` useMemo at L654 calls `getLocationName(m.locationId)`
 *   at L660. However, `getLocationName` is declared as a `const` arrow
 *   function at L722 — AFTER the memo. In JavaScript, `const`/`let`
 *   declarations are hoisted to the top of their block but NOT initialized;
 *   accessing them before the declaration line throws:
 *       ReferenceError: Cannot access 'getLocationName' before initialization
 *   The memo callback forms a closure over the TDZ binding, so the error
 *   triggers the first time React evaluates the memo with a non-empty
 *   `searchQuery` (i.e., after the user types in the search box).
 *
 * Scoped PBT slice (deterministic bug — one concrete failing case covers all):
 *   For any non-empty searchQuery string typed into the search input while at
 *   least one machine exists, `displayedMachines` MUST return filtered results
 *   WITHOUT throwing a ReferenceError / TypeError.
 *
 * Expected Behavior (Req 2.4):
 *   `getLocationName` is defined before the `displayedMachines` useMemo so
 *   the closure captures an initialized binding. Filtering returns results
 *   without throwing for every non-empty query.
 *
 * Run via:  npx vitest run tests/property/machines-search-bug.test.js
 */
import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, fireEvent, act } from '@testing-library/react';

// ── Fixtures ──────────────────────────────────────────────────────────────
const LOCATIONS = [
    { id: 101, name: 'OrgAlpha' },
    { id: 202, name: 'OrgBeta' },
];

// Seed machines that will be in state when the user searches.
const SEED_MACHINES = [
    {
        id: 7001,
        name: 'RvmAlphaMain',
        machineUuid: 'RVM-001',
        locationName: 'MainLobby',
        locationId: 101,
        isOnline: true,
        totalItemsCollected: 12,
        currentCapacity: 3,
        lastSync: null,
    },
    {
        id: 7002,
        name: 'RvmBetaCanteen',
        machineUuid: 'RVM-002',
        locationName: 'Canteen',
        locationId: 202,
        isOnline: false,
        totalItemsCollected: 5,
        currentCapacity: 1,
        lastSync: null,
    },
];

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../../src/services/api', () => ({
    machines: {
        getAll: async () => SEED_MACHINES.map(m => ({ ...m })),
        create: async (data) => ({ id: 9999, ...data }),
        update: async (id, data) => ({ id, ...data }),
    },
    logs: {
        getMachines: async () => [],
        createMachineLog: async () => ({}),
    },
    users: {
        getAll: async () => [],
    },
}));

vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        effectiveLocationId: null,
        currentLocation: null,
        isSuperAdmin: true,
        allLocations: LOCATIONS,
        currentUser: { id: 1, role: 'superadmin' },
        hasPermission: () => true,
    }),
    ADMIN_ROLES: new Set(['superadmin']),
}));

vi.mock('../../src/components/admin/RequirePermission', () => ({
    default: ({ children }) => children,
}));
vi.mock('../../src/components/admin/AdminLayout', () => ({
    ViewOnlyBanner: () => null,
    ViewOnlyWrapper: ({ children }) => children,
}));

// Page under test — imported AFTER vi.mock declarations.
import MachinesPage from '../../app/admin/machines/page.js';

// ── Setup ─────────────────────────────────────────────────────────────────
beforeAll(() => {
    if (!globalThis.crypto) globalThis.crypto = {};
    if (typeof globalThis.crypto.randomUUID !== 'function') {
        globalThis.crypto.randomUUID = () =>
            'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, () =>
                Math.floor(Math.random() * 16).toString(16),
            );
    }
});

beforeEach(() => {
    cleanup();
});

// ── Generator ─────────────────────────────────────────────────────────────
// Any non-empty, non-whitespace string: the concrete class of inputs that
// triggers the TDZ. Single-char "a" is the minimal counterexample.
const nonEmptyQueryArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 20 },
    )
    .map((a) => a.join(''));

// ── Driver ────────────────────────────────────────────────────────────────
// Renders the page, waits for machine cards to load, then types `query` into
// the search input. Wraps fireEvent in `act` so React processes the useMemo
// re-evaluation synchronously and any thrown error surfaces immediately.
async function typeSearchQuery(query) {
    render(React.createElement(MachinesPage));

    // Wait for seed machine data to load (confirm at least one card present).
    await screen.findByText(SEED_MACHINES[0].name);

    // Locate the search input — placeholder matches the machines page.
    const searchInput = screen.getByPlaceholderText(/search machines/i);

    // Type the query: this changes `searchQuery` state → re-evaluates
    // `displayedMachines` useMemo → calls getLocationName → TDZ throw on
    // unfixed code.
    await act(async () => {
        fireEvent.change(searchInput, { target: { value: query } });
    });
}

// ── The property ──────────────────────────────────────────────────────────
describe('Property 4: Bug Condition — Machine search crashes with getLocationName TDZ (C4)', () => {
    test(
        'typing any non-empty query while machines exist filters results without throwing ReferenceError/TypeError',
        async () => {
            await fc.assert(
                fc.asyncProperty(nonEmptyQueryArb, async (query) => {
                    cleanup();

                    const ctx = `searchQuery=${JSON.stringify(query)}`;

                    // The TDZ bug causes React's error boundary / jsdom to surface an
                    // unhandled error. Catch it by wrapping in try/catch; any thrown
                    // error IS the counterexample.
                    let thrownError = null;
                    const origError = console.error;
                    // Suppress React's "The above error occurred..." noise while still
                    // catching the actual throw.
                    console.error = (...args) => {
                        const msg = String(args[0] || '');
                        if (
                            msg.includes('getLocationName') ||
                            msg.includes('ReferenceError') ||
                            msg.includes('Cannot access') ||
                            msg.includes('before initialization')
                        ) {
                            thrownError = new ReferenceError(msg);
                        }
                        // Suppress all React internal boundary noise for clean output.
                    };

                    try {
                        await typeSearchQuery(query);
                    } catch (err) {
                        thrownError = err;
                    } finally {
                        console.error = origError;
                    }

                    // PRIMARY assertion: no ReferenceError / TypeError thrown.
                    expect(
                        thrownError,
                        `${ctx}: search threw "${thrownError?.message}" — ` +
                        `getLocationName is accessed before its const declaration (TDZ). ` +
                        `Counterexample: searchQuery="${query}" triggers L660 before L722.`,
                    ).toBeNull();

                    return true;
                }),
                {
                    numRuns: 10,
                    // Minimal counterexample — single char query is enough to trigger TDZ.
                    examples: [['a'], ['R'], ['rvm']],
                },
            );
        },
    );
});
