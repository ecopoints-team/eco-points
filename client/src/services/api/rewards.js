/**
 * Rewards API module — endpoints under `/api/web/rewards/*`.
 *
 * Phase 1 — Requirements 1.3, 1.9
 */
import { request } from './client';

function withQuery(path, params) {
    if (!params) return path;
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== null && v !== undefined) usp.append(k, v);
    }
    const qs = usp.toString();
    return qs ? `${path}?${qs}` : path;
}

/** GET /api/web/rewards — list rewards (location-scoped, paginated). */
export async function getAll(locationId = null) {
    const data = await request('GET', withQuery('/rewards', { location_id: locationId }));
    return data.rewards;
}

/** POST /api/web/rewards — create reward + default variant. */
export async function create(rewardData) {
    const data = await request('POST', '/rewards', { body: rewardData });
    return data.reward;
}

/** PUT /api/web/rewards/:id — update reward (triggers stock alerts). */
export async function update(id, rewardData) {
    const data = await request('PUT', `/rewards/${id}`, { body: rewardData });
    return data.reward;
}

/** DELETE /api/web/rewards/:id — deactivate reward (soft-delete). */
async function deleteReward(id) {
    return await request('DELETE', `/rewards/${id}`);
}
export { deleteReward as delete };

/** POST /api/web/rewards/:id/redeem — redeem a reward for the current user. */
export async function redeem(rewardId, { variantId = null, quantity = 1 } = {}) {
    const data = await request('POST', `/rewards/${rewardId}/redeem`, {
        body: { variantId, quantity },
    });
    return data.redemption;
}

/** GET /api/web/rewards/my-redemptions — list current user's redemptions. */
export async function getMyRedemptions() {
    const data = await request('GET', '/rewards/my-redemptions');
    return data.redemptions;
}

// ── Task 29: Shared Merchandise — Reward Organization Assignment ─────

/** POST /api/web/rewards/:id/assign — assign reward to additional orgs (superadmin). */
export async function assign(rewardId, organizationIds) {
    return await request('POST', `/rewards/${rewardId}/assign`, {
        body: { organizationIds },
    });
}

/** DELETE /api/web/rewards/:id/assign/:orgId — remove org assignment (superadmin). */
export async function unassign(rewardId, orgId) {
    return await request('DELETE', `/rewards/${rewardId}/assign/${orgId}`);
}

/** GET /api/web/rewards/:id/assignments — list assigned orgs (superadmin). */
export async function getAssignments(rewardId) {
    const data = await request('GET', `/rewards/${rewardId}/assignments`);
    return data;
}

/**
 * Upload a reward image file. Returns the short server URL string
 * (e.g. "/uploads/rewards/ab12.png") to store in reward.imageUrl.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadImage(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await request('POST', '/rewards/image', { body: form });
    return res.imageUrl;
}
