/**
 * Machines API module — endpoints under `/api/web/machines/*`.
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

/** GET /api/web/machines — list RVMs (location-scoped, paginated). */
export async function getAll(locationId = null) {
    const data = await request('GET', withQuery('/machines', { location_id: locationId }));
    return data.machines;
}

/** POST /api/web/machines — register a new RVM. */
export async function create(machineData) {
    const data = await request('POST', '/machines', { body: machineData });
    return data.machine;
}

/** PUT /api/web/machines/:id — update RVM details. */
export async function update(id, machineData) {
    const data = await request('PUT', `/machines/${id}`, { body: machineData });
    return data.machine;
}

/** DELETE /api/web/machines/:id — decommission RVM (sets is_online=false). */
async function deleteMachine(id) {
    return await request('DELETE', `/machines/${id}`);
}
export { deleteMachine as delete };
