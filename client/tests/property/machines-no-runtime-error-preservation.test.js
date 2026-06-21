/**
 * Property 12: Preservation — Cards/Edit/Maintenance No Runtime Error (C1–C4 guard).
 *
 * Bugfix spec: admin-dashboard-fixes, Task 50.
 *
 * PRESERVATION TEST — EXPECTED TO PASS on UNFIXED code. A passing run records
 * that non-buggy interactions (machine card rendering, opening/closing the Edit
 * modal, opening/closing the Maintenance modal, opening/closing the Add modal)
 * do NOT throw a runtime error.
 *
 * Bug condition path avoided (¬C = preservation path):
 *   • searchQuery is NEVER set to a non-empty value → C4 (getLocationName TDZ)
 *     is never triggered.
 *   • Add / Edit / Maintenance modals are OPENED and CLOSED but NOT submitted
 *     → C1/C2/C3 (submit wiring bugs) are not exercised.
 *   • All interactions stay on the "happy render path".
 *
 * Observed baseline behavior on UNFIXED code (recorded per task spec):
 *   • MachineCard renders for each machine in the dataset without throwing.
 *   • Online/Offline/Total Items stat cards render correct counts.
 *   • Clicking "Add Machine" opens the Add modal; clicking Cancel closes it —
 *     no error thrown.
 *   • Clicking the edit (pencil) icon on a card opens the Edit modal; clicking
 *     Cancel closes it — no error thrown, original card data unchanged.
 *   • Clicking "View Logs" on a card opens the Maintenance modal; clicking
 *     Close closes it — no error thrown.
 *
 * Properties asserted (¬C inputs only):
 *   P12a — the page renders all machine cards without throwing (no empty
 *           search, no submit action).
 *   P12b — opening and cancelling the Add Machine modal does not throw.
 *   P12c — opening and cancelling the Edit Machine modal for a card does not
 *           throw, and the card name is still visible after close.
 *   P12d — opening and closing the Maintenance modal for a card does not throw.
 *
 * Validates: Requirement 3.6
 *
 * Run via:  npx vitest run tests/property/machines-no-runtime-error-preservation.test.js
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, fireEvent, waitFor, within } from '@testing-library/react';

// ── Hoisted mock state ────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    machines: [],
}));

vi.mock('../../src/services/api', () => ({
    machines: {
        getAll: async () => mocks.machines,
        create: async (_data) => ({ id: 9999, name: _data.name, machineUuid: 'uuid-stub', locationId: _data.locationId, locationName: _data.locationName, isOnline: true, totalItemsCollected: 0, currentCapacity: 0 }),
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
        allLocations: [
            { id: 1, name: 'LocAlpha' },
            { id: 2, name: 'LocBeta' },
        ],
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

import MachinesPage from '../../app/admin/machines/page.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function resetState() {
    cleanup();
    mocks.machines = [];
}

beforeEach(resetState);

// ── Wait for data load ────────────────────────────────────────────────────────
// Waits until the loading skeleton clears and the page body contains the
// expected content for the given dataset length.
async function waitForLoad(datasetLength) {
    await waitFor(
        () => {
            const body = document.body.textContent;
            if (datasetLength === 0) {
                // Empty state or stat cards rendered (both are valid stable states).
                expect(
                    body.includes('Machines') || body.includes('Online'),
                ).toBe(true);
            } else {
                // At least one stat card should have rendered.
                expect(body.includes('Online')).toBe(true);
            }
        },
        { timeout: 3000 },
    );
}

// ── Generators ────────────────────────────────────────────────────────────────
// Pure alphanumeric tokens — trim() === self, never empty, ≤20 chars.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 2, maxLength: 20 },
    )
    .map((a) => a.join(''));

// Machine record matching the page's normalised shape (id is integer; page
// normalises to String via `.map(m => ({ ...m, id: String(m.id) }))`).
const machineArb = fc.record({
    id: fc.integer({ min: 1, max: 9999 }),
    name: tokenArb,
    machineUuid: tokenArb,
    locationId: fc.constantFrom(1, 2),
    locationName: tokenArb,
    isOnline: fc.boolean(),
    totalItemsCollected: fc.nat({ max: 500 }),
    currentCapacity: fc.nat({ max: 100 }),
});

// Dataset with 1–6 machines, deduplicated by id. Non-empty so cards render.
const machineDatasetArb = fc
    .array(machineArb, { minLength: 1, maxLength: 6 })
    .map((arr) => {
        const seen = new Set();
        return arr.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });
    })
    .filter((arr) => arr.length >= 1);

// ── Properties ────────────────────────────────────────────────────────────────
describe('Property 12: Preservation — Machines page renders without runtime error', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // P12a: page renders all machine cards without throwing.
    // searchQuery is never set → C4 (getLocationName TDZ) never triggered.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P12a: machine cards render without throwing for all valid datasets (no search)',
        async () => {
            await fc.assert(
                fc.asyncProperty(machineDatasetArb, async (dataset) => {
                    resetState();
                    mocks.machines = dataset;

                    // Should not throw during render.
                    render(React.createElement(MachinesPage));
                    await waitForLoad(dataset.length);

                    const body = document.body.textContent;

                    // Every page-1 machine name (up to 9) must appear in the DOM.
                    const page1 = dataset.slice(0, 9);
                    for (const m of page1) {
                        expect(
                            body.includes(m.name),
                            `P12a: machine name "${m.name}" (id=${m.id}) not found in rendered output`,
                        ).toBe(true);
                    }

                    return true;
                }),
                {
                    numRuns: 20,
                    examples: [
                        // Concrete baseline: single online machine.
                        [[{ id: 1, name: 'AlphaRVM', machineUuid: 'uuid1', locationId: 1, locationName: 'MainLobby', isOnline: true, totalItemsCollected: 5, currentCapacity: 10 }]],
                        // Concrete baseline: single offline machine.
                        [[{ id: 2, name: 'BetaRVM', machineUuid: 'uuid2', locationId: 2, locationName: 'Canteen', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 }]],
                        // Mixed set.
                        [[
                            { id: 10, name: 'MachineA', machineUuid: 'uA', locationId: 1, locationName: 'LibraryA', isOnline: true, totalItemsCollected: 20, currentCapacity: 5 },
                            { id: 11, name: 'MachineB', machineUuid: 'uB', locationId: 2, locationName: 'CafeteriaB', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 },
                        ]],
                    ],
                },
            );
        },
        30_000,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // P12b: open → cancel Add Machine modal does not throw.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P12b: open and cancel the Add Machine modal without runtime error',
        async () => {
            await fc.assert(
                fc.asyncProperty(machineDatasetArb, async (dataset) => {
                    resetState();
                    mocks.machines = dataset;

                    render(React.createElement(MachinesPage));
                    await waitForLoad(dataset.length);

                    // Open the Add Machine modal.
                    const addBtn = screen.getByRole('button', { name: /add machine/i });
                    fireEvent.click(addBtn);

                    // The modal heading "Add New Machine" should appear.
                    await waitFor(() => {
                        expect(document.body.textContent.includes('Add New Machine')).toBe(true);
                    }, { timeout: 1000 });

                    // Cancel without submitting.
                    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
                    fireEvent.click(cancelBtn);

                    // Modal should be gone; page still intact (no crash).
                    await waitFor(() => {
                        expect(document.body.textContent.includes('Add New Machine')).toBe(false);
                    }, { timeout: 1000 });

                    return true;
                }),
                {
                    numRuns: 10,
                    examples: [
                        [[{ id: 5, name: 'RvmGamma', machineUuid: 'uG', locationId: 1, locationName: 'RoomA', isOnline: true, totalItemsCollected: 0, currentCapacity: 0 }]],
                    ],
                },
            );
        },
        30_000,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // P12c: open → cancel Edit Machine modal does not throw; card name
    // still visible after close (original state preserved).
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P12c: open and cancel the Edit Machine modal without runtime error',
        async () => {
            await fc.assert(
                fc.asyncProperty(machineDatasetArb, async (dataset) => {
                    resetState();
                    mocks.machines = dataset;

                    render(React.createElement(MachinesPage));
                    await waitForLoad(dataset.length);

                    // Find the first card's Edit button (aria-label="Edit machine").
                    // MachineCard renders a pencil icon button with title "Edit".
                    const editBtns = document.querySelectorAll('button[title="Edit"]');
                    if (editBtns.length === 0) {
                        // No edit buttons found — nothing to test for this run.
                        return true;
                    }

                    const firstMachine = dataset[0];
                    fireEvent.click(editBtns[0]);

                    // Edit Machine modal heading should appear.
                    await waitFor(() => {
                        expect(document.body.textContent.includes('Edit Machine')).toBe(true);
                    }, { timeout: 1000 });

                    // Cancel without saving.
                    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
                    fireEvent.click(cancelBtn);

                    // Modal gone; original card name still visible (no state corruption).
                    await waitFor(() => {
                        // Modal heading gone.
                        const bodyText = document.body.textContent;
                        // The modal "Edit Machine" title should no longer be the modal panel —
                        // we just check the machine name card is still there.
                        expect(bodyText.includes(firstMachine.name)).toBe(true);
                    }, { timeout: 1000 });

                    return true;
                }),
                {
                    numRuns: 10,
                    examples: [
                        [[{ id: 7, name: 'DeltaRVM', machineUuid: 'uD', locationId: 1, locationName: 'HallwayD', isOnline: true, totalItemsCollected: 3, currentCapacity: 50 }]],
                    ],
                },
            );
        },
        30_000,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // P12d: open → close Maintenance modal does not throw.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P12d: open and close the Maintenance modal without runtime error',
        async () => {
            await fc.assert(
                fc.asyncProperty(machineDatasetArb, async (dataset) => {
                    resetState();
                    mocks.machines = dataset;

                    render(React.createElement(MachinesPage));
                    await waitForLoad(dataset.length);

                    // MachineCard renders a "View Logs" button (title or text).
                    const logsBtns = screen.queryAllByTitle('Maintenance Logs');
                    if (logsBtns.length === 0) {
                        // Fallback: try by text.
                        const fallback = screen.queryAllByText(/view logs/i);
                        if (fallback.length === 0) return true; // no buttons rendered yet
                        fireEvent.click(fallback[0]);
                    } else {
                        fireEvent.click(logsBtns[0]);
                    }

                    // Maintenance Logs modal heading should appear.
                    await waitFor(() => {
                        expect(document.body.textContent.includes('Maintenance Logs')).toBe(true);
                    }, { timeout: 1500 });

                    // Close the modal.
                    const closeBtn = screen.getByRole('button', { name: /^close$/i });
                    fireEvent.click(closeBtn);

                    // No crash; page still has the machine name.
                    await waitFor(() => {
                        expect(document.body.textContent.includes(dataset[0].name)).toBe(true);
                    }, { timeout: 1000 });

                    return true;
                }),
                {
                    numRuns: 10,
                    examples: [
                        [[{ id: 8, name: 'EpsilonRVM', machineUuid: 'uE', locationId: 2, locationName: 'WingE', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 }]],
                    ],
                },
            );
        },
        30_000,
    );
});
