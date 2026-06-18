/**
 * Settings API module — endpoints under `/api/web/settings/*`.
 *
 * Covers notification settings, points configuration, channel (email/SMS)
 * configuration, and security configuration (incl. force-logout and login
 * history).
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

// ── Notifications ─────────────────────────────────────────────────────────

/**
 * GET /api/web/settings/notifications — fetch all notification settings for
 * the actor's organization. Returns `{ settings, alertTypes }`.
 */
export async function getNotifications(locationId = null) {
    const data = await request('GET', withQuery('/settings/notifications', { location_id: locationId }));
    return { settings: data.settings, alertTypes: data.alertTypes };
}

/** PUT /api/web/settings/notifications — batch-update notification settings. */
export async function updateNotifications(settingsArray, locationId = null) {
    return await request('PUT', withQuery('/settings/notifications', { location_id: locationId }), {
        body: { settings: settingsArray },
    });
}

/** POST /api/web/settings/notifications/test — send a test email or SMS. */
export async function testNotification(channel, recipient) {
    return await request('POST', '/settings/notifications/test', {
        body: { channel, recipient },
    });
}

/** GET /api/web/settings/notifications/logs — notification log history. */
export async function getNotificationLogs(locationId = null) {
    const data = await request('GET', withQuery('/settings/notifications/logs', { location_id: locationId }));
    return data.logs;
}

// ── Channel configuration (email + SMS) ───────────────────────────────────

/** GET /api/web/settings/channels — fetch email/SMS channel config. */
export async function getChannelConfig(locationId = null) {
    const data = await request('GET', withQuery('/settings/channels', { location_id: locationId }));
    return data.config;
}

/** PUT /api/web/settings/channels — update channel config (head_admin+). */
export async function updateChannelConfig(config, locationId = null) {
    return await request('PUT', withQuery('/settings/channels', { location_id: locationId }), {
        body: config,
    });
}

// ── Security configuration ────────────────────────────────────────────────

/** GET /api/web/settings/security — fetch security config (2FA, lockout, ...). */
export async function getSecurityConfig(locationId = null) {
    const data = await request('GET', withQuery('/settings/security', { location_id: locationId }));
    return data.config;
}

/** PUT /api/web/settings/security — update security config (head_admin+). */
export async function updateSecurityConfig(config, locationId = null) {
    return await request('PUT', withQuery('/settings/security', { location_id: locationId }), {
        body: config,
    });
}

/** POST /api/web/settings/security/force-logout — force-logout all org sessions. */
export async function forceLogoutAll(locationId = null) {
    return await request('POST', withQuery('/settings/security/force-logout', { location_id: locationId }));
}

/** GET /api/web/settings/security/login-history — login/logout history. */
export async function getLoginHistory(locationId = null) {
    const data = await request('GET', withQuery('/settings/security/login-history', { location_id: locationId }));
    return data.history;
}
