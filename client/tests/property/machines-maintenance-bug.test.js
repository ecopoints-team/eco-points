/**
 * Property 3: Bug Condition — Maintenance Log Not Created (C3).
 *
 * Bugfix spec: admin-dashboard-fixes (exploratory bug-condition checking).
 *
 * EXPLORATION TEST — EXPECTED TO FAIL on UNFIXED code. A failing run is the
 * SUCCESS case here: it proves the C3 bug exists. The SAME test encodes the
 * expected post-fix behavior and validates the fix once the Maintenance modal
 * submits a server-schema-clean payload and the log is created.
 *
 * Root cause being surfaced (payload shape mismatch, mirroring C1/C2):
 *   `handleAddMaintenanceLog` (app/admin/machines/page.js:696) builds the
 *   POST /logs/machines body as:
 *       { rvmId, technicianId, actionType, resolved, notes }
 *   But the server's strict `MachineLogCreateSchema` (`_StrictModel`,
 *   extra='forbid') accepts ONLY { rvmId, actionType, status, notes }.
 *   The keys `technicianId` and `resolved` are FORBIDDEN → the server rejects
 *   the request with HTTP 400 UNKNOWN_FIELD, the catch block fires an
 *   `alert(...)`, and NO maintenance log is ever created. (`resolved` should
 *   be mapped to `status`; `technicianId` should be dropped — the server uses
 *   `current_user.id` as `performed_by_id`.)
 *
 * Scoped PBT slice (the concrete `isBugCondition` slice from design):
 *   admin opens the Maintenance modal on an existing machine, selects a
 *   technician, types an Action Description, and submits. For all valid
 *   { technicianId, actionType, notes }, `logs.createMachineLog` MUST be
 *   invoked with a schema-clean payload and a maintenance log MUST be created.
 *
 * Validates: Requirements 1.3
 *
 * Run via:  npx vitest run tests/property/machines-maintenance-bug.test.js
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

// The single existing machine the admin will log maintenance against.
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

// Active technicians the modal offers in its Technician dropdown. The modal
// filters usersApi.getAll() to `u.role === 'technician' && u.isActive`.
const TECHNICIANS = [
    { id: 8001, name: 'TechAda', role: 'technician', isActive: true },
    { id: 8002, name: 'TechBoris', role: 'technician', isActive: true },
];
const TECH_BY_ID = Object.fromEntries(TECHNICIANS.map((t) => [t.id, t]));

// Keys the strict server MachineLogCreateSchema accepts. Any other key →
// HTTP 400 UNKNOWN_FIELD (extra='forbid'). Note: `technicianId` and
// `resolved` are NOT allowed — the C3 client payload sends both.
const ALLOWED_KEYS = new Set(['rvmId', 'actionType', 'status', 'notes']);

// ── Hoisted mock state ───────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
    createCalls: [],
    createdLogs: [],
    nextId: 9000,
}));

class ApiError extends Error {}

// Strict server stub for POST /logs/machines: mirrors MachineLogCreateSchema
// (extra='forbid'). Rejects extra keys, records a created log on a clean
// payload only.
async function strictCreateMachineLog(payload) {
    mocks.createCalls.push(payload);
    const extra = Object.keys(payload).filter((k) => !ALLOWED_KEYS.has(k));
    if (extra.length) throw new ApiError(`UNKNOWN_FIELD: ${extra.join(',')}`);
    const log = {
        id: mocks.nextId++,
        rvmId: payload.rvmId,
        actionType: payload.actionType,
        status: payload.status || 'Pending',
        notes: payload.notes || '',
    };
    mocks.createdLogs.push(log);
    return log;
}

vi.mock('../../src/services/api', () => ({
    machines: {
        getAll: async () => [{ ...SEED_MACHINE }],
        create: async (data) => ({ id: 9999, ...data }),
        update: async (id, data) => ({ id, ...data }),
    },
    logs: {
        // Reflect created logs back so the modal's reload can render them.
        getMachines: async () => [...mocks.createdLogs],
        createMachineLog: (data) => strictCreateMachineLog(data),
    },
    users: {
        getAll: async () => [...TECHNICIANS],
    },
}));

// Superadmin viewing all locations (the C3 reporter context).
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
    // `handleAddMaintenanceLog` calls `alert(...)` on failure; jsdom does not
    // implement it. Stub so the catch path is observable without throwing.
    globalThis.alert = () => {};
    if (globalThis.window) globalThis.window.alert = () => {};
});

function resetState() {
    cleanup();
    mocks.createCalls.length = 0;
    mocks.createdLogs.length = 0;
}

beforeEach(resetState);

// ── Generators ───────────────────────────────────────────────────────────────
// Pure alphanumeric tokens: trim() === self, always non-empty — unambiguously
// VALID values for the free-text Action Description / Notes fields.
const tokenArb = fc
    .array(
        fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
        ),
        { minLength: 1, maxLength: 24 },
    )
    .map((a) => a.join(''));

const actionArb = tokenArb.map((s) => 'Action' + s);
const techIdArb = fc.constantFrom(...TECHNICIANS.map((t) => t.id));

// ── Driver ───────────────────────────────────────────────────────────────────
// Renders the page, opens the Maintenance modal on the seeded machine,
// reveals the add form, selects a technician, types an action, and submits.
async function submitMaintenanceLog(techId, action) {
    render(React.createElement(MachinesPage));

    // Wait for the seeded machine card (data finished loading), then open the
    // Maintenance modal via the card's "Maintenance" button.
    await screen.findByText(SEED_MACHINE.name);
    fireEvent.click(screen.getByRole('button', { name: 'Maintenance' }));

    // Reveal the "New Maintenance Entry" form.
    fireEvent.click(await screen.findByRole('button', { name: 'Add New Maintenance Log' }));

    // Open the Technician dropdown and pick the technician. The technician
    // option is loaded asynchronously, so wait for it to appear.
    fireEvent.click(screen.getByRole('button', { name: 'Select technician...' }));
    const techOption = await screen.findByRole('button', { name: TECH_BY_ID[techId].name });
    fireEvent.click(techOption);

    // Type the Action Description.
    fireEvent.change(screen.getByPlaceholderText('e.g., Sensor Replacement'), {
        target: { value: action },
    });

    // Submit the entry ("Save Entry" button → handleSubmit → onAddLog).
    fireEvent.click(screen.getByRole('button', { name: 'Save Entry' }));
}

// ── The property ───────────────────────────────────────────────────────────
describe('Property 3: Bug Condition — Maintenance log not created (C3)', () => {
    test('every valid Maintenance submission invokes logs.createMachineLog with a schema-clean payload and creates a log', async () => {
        await fc.assert(
            fc.asyncProperty(techIdArb, actionArb, async (techId, action) => {
                resetState();
                await submitMaintenanceLog(techId, action);

                const ctx = `inputs technicianId=${techId} actionType=${JSON.stringify(action)}`;

                // (1) logs.createMachineLog MUST have been invoked exactly once.
                await waitFor(
                    () => {
                        expect(
                            mocks.createCalls.length,
                            `${ctx}: logs.createMachineLog was never called — ` +
                            `the Maintenance modal did not reach handleAddMaintenanceLog`,
                        ).toBe(1);
                    },
                    { timeout: 1000 },
                );

                // (2) The payload MUST conform to the strict server schema —
                //     no server-forbidden keys such as `technicianId` / `resolved`.
                const payload = mocks.createCalls[0];
                const extra = Object.keys(payload).filter((k) => !ALLOWED_KEYS.has(k));
                expect(
                    extra,
                    `${ctx}: createMachineLog payload carried server-forbidden keys ` +
                    `${JSON.stringify(extra)} (allowed: ${[...ALLOWED_KEYS].join(',')})`,
                ).toEqual([]);
                expect(
                    payload.actionType,
                    `${ctx}: payload did not carry the submitted actionType`,
                ).toBe(action);
                expect(
                    String(payload.rvmId),
                    `${ctx}: payload targeted the wrong machine`,
                ).toBe(String(SEED_MACHINE.id));

                // (3) A maintenance log MUST have been created server-side
                //     (the strict stub only records a log on a clean payload).
                expect(
                    mocks.createdLogs.length,
                    `${ctx}: no maintenance log was created — the strict server ` +
                    `rejected the payload`,
                ).toBe(1);

                return true;
            }),
            {
                numRuns: 12,
                examples: [[8001, 'ActionSensorReplacement']],
            },
        );
    });
});
