/**
 * Logs API module — endpoints under `/api/web/logs/*`.
 *
 * Covers bottle (recycling-item) logs, machine maintenance logs, admin/audit
 * access logs, reward redemption logs, and transaction logs.
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

/** GET /api/web/logs/bottles — recycling-item logs. */
export async function getBottles(locationId = null) {
    const data = await request('GET', withQuery('/logs/bottles', { location_id: locationId }));
    return data.logs;
}

/** GET /api/web/logs/machines — maintenance logs. */
export async function getMachines(locationId = null) {
    const data = await request('GET', withQuery('/logs/machines', { location_id: locationId }));
    return data.logs;
}

/** POST /api/web/logs/machines — create maintenance log entry. */
export async function createMachineLog(logData) {
    const data = await request('POST', '/logs/machines', { body: logData });
    return data.log;
}

/** GET /api/web/logs/access — admin action / audit log. */
export async function getAccess(locationId = null) {
    const data = await request('GET', withQuery('/logs/access', { location_id: locationId }));
    return data.logs;
}

/** GET /api/web/logs/rewards — reward redemption log. */
export async function getRewards(locationId = null) {
    const data = await request('GET', withQuery('/logs/rewards', { location_id: locationId }));
    return data.logs;
}

/** PUT /api/web/logs/rewards/:id — update redemption status (pending → claimed). */
export async function updateRedemptionStatus(redemptionId, status) {
    const data = await request('PUT', `/logs/rewards/${redemptionId}`, {
        body: { status },
    });
    return data.log;
}

/** GET /api/web/logs/transactions — transaction (earn/redeem/adjustment) log. */
export async function getTransactions(locationId = null) {
    const data = await request('GET', withQuery('/logs/transactions', { location_id: locationId }));
    return data.logs;
}
