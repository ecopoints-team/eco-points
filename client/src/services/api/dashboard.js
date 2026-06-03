/**
 * Dashboard API module — endpoints under `/api/web/dashboard/*`.
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

/** GET /api/web/dashboard/stats — aggregated org-scoped stats. */
export async function getStats(locationId = null) {
    const data = await request('GET', withQuery('/dashboard/stats', { location_id: locationId }));
    return data.stats;
}
