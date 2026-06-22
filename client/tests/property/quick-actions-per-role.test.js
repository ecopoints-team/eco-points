import { describe, it, expect } from 'vitest';
import { QUICK_ACTIONS } from '../../src/data/quickActions';

describe('Quick actions per role', () => {
    it('matches the QA spec for each admin role', () => {
        const labels = (role) => QUICK_ACTIONS[role].map(a => a.label);

        expect(labels('head_admin')).toEqual(['Rewards', 'Manage Users', 'Machines', 'Admin Logs']);
        expect(labels('auditor')).toEqual(['User Management', 'Analytics', 'System Logs', 'Bulk Sessions']);
        expect(labels('inventory_officer')).toEqual(['Rewards Inventory', 'Bulk Sessions', 'System Logs']);
        expect(labels('technician')).toEqual(['Machines', 'Bulk Sessions', 'Session Logs']);
    });

    it('every action carries an href and a [category, verb] permission tuple', () => {
        for (const role of Object.keys(QUICK_ACTIONS)) {
            for (const action of QUICK_ACTIONS[role]) {
                expect(typeof action.href).toBe('string');
                expect(action.href.startsWith('/admin/')).toBe(true);
                expect(Array.isArray(action.permission)).toBe(true);
                expect(action.permission).toHaveLength(2);
            }
        }
    });
});
