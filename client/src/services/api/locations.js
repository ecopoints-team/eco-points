/**
 * Locations API module — endpoints under `/api/web/locations/*` and
 * `/api/web/org-types/*`.
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

// ── Locations (Organizations) ─────────────────────────────────────────────

/** GET /api/web/locations — list organizations (location-scoped). */
export async function getAll(locationId = null) {
    const data = await request('GET', withQuery('/locations', { location_id: locationId }));
    return data.locations;
}

/** POST /api/web/locations — create new organization. */
export async function create(locationData) {
    const data = await request('POST', '/locations', { body: locationData });
    return data.location;
}

/** PUT /api/web/locations/:id — update organization. */
export async function update(id, locationData) {
    const data = await request('PUT', `/locations/${id}`, { body: locationData });
    return data.location;
}

/** DELETE /api/web/locations/:id — soft-delete (cascades to RVMs/rewards/users). */
async function deleteLocation(id) {
    return await request('DELETE', `/locations/${id}`);
}
export { deleteLocation as delete };

// ── Org Types (lookup table — superadmin managed) ─────────────────────────

/** GET /api/web/org-types — list organization types. */
export async function getOrgTypes() {
    const data = await request('GET', '/org-types');
    return data.orgTypes;
}

/** POST /api/web/org-types — create organization type. */
export async function createOrgType(name) {
    const data = await request('POST', '/org-types', { body: { name } });
    return data.orgType;
}

/** DELETE /api/web/org-types/:id — delete organization type (blocked if referenced). */
export async function deleteOrgType(id) {
    return await request('DELETE', `/org-types/${id}`);
}

/** PUT /api/web/org-types/:id — rename organization type. */
export async function updateOrgType(id, name) {
    const data = await request('PUT', `/org-types/${id}`, { body: { name } });
    return data.orgType;
}
