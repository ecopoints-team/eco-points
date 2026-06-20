/**
 * Auth API module — endpoints under `/api/web/auth/*`.
 *
 * Phase 4B (HttpOnly cookie + CSRF) replaces the legacy localStorage-backed
 * Bearer-token transport. The Server now sets the JWT in an HttpOnly cookie
 * on `/auth/login` and `/auth/verify-otp`, and the Client transmits it
 * automatically because `client.js` sets `credentials: 'include'` on every
 * request. Nothing in the Client reads or writes the JWT directly.
 *
 * Login state is therefore not derived from a stashed token but from a live
 * `GET /auth/me` round-trip: if the cookie is valid the call succeeds and
 * the caller knows the user is signed in; on 401 the caller treats the user
 * as logged out.
 *
 * Phase 1 — Requirements 1.3, 1.9
 * Phase 4B — Requirements 4B.11, 4B.16
 */
import { request } from './client';

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/web/auth/login — authenticate with email/username + password.
 *
 * On a non-2FA login the Server returns `{ success, user }` and sets the
 * JWT in an HttpOnly `token` cookie (plus a readable `csrf_token` cookie).
 * If the org or user has 2FA enabled the Server returns
 * `{ success, requires2FA, tempToken }` instead — the caller is expected to
 * follow up with `verifyOtp(...)`. The response body may still echo the JWT
 * during the Phase 4 transition window; the Client deliberately ignores it.
 */
export async function login(identifier, password) {
    return await request('POST', '/auth/login', {
        body: { email: identifier, password },
    });
}

/**
 * POST /api/web/auth/verify-otp — complete a 2FA login flow.
 * Body: `{ tempToken, code }`. On success the Server sets the same cookies
 * as `/auth/login`; the response body's `token` field (if present) is
 * ignored by the Client.
 */
export async function verifyOtp(tempToken, code) {
    return await request('POST', '/auth/verify-otp', {
        body: { tempToken, code },
    });
}

/** GET /api/web/auth/me — returns the current user object. */
export async function me() {
    const data = await request('GET', '/auth/me');
    return data.user;
}

/**
 * POST /api/web/auth/logout — clears the auth cookies on the Server side.
 * Server failures do not propagate so callers can always rely on the local
 * session being treated as gone (the in-memory user is cleared by the
 * caller; the cookies will either be cleared by `Set-Cookie: token=; Max-Age=0`
 * or expire naturally).
 */
export async function logout() {
    try {
        await request('POST', '/auth/logout');
    } catch {
        /* server logout is best-effort */
    }
}

/** PUT /api/web/auth/profile — update name/email/phone for the current user. */
export async function updateProfile(profileData) {
    const data = await request('PUT', '/auth/profile', { body: profileData });
    return data.user;
}

/** POST /api/web/auth/avatar — upload avatar image (FormData, not JSON). */
export async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return await request('POST', '/auth/avatar', { body: formData });
}

/** POST /api/web/auth/change-password — change own password. */
export async function changePassword(currentPassword, newPassword) {
    return await request('POST', '/auth/change-password', {
        body: { currentPassword, newPassword },
    });
}

/** POST /api/web/auth/register — public sign-up. */
export async function register(userData) {
    return await request('POST', '/auth/register', { body: userData });
}

/** GET /api/web/auth/locations — public list of active organizations. */
export async function getPublicLocations() {
    const data = await request('GET', '/auth/locations');
    return data.locations;
}

/** GET /api/web/auth/groups — public list of community groups for a location. */
export async function getPublicGroups(locationId) {
    const qs = locationId !== null && locationId !== undefined
        ? `?location_id=${encodeURIComponent(locationId)}`
        : '';
    const data = await request('GET', `/auth/groups${qs}`);
    return data.groups;
}

/** POST /api/web/auth/forgot-password — send a password-reset OTP. */
export async function forgotPassword(email) {
    return await request('POST', '/auth/forgot-password', {
        body: { email },
    });
}

/** POST /api/web/auth/verify-reset-otp — verify OTP and get reset token. */
export async function verifyResetOtp(email, code) {
    return await request('POST', '/auth/verify-reset-otp', {
        body: { email, code },
    });
}

/** POST /api/web/auth/reset-password — set new password with reset token. */
export async function resetPassword(resetToken, newPassword) {
    return await request('POST', '/auth/reset-password', {
        body: { resetToken, newPassword },
    });
}
