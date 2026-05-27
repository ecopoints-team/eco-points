/**
 * Groups API module — endpoints under `/api/web/groups/*` (community groups).
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

/** GET /api/web/groups — list community groups (location-scoped). */
export async function getAll(locationId = null) {
    const data = await request('GET', withQuery('/groups', { location_id: locationId }));
    return data.groups;
}

/** POST /api/web/groups — create community group. */
export async function create(groupData) {
    const data = await request('POST', '/groups', { body: groupData });
    return data.group;
}

/** PUT /api/web/groups/:id — update community group. */
export async function update(id, groupData) {
    const data = await request('PUT', `/groups/${id}`, { body: groupData });
    return data.group;
}

/** DELETE /api/web/groups/:id — delete group (blocked if it has users). */
async function deleteGroup(id) {
    return await request('DELETE', `/groups/${id}`);
}
export { deleteGroup as delete };
