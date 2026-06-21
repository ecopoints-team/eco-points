import { describe, it, expect } from 'vitest';

// Pure permission resolver the AuthContext must implement: read verbs from
// the server-provided `permissions` object, falling back to deny.
function makeHasPermission(serverPermissions) {
    return (module, action) =>
        Array.isArray(serverPermissions?.[module]) &&
        serverPermissions[module].includes(action);
}

describe('server-driven hasPermission', () => {
    const auditor = {
        dashboard: ['view'],
        users: ['view'],
        machines: ['view'],
        rewards: ['view'],
        analytics: ['view'],
        sessions: ['create', 'view'],
        logs: ['export', 'view'],
        settings: ['view'],
    };

    it('grants auditor view but denies edit on users', () => {
        const can = makeHasPermission(auditor);
        expect(can('users', 'view')).toBe(true);
        expect(can('users', 'edit')).toBe(false);
    });

    it('grants auditor logs export', () => {
        expect(makeHasPermission(auditor)('logs', 'export')).toBe(true);
    });

    it('denies an unknown module', () => {
        expect(makeHasPermission(auditor)('locations', 'view')).toBe(false);
    });
});
