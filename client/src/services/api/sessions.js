/**
 * Sessions API module — endpoints under `/api/web/sessions/*` and
 * `/api/web/bulk-deposits/*`.
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

// ── Bulk recycling sessions ───────────────────────────────────────────────

/** GET /api/web/sessions/bulk — list bulk recycling sessions. */
export async function getAll(locationId = null) {
    const data = await request('GET', withQuery('/sessions/bulk', { location_id: locationId }));
    return data.sessions;
}

/** POST /api/web/sessions/bulk — create a bulk session with items. */
export async function create(sessionData) {
    const data = await request('POST', '/sessions/bulk', { body: sessionData });
    return data.session;
}

/** GET /api/web/sessions/bulk/:id — fetch a session detail with items. */
export async function getById(id) {
    const data = await request('GET', `/sessions/bulk/${id}`);
    return data.session;
}

// ── Bulk deposits (manual point credits) ──────────────────────────────────

/** GET /api/web/bulk-deposits — list manual bulk deposits. */
export async function getBulkDeposits(locationId = null) {
    const data = await request('GET', withQuery('/bulk-deposits', { location_id: locationId }));
    return data.deposits;
}

/** POST /api/web/bulk-deposits — admin credits points directly to a wallet. */
export async function createBulkDeposit(depositData) {
    const data = await request('POST', '/bulk-deposits', { body: depositData });
    return data.deposit;
}
