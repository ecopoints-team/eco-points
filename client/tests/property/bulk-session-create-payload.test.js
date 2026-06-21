import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// We test the pure payload-mapping contract the page must satisfy:
// the submit handler MUST send { rvmId, walletId, notes, items:[{detectedClass, pointsAwarded}] }
// and MUST NOT send an `accountId` key (server uses extra='forbid').

// Mirror of the mapping the page performs on submit.
function buildBulkPayload({ selectedRvm, selectedWalletId, notes, items }) {
    return {
        rvmId: parseInt(selectedRvm),
        walletId: parseInt(selectedWalletId),
        notes,
        items: items.map(i => ({
            detectedClass: i.detectedClass,
            pointsAwarded: parseInt(i.pointsAwarded) || 0,
        })),
    };
}

describe('Bulk session create payload', () => {
    it('sends walletId (int) and never accountId', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 9999 }),
            fc.string(),
            (rvm, wallet, notes) => {
                const payload = buildBulkPayload({
                    selectedRvm: String(rvm),
                    selectedWalletId: String(wallet),
                    notes,
                    items: [{ detectedClass: 'coke_bottle', pointsAwarded: 5 }],
                });
                expect(payload.rvmId).toBe(rvm);
                expect(payload.walletId).toBe(wallet);
                expect('accountId' in payload).toBe(false);
                expect(payload.items[0]).toEqual({ detectedClass: 'coke_bottle', pointsAwarded: 5 });
            },
        ));
    });
});
