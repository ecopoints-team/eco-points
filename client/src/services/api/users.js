/**
 * Users API module — endpoints under `/api/web/users/*`.
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

/**
 * GET /api/web/users — list users.
 * Filters: `locationId`, `role`, `userType`, `isAdmin`.
 */
export async function getAll({ locationId, role, userType, isAdmin, perPage = 200 } = {}) {
    const data = await request('GET', withQuery('/users', {
        location_id: locationId,
        role,
        user_type: userType,
        is_admin: isAdmin,
        per_page: perPage,
    }));
    return data.users;
}

/** GET /api/web/users/:id — fetch a single user. */
export async function getById(id) {
    const data = await request('GET', `/users/${id}`);
    return data.user;
}

/** POST /api/web/users — create a regular or admin user. */
export async function create(userData) {
    const data = await request('POST', '/users', { body: userData });
    return data.user;
}

/** PUT /api/web/users/:id — update a user record. */
export async function update(id, userData) {
    const data = await request('PUT', `/users/${id}`, { body: userData });
    return data.user;
}

/** DELETE /api/web/users/:id — soft-delete (sets is_active=false). */
async function deleteUser(id) {
    return await request('DELETE', `/users/${id}`);
}
// `delete` is a reserved word, so the function is declared as `deleteUser`
// and re-exported under the legacy `delete` name for mechanical drop-in
// compatibility with the legacy `users.delete(id)` call shape.
export { deleteUser as delete };

/** POST /api/web/users/:id/adjust-points — manual points adjustment. */
export async function adjustPoints(id, { amount, reason }) {
    return await request('POST', `/users/${id}/adjust-points`, {
        body: { amount, reason },
    });
}
