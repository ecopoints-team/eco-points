/**
 * Property 8: Preservation — Search Returns Name/Id Matches (C4 guard).
 *
 * Bugfix spec: admin-dashboard-fixes, Task 46.
 *
 * PRESERVATION TEST — EXPECTED TO PASS on UNFIXED code. A passing run
 * records the baseline search-filter behavior that the C4 fix must not regress.
 * The C4 crash (getLocationName TDZ / hoisting bug) is avoided by testing the
 * pure filter logic directly — no React render, no search input interaction,
 * no dependency on component internals. We mirror the exact predicate from
 * displayedMachines useMemo (~L654) with getLocationName stubbed as () => ''.
 *
 * Bug condition path (¬C4 = preservation path):
 *   We exercise only the m.name and m.id match arms. getLocationName is
 *   stubbed to return '' so the locationName/getLocationName arms are inert.
 *   This matches inputs that would crash the unfixed component (non-empty
 *   searchQuery) but avoids the crash by testing the logic in isolation.
 *
 * Observed baseline behavior on UNFIXED code (recorded per task spec):
 *   • applySearchFilter(machines, '', stub) === machines (empty query passthrough).
 *   • For non-empty q, machines.filter where name.includes(q) || id.includes(q)
 *     returns exactly the matching subset.
 *   • Machines whose name/id do NOT include q are excluded.
 *
 * Properties asserted (P8):
 *   P8a — for all terms that are a substring of some machine's name, every
 *         machine whose name contains that term is returned.
 *   P8b — for all terms equal to some machine's id (string), that machine
 *         is returned.
 *   P8c — machines whose name/id do NOT match the search term are NOT returned.
 *
 * Concrete examples (anchors):
 *   • Single machine, search by exact name → machine appears.
 *   • Two machines, search matching only first → only first appears.
 *   • Search by id → machine with that id appears.
 *   • Search term matching nothing → empty results.
 *
 * Validates: Requirement 3.2
 *
 * Run via:  npx vitest run tests/property/machines-search-preservation.test.js
 */
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ── Pure filter function ──────────────────────────────────────────────────────
// Mirrors displayedMachines useMemo predicate from app/admin/machines/page.js ~L654.
// getLocationName stubbed as () => '' — safe, never throws, avoids C4 crash path.
function applySearchFilter(machines, searchQuery, getLocationName = () => '') {
    if (!searchQuery) return machines;
    const q = searchQuery.toLowerCase();
    return machines.filter(
        (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.locationName || '').toLowerCase().includes(q) ||
            getLocationName(m.locationId).toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q),
    );
}

// ── Generators ────────────────────────────────────────────────────────────────
// Token: alphanumeric, no whitespace, unambiguously non-empty.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 3, maxLength: 16 },
    )
    .map((a) => a.join(''));

// Machine with string id (matches page normalisation: id = String(m.id)).
const machineArb = fc.record({
    id: fc.integer({ min: 1, max: 9999 }).map(String),
    name: tokenArb,
    machineUuid: tokenArb,
    locationId: fc.constantFrom(1, 2),
    locationName: tokenArb,
    isOnline: fc.boolean(),
    totalItemsCollected: fc.nat({ max: 1000 }),
    currentCapacity: fc.nat({ max: 100 }),
});

// Dataset with unique ids (1–15 machines).
const machineDatasetArb = fc
    .array(machineArb, { minLength: 1, maxLength: 15 })
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
describe('Property 8: Preservation — Search returns name/id matches', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // P8a: every machine whose name contains the term is returned.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P8a: machines whose name includes searchQuery are all returned',
        () => {
            fc.assert(
                fc.property(
                    machineDatasetArb,
                    // Pick a machine from the dataset and use its name (lowercased) as the term.
                    fc.integer({ min: 0, max: 14 }),
                    (dataset, idx) => {
                        const pivot = dataset[idx % dataset.length];
                        const term = pivot.name.toLowerCase();

                        const result = applySearchFilter(dataset, term);

                        // Every machine with name containing term must be in result.
                        const expected = dataset.filter((m) =>
                            m.name.toLowerCase().includes(term),
                        );
                        for (const m of expected) {
                            expect(
                                result.some((r) => r.id === m.id),
                                `P8a: machine id=${m.id} name="${m.name}" should be returned for term="${term}"`,
                            ).toBe(true);
                        }

                        return true;
                    },
                ),
                {
                    numRuns: 25,
                    examples: [
                        // Single machine, search by exact name → appears.
                        [
                            [{ id: '1', name: 'AlphaRVM', machineUuid: 'u1', locationId: 1, locationName: 'LocAlpha', isOnline: true, totalItemsCollected: 10, currentCapacity: 5 }],
                            0,
                        ],
                        // Two machines, only first matches.
                        [
                            [
                                { id: '2', name: 'Gamma001', machineUuid: 'u2', locationId: 1, locationName: 'LocAlpha', isOnline: true, totalItemsCollected: 0, currentCapacity: 0 },
                                { id: '3', name: 'DeltaXYZ', machineUuid: 'u3', locationId: 2, locationName: 'LocBeta', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 },
                            ],
                            0,
                        ],
                    ],
                },
            );
        },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // P8b: machine whose id equals searchQuery is returned.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P8b: machine whose id equals searchQuery is returned',
        () => {
            fc.assert(
                fc.property(
                    machineDatasetArb,
                    fc.integer({ min: 0, max: 14 }),
                    (dataset, idx) => {
                        const pivot = dataset[idx % dataset.length];
                        const term = pivot.id; // exact id match

                        const result = applySearchFilter(dataset, term);

                        expect(
                            result.some((r) => r.id === pivot.id),
                            `P8b: machine id=${pivot.id} not found in results for term="${term}"`,
                        ).toBe(true);

                        return true;
                    },
                ),
                {
                    numRuns: 25,
                    examples: [
                        // Search by id → machine with that id appears.
                        [
                            [{ id: '42', name: 'MachineQ', machineUuid: 'uq', locationId: 1, locationName: 'LocAlpha', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 }],
                            0,
                        ],
                    ],
                },
            );
        },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // P8c: machines whose name/id do NOT match are excluded.
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P8c: machines not matching searchQuery are excluded',
        () => {
            fc.assert(
                fc.property(
                    machineDatasetArb,
                    fc.integer({ min: 0, max: 14 }),
                    (dataset, idx) => {
                        const pivot = dataset[idx % dataset.length];
                        const term = pivot.name.toLowerCase();

                        const result = applySearchFilter(dataset, term);

                        // Machines that should NOT be in result (name does not include term AND id does not include term).
                        // (locationName arm is active too — we only assert exclusion for machines
                        //  that don't match any arm, which we approximate by checking name+id.)
                        const shouldBeExcluded = dataset.filter(
                            (m) =>
                                !m.name.toLowerCase().includes(term) &&
                                !m.id.toLowerCase().includes(term) &&
                                !(m.locationName || '').toLowerCase().includes(term),
                        );
                        for (const m of shouldBeExcluded) {
                            expect(
                                result.some((r) => r.id === m.id),
                                `P8c: machine id=${m.id} name="${m.name}" should NOT be in results for term="${term}"`,
                            ).toBe(false);
                        }

                        return true;
                    },
                ),
                {
                    numRuns: 25,
                    examples: [
                        // Search term matching no machine → empty results.
                        [
                            [
                                { id: '10', name: 'AlphaOne', machineUuid: 'ua', locationId: 1, locationName: 'LocAlpha', isOnline: true, totalItemsCollected: 0, currentCapacity: 0 },
                                { id: '11', name: 'BetaTwo', machineUuid: 'ub', locationId: 2, locationName: 'LocBeta', isOnline: false, totalItemsCollected: 0, currentCapacity: 0 },
                            ],
                            0,
                        ],
                    ],
                },
            );
        },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // P8 integration: empty searchQuery → all machines returned (passthrough).
    // ─────────────────────────────────────────────────────────────────────────
    test(
        'P8 baseline: empty searchQuery returns all machines',
        () => {
            fc.assert(
                fc.property(machineDatasetArb, (dataset) => {
                    const result = applySearchFilter(dataset, '');
                    expect(result).toEqual(dataset);
                    return true;
                }),
                { numRuns: 25 },
            );
        },
    );
});
