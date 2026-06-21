/**
 * Property 1: Bug Condition — Add Machine Does Not Persist (C1).
 *
 * Bugfix spec: admin-dashboard-fixes (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on UNFIXED code. A failing run is the
 * SUCCESS case here: it proves the C1 bug exists. The SAME test encodes the
 * expected post-fix behavior and validates the fix once the modal submits a
 * server-schema-clean payload and a new card renders.
 *
 * Root cause being surfaced (two compounding defects):
 *   1. `AddMachineModal.validateForm()` calls
 *      `validateAll(VALIDATION_RULES.machine, formData)`, and the `machine`
 *      rule marks `machineUuid` as REQUIRED — but the modal's `formData` has
 *      no `machineUuid` field (it is generated only AFTER validation passes).
 *      So `validateForm()` ALWAYS returns false and `onSubmit` →
 *      `handleAddMachine` → `machinesApi.create` is NEVER invoked.
 *   2. Even if it submitted, `handleSubmit` builds a payload carrying extra
 *      keys (`id`, `organizationName`, `totalItemsCollected`,
 *      `currentCapacity`, `lastSync`) that the server's strict
 *      `MachineCreateSchema` (`extra='forbid'`) rejects with HTTP 400.
 *
 * Scoped PBT slice (the concrete `isBugCondition` slice from design):
 *   superadmin submits a VALID Add Machine form with concrete payloads
 *   { name, machineUuid, locationName, organizationId(locationId) }.
 *   For all valid inputs, `machinesApi.create` MUST be invoked with a
 *   schema-clean payload and a new machine card MUST appear.
 *
 * Validates: Requirements 1.1
 *
 * Run via:  npx vitest run tests/property/machines-add-bug.test.js
 */
import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Fixtures ───────────────────────────────────────────────────────────────
// Integer ids: the server's strict MachineCreateSchema requires
// locationId: Optional[int] with strict=True (no string coercion).
const LOCATIONS = [
    { id: 101, name: 'OrgAlpha' },
    { id: 202, name: 'OrgBeta' },
    { id: 303, name: 'OrgGamma' },
];
const LOC_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));

// Keys the strict server MachineCreateSchema accepts. Any other key →
// HTTP 400 UNKNOWN_FIELD (extra='forbid').
const ALLOWED_KEYS = new Set(['locationId', 'machineUuid', 'name', 'locationName', 'isOnline']);

// ── Hoisted mock state ───────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    createCalls: [],
    nextId: 5000,
}));

class ApiError extends Error {}

// Strict server stub for POST /machines: mirrors MachineCreateSchema
// (extra='forbid', strict=True). Rejects extra keys / non-int locationId,
// echoes a created machine on a clean payload.
async function strictCreate(payload) {
    mocks.createCalls.push(payload);
    const extra = Object.keys(payload).filter((k) => !ALLOWED_KEYS.has(k));
    if (extra.length) throw new ApiError(`UNKNOWN_FIELD: ${extra.join(',')}`);
    if (!Number.isInteger(payload.locationId)) throw new ApiError('VALIDATION_ERROR: locationId');
    return {
        id: mocks.nextId++,
        name: payload.name,
        machineUuid: payload.machineUuid,
        locationName: payload.locationName,
        locationId: payload.locationId,
        isOnline: payload.isOnline !== undefined ? payload.isOnline : true,
        totalItemsCollected: 0,
        currentCapacity: 0,
    };
}

vi.mock('../../src/services/api', () => ({
    machines: {
        getAll: async () => [],
        create: (data) => strictCreate(data),
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

// Superadmin viewing all locations (the C1 reporter context).
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

// Permission gate + layout chrome → passthrough.
vi.mock('../../src/components/admin/RequirePermission', () => ({
    default: ({ children }) => children,
}));
vi.mock('../../src/components/admin/AdminLayout', () => ({
    ViewOnlyBanner: () => null,
    ViewOnlyWrapper: ({ children }) => children,
}));

// Page under test — imported AFTER vi.mock declarations.
import MachinesPage from '../../app/admin/machines/page.js';

// ── Setup ────────────────────────────────────────────────────────────────────
beforeAll(() => {
    if (!globalThis.crypto) globalThis.crypto = {};
    if (typeof globalThis.crypto.randomUUID !== 'function') {
        globalThis.crypto.randomUUID = () =>
            'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, () =>
                Math.floor(Math.random() * 16).toString(16),
            );
    }
});

function resetState() {
    cleanup();
    mocks.createCalls.length = 0;
}

beforeEach(resetState);

// ── Generators ───────────────────────────────────────────────────────────────
// Pure alphanumeric tokens: trim() === self, always non-empty, ≤200 chars —
// i.e. unambiguously VALID inputs for the Machine Name and Area Placement.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 24 },
    )
    .map((a) => a.join(''));

const locIdArb = fc.constantFrom(...LOCATIONS.map((l) => l.id));

// ── Driver ───────────────────────────────────────────────────────────────────
// Renders the page, opens the Add Machine modal, fills it with valid input,
// selects a location, and submits. Returns an observable snapshot.
async function submitAddMachine(name, area, locId) {
    render(React.createElement(MachinesPage));

    // Header "Add Machine" button (only instance before the modal opens).
    const addBtn = await screen.findByRole('button', { name: 'Add Machine' });
    fireEvent.click(addBtn);

    // Fill the two text inputs.
    fireEvent.change(screen.getByPlaceholderText('e.g., RVM Alpha-02'), {
        target: { value: name },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Main Lobby, Canteen, Library'), {
        target: { value: area },
    });

    // Open the location dropdown and pick the org.
    fireEvent.click(screen.getByText('Select Location'));
    const option = await screen.findByRole('button', { name: LOC_BY_ID[locId].name });
    fireEvent.click(option);

    // Submit the modal form.
    const form = document.querySelector('form');
    fireEvent.submit(form);
}

// ── The property ───────────────────────────────────────────────────────────
describe('Property 1: Bug Condition — Add Machine does not persist (C1)', () => {
    test('every valid Add Machine submission invokes machinesApi.create with a schema-clean payload and renders a new card', async () => {
        await fc.assert(
            fc.asyncProperty(tokenArb, tokenArb, locIdArb, async (name, area, locId) => {
                resetState();
                await submitAddMachine(name, area, locId);

                const ctx =
                    `inputs name=${JSON.stringify(name)} area=${JSON.stringify(area)} ` +
                    `locationId=${locId}`;

                // (1) machinesApi.create MUST have been invoked exactly once.
                expect(
                    mocks.createCalls.length,
                    `${ctx}: machinesApi.create was never called — the form never ` +
                    `reached handleAddMachine (validateForm blocked on missing machineUuid)`,
                ).toBe(1);

                // (2) The payload MUST conform to the strict server schema
                //     (no extra keys; integer locationId).
                const payload = mocks.createCalls[0];
                const extra = Object.keys(payload).filter((k) => !ALLOWED_KEYS.has(k));
                expect(
                    extra,
                    `${ctx}: create payload carried server-forbidden keys ${JSON.stringify(extra)}`,
                ).toEqual([]);
                expect(
                    Number.isInteger(payload.locationId),
                    `${ctx}: create payload locationId is not an integer (${JSON.stringify(payload.locationId)})`,
                ).toBe(true);

                // (3) A new machine card MUST appear with the submitted name.
                await waitFor(
                    () => {
                        expect(document.body.textContent.includes(name)).toBe(true);
                    },
                    { timeout: 1000 },
                );

                return true;
            }),
            {
                numRuns: 12,
                examples: [['rvmAlpha02', 'MainLobby', 101]],
            },
        );
    });
});
