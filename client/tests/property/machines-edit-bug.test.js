/**
 * Property 2: Bug Condition — Edit Machine Does Not Persist (C2).
 *
 * Bugfix spec: admin-dashboard-fixes (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on UNFIXED code. A failing run is the
 * SUCCESS case here: it proves the C2 bug exists. The SAME test encodes the
 * expected post-fix behavior and validates the fix once the Edit modal
 * submits a server-schema-clean payload and the card reflects the change.
 *
 * Root cause being surfaced (two compounding defects, mirroring C1):
 *   1. `EditMachineModal.validateForm()` calls
 *      `validateAll(VALIDATION_RULES.machine, formData)`, and the `machine`
 *      rule marks `machineUuid` as REQUIRED — but the modal's `formData`
 *      holds ONLY { name, locationId, locationName, isOnline }; there is no
 *      `machineUuid` field. So `validateForm()` ALWAYS returns false and
 *      `handleSubmit` never calls `onSubmit` → `handleEditMachine` →
 *      `machinesApi.update(id, data)` is NEVER invoked. The change is lost.
 *   2. Even if it submitted, `handleEditMachine` sends a payload carrying
 *      `locationId`, a key the server's strict `MachineUpdateSchema`
 *      (`extra='forbid'`, allowed: name / locationName / isOnline /
 *      isCapacityFull) rejects with HTTP 400.
 *
 * Scoped PBT slice (the concrete `isBugCondition` slice from design):
 *   admin opens Edit Machine on an existing machine, CHANGES the name field,
 *   and saves. For all changed values, `machinesApi.update(id, data)` MUST be
 *   invoked with a schema-clean payload carrying the changed value, and the
 *   card MUST reflect the new value.
 *
 * Validates: Requirements 1.2
 *
 * Run via:  npx vitest run tests/property/machines-edit-bug.test.js
 */
import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Fixtures ───────────────────────────────────────────────────────────────
const LOCATIONS = [
    { id: 101, name: 'OrgAlpha' },
    { id: 202, name: 'OrgBeta' },
    { id: 303, name: 'OrgGamma' },
];

// The single existing machine the admin will edit.
const SEED_MACHINE = {
    id: 7001,
    name: 'OrigMachine',
    machineUuid: 'RVM-SEED01',
    locationName: 'OldArea',
    locationId: 101,
    isOnline: true,
    totalItemsCollected: 0,
    currentCapacity: 0,
};

// Keys the strict server MachineUpdateSchema accepts. Any other key →
// HTTP 400 UNKNOWN_FIELD (extra='forbid'). Note: locationId is NOT allowed.
const ALLOWED_KEYS = new Set(['name', 'locationName', 'isOnline', 'isCapacityFull']);

// ── Hoisted mock state ───────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    updateCalls: [],
}));

class ApiError extends Error {}

// Strict server stub for PUT /machines/:id: mirrors MachineUpdateSchema
// (extra='forbid'). Rejects extra keys, echoes the merged machine on a
// clean payload.
async function strictUpdate(id, payload) {
    mocks.updateCalls.push({ id, payload });
    const extra = Object.keys(payload).filter((k) => !ALLOWED_KEYS.has(k));
    if (extra.length) throw new ApiError(`UNKNOWN_FIELD: ${extra.join(',')}`);
    return {
        id,
        name: payload.name,
        machineUuid: SEED_MACHINE.machineUuid,
        locationName: payload.locationName,
        locationId: SEED_MACHINE.locationId,
        isOnline: payload.isOnline !== undefined ? payload.isOnline : true,
        totalItemsCollected: 0,
        currentCapacity: 0,
    };
}

vi.mock('../../src/services/api', () => ({
    machines: {
        getAll: async () => [{ ...SEED_MACHINE }],
        create: async (data) => ({ id: 9999, ...data }),
        update: (id, data) => strictUpdate(id, data),
    },
    logs: {
        getMachines: async () => [],
        createMachineLog: async () => ({}),
    },
    users: {
        getAll: async () => [],
    },
}));

// Superadmin viewing all locations (the C2 reporter context).
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
    mocks.updateCalls.length = 0;
}

beforeEach(resetState);

// ── Generators ───────────────────────────────────────────────────────────────
// Pure alphanumeric tokens: trim() === self, always non-empty, ≤200 chars —
// unambiguously VALID new values for the Machine Name field. Prefixed with
// "Edited" so the new name is always distinct from the seed machine name.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 24 },
    )
    .map((a) => 'Edited' + a.join(''));

// ── Driver ───────────────────────────────────────────────────────────────────
// Renders the page, waits for the existing machine card, opens the Edit modal,
// changes the Machine Name to `newName`, and submits.
async function editMachineName(newName) {
    render(React.createElement(MachinesPage));

    // Wait for the seeded machine card to render (data finished loading).
    await screen.findByText(SEED_MACHINE.name);

    // Open the Edit Machine modal (icon button, title="Edit Machine").
    fireEvent.click(screen.getByTitle('Edit Machine'));

    // Change the Machine Name field to the new value.
    const nameInput = await screen.findByPlaceholderText('e.g., RVM Alpha-02');
    fireEvent.change(nameInput, { target: { value: newName } });

    // Submit the modal form.
    const form = document.querySelector('form');
    fireEvent.submit(form);
}

// ── The property ───────────────────────────────────────────────────────────
describe('Property 2: Bug Condition — Edit Machine does not persist (C2)', () => {
    test('every changed Edit Machine save invokes machinesApi.update with a schema-clean payload carrying the change and the card reflects it', async () => {
        await fc.assert(
            fc.asyncProperty(tokenArb, async (newName) => {
                resetState();
                await editMachineName(newName);

                const ctx = `newName=${JSON.stringify(newName)}`;

                // (1) machinesApi.update MUST have been invoked exactly once.
                expect(
                    mocks.updateCalls.length,
                    `${ctx}: machinesApi.update was never called — the form never ` +
                    `reached handleEditMachine (validateForm blocked on missing machineUuid)`,
                ).toBe(1);

                // (2) The payload MUST carry the changed name and conform to the
                //     strict server schema (no extra keys such as locationId).
                const { id, payload } = mocks.updateCalls[0];
                expect(
                    String(id),
                    `${ctx}: update called with wrong machine id (${JSON.stringify(id)})`,
                ).toBe(String(SEED_MACHINE.id));
                expect(
                    payload.name,
                    `${ctx}: update payload did not carry the changed name`,
                ).toBe(newName);
                const extra = Object.keys(payload).filter((k) => !ALLOWED_KEYS.has(k));
                expect(
                    extra,
                    `${ctx}: update payload carried server-forbidden keys ${JSON.stringify(extra)}`,
                ).toEqual([]);

                // (3) The card MUST reflect the updated name.
                await waitFor(
                    () => {
                        expect(document.body.textContent.includes(newName)).toBe(true);
                    },
                    { timeout: 1000 },
                );

                return true;
            }),
            {
                numRuns: 12,
                examples: [['EditedrvmAlpha02']],
            },
        );
    });
});
