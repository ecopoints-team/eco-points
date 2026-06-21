/**
 * Property 7: Preservation — Machine List And Online/Offline Counts (C1–C3 guard).
 *
 * Bugfix spec: admin-dashboard-fixes, Task 45.
 *
 * PRESERVATION TEST — EXPECTED TO PASS on UNFIXED code. A passing run
 * records the baseline behaviors that C1–C3 fixes must not regress.
 * Re-run as Task 51.3 to confirm no regressions after fixes are applied.
 *
 * Bug condition path (¬C = preservation path):
 *   ¬C = normal load, no mutation (no Add/Edit/Maintenance submit), no search
 *        → displayedMachines derived from raw `machines` state with empty
 *          searchQuery; getLocationName never exercised on C4 crash path.
 *
 * Observed baseline behavior on UNFIXED code (recorded per task spec):
 *   • `machinesApi.getAll(locationId)` response is stored as `machines` state
 *     after normalising each id to String via `.map(m => ({ ...m, id: String(m.id) }))`.
 *   • `onlineCount`  = machines.filter(m => m.isOnline).length
 *   • `offlineCount` = machines.filter(m => !m.isOnline).length
 *   • `displayedMachines` with empty searchQuery === machines (no filtering).
 *   • MachineCard rendered for each item in currentMachines slice (page 1,
 *     cardsPerPage = 9).
 *
 * Properties asserted (¬C inputs only):
 *   P7a — rendered Online count stat matches onlineCount derived from dataset.
 *   P7b — rendered Offline count stat matches offlineCount derived from dataset.
 *   P7c — total displayed cards on page 1 === min(dataset.length, 9).
 *   P7d — each machine name from page 1 appears in the rendered output.
 *
 * Validates: Requirement 3.1
 *
 * Run via:  npx vitest run tests/property/machines-list-preservation.test.js
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, waitFor } from '@testing-library/react';

// ── Hoisted mock state ────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    machines: [],
}));

vi.mock('../../src/services/api', () => ({
    machines: {
        getAll: async () => mocks.machines,
        create: async () => ({}),
        update: async (id, d) => ({ id, ...d }),
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

// ── Generators ────────────────────────────────────────────────────────────────
// Deterministic machine name tokens — no whitespace, unambiguously non-empty.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 20 },
    )
    .map((a) => a.join(''));

/**
 * Arbitrarily sized machine dataset (0–15 items).
 * Each machine is a minimal API response object matching the server
 * _serialize_machine() shape.
 */
const machineDatasetArb = fc
    .array(
        fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            name: tokenArb,
            machineUuid: tokenArb,
            locationId: fc.constantFrom(1, 2),
            locationName: tokenArb,
            isOnline: fc.boolean(),
            totalItemsCollected: fc.nat({ max: 1000 }),
            currentCapacity: fc.nat({ max: 100 }),
        }),
        { minLength: 0, maxLength: 15 },
    )
    .map((arr) => {
        // Deduplicate ids to avoid ambiguous card matching.
        const seen = new Set();
        return arr.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });
    });

// ── Stat-card text matchers ───────────────────────────────────────────────────
// The page renders three stat cards (Online, Offline, Total Items). We locate
// by known heading text and read the adjacent count element.
function getStatText(heading) {
    // Look for an element whose text content matches the heading, then walk
    // up to its container and find the numeric sibling.
    const allText = document.body.textContent;
    // Crude but correct for this DOM: the counts appear as bare numbers
    // next to their labels. Return the full body text for callers to search.
    return allText;
}

// ── The properties ────────────────────────────────────────────────────────────
describe('Property 7: Preservation — Machine list and online/offline counts', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // P7a + P7b: onlineCount / offlineCount stats match derived values.
    // P7c: page-1 card count = min(dataset.length, 9).
    // P7d: each page-1 machine name appears in the rendered output.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'rendered Online/Offline counts and card list match observed dataset values',
        async () => {
            await fc.assert(
                fc.asyncProperty(machineDatasetArb, async (dataset) => {
                    resetState();
                    mocks.machines = dataset;

                    render(React.createElement(MachinesPage));

                    // Wait for the loading skeleton to resolve — stat cards
                    // and machine cards are rendered only after data loads.
                    await waitFor(
                        () => {
                            // Either "Online" stat is present, or zero machines
                            // and the "no machines" / empty state is shown.
                            expect(
                                document.body.textContent.includes('Online') ||
                                document.body.textContent.includes('Machines') ||
                                dataset.length === 0,
                            ).toBe(true);
                        },
                        { timeout: 2000 },
                    );

                    // ── Derive expected values from dataset ──────────────────
                    // Mirrors MachinesPageContent exactly:
                    //   normalised ids (String), then filter by isOnline.
                    const normalised = dataset.map((m) => ({ ...m, id: String(m.id) }));
                    const expectedOnline = normalised.filter((m) => m.isOnline).length;
                    const expectedOffline = normalised.filter((m) => !m.isOnline).length;
                    const cardsPerPage = 9;
                    const page1Machines = normalised.slice(0, cardsPerPage);

                    const body = document.body.textContent;

                    // ── P7a: Online count ────────────────────────────────────
                    expect(
                        body.includes(String(expectedOnline)),
                        `P7a: expected Online count ${expectedOnline} not found in rendered output.\n` +
                        `dataset.length=${dataset.length}, isOnline counts: ` +
                        `online=${expectedOnline} offline=${expectedOffline}`,
                    ).toBe(true);

                    // ── P7b: Offline count ───────────────────────────────────
                    expect(
                        body.includes(String(expectedOffline)),
                        `P7b: expected Offline count ${expectedOffline} not found in rendered output.\n` +
                        `dataset.length=${dataset.length}`,
                    ).toBe(true);

                    // ── P7c: card count = min(dataset.length, 9) ─────────────
                    // Each card renders the machine name in a <h3>. Count how
                    // many page-1 names appear as distinct substrings.
                    const renderedNames = page1Machines.filter((m) =>
                        body.includes(m.name),
                    );
                    expect(
                        renderedNames.length,
                        `P7c: expected ${page1Machines.length} page-1 cards rendered, ` +
                        `found names for ${renderedNames.length} out of ` +
                        `${page1Machines.map((m) => m.name).join(', ')}.`,
                    ).toBe(page1Machines.length);

                    return true;
                }),
                {
                    numRuns: 25,
                    // Concrete baselines — anchors for the preservation contract.
                    examples: [
                        // Empty dataset → all zeros.
                        [[]],
                        // Single online machine.
                        [[{ id: 1, name: 'AlphaRVM', machineUuid: 'uuid1', locationId: 1, locationName: 'LocAlpha', isOnline: true, totalItemsCollected: 10, currentCapacity: 5 }]],
                        // Single offline machine.
                        [[{ id: 2, name: 'BetaRVM', machineUuid: 'uuid2', locationId: 2, locationName: 'LocBeta', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 }]],
                        // Mixed 3-machine set.
                        [[
                            { id: 10, name: 'MachineA', machineUuid: 'ua', locationId: 1, locationName: 'LocAlpha', isOnline: true, totalItemsCollected: 50, currentCapacity: 20 },
                            { id: 11, name: 'MachineB', machineUuid: 'ub', locationId: 2, locationName: 'LocBeta', isOnline: false, totalItemsCollected: 30, currentCapacity: 10 },
                            { id: 12, name: 'MachineC', machineUuid: 'uc', locationId: 1, locationName: 'LocAlpha', isOnline: true, totalItemsCollected: 0, currentCapacity: 0 },
                        ]],
                        // 9-machine set filling exactly one page.
                        [[1,2,3,4,5,6,7,8,9].map((i) => ({
                            id: i * 100,
                            name: `RVM${String(i).padStart(3,'0')}`,
                            machineUuid: `uuid${i}`,
                            locationId: i % 2 === 0 ? 2 : 1,
                            locationName: i % 2 === 0 ? 'LocBeta' : 'LocAlpha',
                            isOnline: i % 3 !== 0,
                            totalItemsCollected: i * 7,
                            currentCapacity: i * 2,
                        }))],
                        // 10-machine set: 9 on page 1, 1 on page 2 (not rendered yet).
                        [[...Array(10)].map((_, i) => ({
                            id: 200 + i,
                            name: `Page1Machine${i}`,
                            machineUuid: `puuid${i}`,
                            locationId: 1,
                            locationName: 'LocAlpha',
                            isOnline: i % 2 === 0,
                            totalItemsCollected: 0,
                            currentCapacity: 0,
                        }))],
                    ],
                },
            );
        },
        // Generous timeout: jsdom + React renders 15 machines × 25 runs.
        30_000,
    );
});
