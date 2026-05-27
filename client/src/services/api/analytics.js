/**
 * Analytics API module — endpoints under `/api/web/analytics/*`.
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
 * GET /api/web/analytics — comprehensive analytics payload.
 * Returns the `analytics` object (recycling trends, user growth, points
 * economy, machine utilisation, reward insights, peak hours/days, etc.).
 */
export async function getData(locationId = null) {
    const data = await request('GET', withQuery('/analytics', { location_id: locationId }));
    return data.analytics;
}
