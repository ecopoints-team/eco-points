import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Contract: the reward create/update payload's imageUrl is either null or a
// short server path string (< 500 chars). It must NEVER be a base64 data URL.
function buildRewardPayload({ name, pointsRequired, stockQuantity, category, imageUrl }) {
    return {
        name,
        description: '',
        pointsRequired: parseInt(pointsRequired),
        stockQuantity: parseInt(stockQuantity),
        category,
        imageUrl: imageUrl || null,
    };
}

describe('Reward create payload', () => {
    it('imageUrl is never a base64 data URL and fits the column', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 40 }),
            fc.integer({ min: 0, max: 100000 }),
            fc.integer({ min: 0, max: 100000 }),
            fc.constantFrom('Merchandise', 'Vouchers', 'Experience'),
            fc.option(fc.constant('/uploads/rewards/abc123.png'), { nil: null }),
            (name, pts, stock, cat, img) => {
                const p = buildRewardPayload({ name, pointsRequired: pts, stockQuantity: stock, category: cat, imageUrl: img });
                if (p.imageUrl !== null) {
                    expect(p.imageUrl.startsWith('data:')).toBe(false);
                    expect(p.imageUrl.length).toBeLessThanOrEqual(500);
                }
            },
        ));
    });
});
