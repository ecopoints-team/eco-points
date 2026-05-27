/**
 * Leaderboard API module — endpoints under `/api/web/leaderboard/*`.
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
 * GET /api/web/leaderboard — top users by lifetime points + top groups.
 * Returns `{ topUsers, topGroups }`.
 */
export async function get(locationId = null) {
    const data = await request('GET', withQuery('/leaderboard', { location_id: locationId }));
    return { topUsers: data.topUsers, topGroups: data.topGroups };
}
