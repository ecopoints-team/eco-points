/**
 * EcoPoints — Core API request wrapper
 *
 * Single source of `request()` for the Client. Every per-domain module under
 * `client/src/services/api/` imports `request` from this file and SHALL NOT
 * define its own fetch wrapper.
 *
 * Behaviour:
 *   - Builds the request URL from `apiBase` (driven by `NEXT_PUBLIC_API_BASE`,
 *     falling back to `${NEXT_PUBLIC_API_URL}/api/web`, finally `/api/web`).
 *   - Sends every request with `credentials: 'include'` so the HttpOnly
 *     `token` cookie set by `/api/web/auth/login` is transmitted on every
 *     call (Phase 4B — Requirements 4B.11, 4B.16).
 *   - JSON-encodes a body when one is provided on a non-GET / non-HEAD method.
 *   - Parses the JSON response and normalizes the server's
 *     `{ success, error: { code, message } }` envelope.
 *   - Throws an `ApiError` on any non-2xx status OR on a 2xx response whose
 *     body sets `success: false`. The thrown error carries the server's
 *     `error.code` and `error.message` verbatim.
 *
 * Phase 1 — Requirements 1.3, 1.9
 * Phase 4B — Requirements 4B.11, 4B.13, 4B.14, 4B.16, 7.6
 *   - cookie transport (no JWT in localStorage)
 *   - read the readable `csrf_token` cookie and attach `X-CSRF-Token` on
 *     every state-changing request
 *   - dispatch `ecopoints:unauthorized` on `window` for any HTTP 401, so
 *     `AuthContext` can drop the in-memory user and redirect to `/`
 */

/**
 * Methods that mutate server state and therefore require a CSRF token under
 * the double-submit cookie pattern enforced by `@csrf_required` (task 11.3).
 */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Read the readable (non-HttpOnly) `csrf_token` cookie set by the Server on
 * login (task 11.1). Returns an empty string when:
 *   - the code is running in a non-browser environment (Next.js SSR), or
 *   - the cookie is absent (e.g., before the user has authenticated).
 *
 * The cookie value is `decodeURIComponent`-decoded so it survives the
 * URL-encoding the Server applies via `Set-Cookie`.
 */
export function readCsrfCookie() {
    if (typeof document === 'undefined') return '';
    const raw = document.cookie;
    if (!raw) return '';
    // Cookies are separated by `; `. Split, trim, and locate the entry whose
    // name is exactly `csrf_token` to avoid collisions like `xsrf_csrf_token`.
    const parts = raw.split(';');
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const eq = trimmed.indexOf('=');
        if (eq < 0) continue;
        const name = trimmed.slice(0, eq);
        if (name !== 'csrf_token') continue;
        const value = trimmed.slice(eq + 1);
        try {
            return decodeURIComponent(value);
        } catch {
            // Malformed encoding — fall back to the raw value rather than
            // failing the whole request.
            return value;
        }
    }
    return '';
}

/**
 * Notify the rest of the app that the Server rejected our session.
 * `AuthContext` listens for this and clears in-memory state + redirects to
 * the landing page. Safe to call from SSR — guarded by a `window` check.
 */
function dispatchUnauthorized() {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new CustomEvent('ecopoints:unauthorized'));
    } catch {
        // Older runtimes without `CustomEvent` support — best-effort only.
    }
}

function resolveApiBase() {
    const explicit = process.env.NEXT_PUBLIC_API_BASE;
    if (explicit && explicit.length > 0) {
        return explicit.replace(/\/+$/, '');
    }
    const legacy = process.env.NEXT_PUBLIC_API_URL;
    if (legacy && legacy.length > 0) {
        return `${legacy.replace(/\/+$/, '')}/api/web`;
    }
    return '/api/web';
}

export const apiBase = resolveApiBase();

function buildUrl(path) {
    if (!path) return apiBase;
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith('/') ? `${apiBase}${path}` : `${apiBase}/${path}`;
}

/**
 * Error type thrown by `request()` for any non-success response.
 * Callers can branch on `err.code` (e.g. `ADMIN_REQUIRED`, `FORBIDDEN`,
 * `VALIDATION_ERROR`, `CSRF_INVALID`, `FORCED_LOGOUT`).
 */
export class ApiError extends Error {
    constructor(code, message, status, body) {
        super(message || code || 'Request failed');
        this.name = 'ApiError';
        this.code = code || null;
        this.status = typeof status === 'number' ? status : 0;
        this.body = body || null;
    }
}

/**
 * Perform an HTTP request against the EcoPoints API.
 *
 * The JWT lives in an HttpOnly cookie (Phase 4B); JavaScript never reads or
 * writes it. The browser attaches the cookie automatically on every call
 * because we set `credentials: 'include'`. For unsafe methods (`POST`,
 * `PUT`, `PATCH`, `DELETE`) we read the readable `csrf_token` cookie and
 * mirror its value into an `X-CSRF-Token` header so the Server's
 * `@csrf_required` (task 11.3) can run a constant-time double-submit
 * comparison. A caller-supplied `X-CSRF-Token` header always wins so tests
 * can drive the wire format directly.
 *
 * On HTTP 401 we dispatch `ecopoints:unauthorized` on `window`. The auth
 * context listens for it and only acts when a user is currently signed in
 * — that way the boot probe's 401 (no session yet) does not trigger a
 * spurious redirect.
 *
 * @param {string} method  HTTP method (case-insensitive).
 * @param {string} path    Path appended to `apiBase`. May be absolute (http/https) or
 *                         a relative path; query strings are the caller's responsibility.
 * @param {{ body?: unknown, headers?: Record<string, string> }} [options]
 *   - `body`: JSON-serializable payload. Ignored on GET / HEAD.
 *   - `headers`: Extra request headers. May override defaults.
 * @returns {Promise<any>} The parsed JSON response body (or `null` for empty bodies).
 * @throws  {ApiError} On any non-2xx response or `{ success: false }` envelope.
 */
export async function request(method, path, { body, headers } = {}) {
    const httpMethod = (method || 'GET').toUpperCase();
    const url = buildUrl(path);

    const finalHeaders = { Accept: 'application/json', ...(headers || {}) };

    // Double-submit CSRF (task 11.6 / Requirements 4B.13, 4B.14, 7.6).
    // For state-changing methods, mirror the readable `csrf_token` cookie
    // into the `X-CSRF-Token` header so the Server's `@csrf_required` can
    // run its constant-time compare. Only attach the header when a cookie
    // exists and the caller has not already supplied one — letting callers
    // override is essential for tests and for the rare case where the
    // value is sourced elsewhere.
    if (UNSAFE_METHODS.has(httpMethod)) {
        const callerProvided =
            'X-CSRF-Token' in finalHeaders || 'x-csrf-token' in finalHeaders;
        if (!callerProvided) {
            const csrf = readCsrfCookie();
            if (csrf) {
                finalHeaders['X-CSRF-Token'] = csrf;
            }
        }
    }

    const init = {
        method: httpMethod,
        headers: finalHeaders,
        // Send the HttpOnly `token` cookie (and the readable `csrf_token`
        // cookie) on every request so cookie-based auth works across origins
        // when `NEXT_PUBLIC_API_BASE` points to a separate Server host.
        credentials: 'include',
    };

    const hasBody = body !== undefined && body !== null;
    if (hasBody && httpMethod !== 'GET' && httpMethod !== 'HEAD') {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        if (isFormData) {
            // Let the browser set Content-Type with the multipart boundary.
            init.body = body;
        } else {
            if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
                finalHeaders['Content-Type'] = 'application/json';
            }
            init.body = JSON.stringify(body);
        }
    }

    const response = await fetch(url, init);

    // Parse the body as JSON when present; tolerate empty bodies and non-JSON
    // payloads so callers always get a structured error on failure paths.
    let data = null;
    let rawBodyText = null; // kept for flat-string error surfacing
    const rawText = await response.text();
    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch {
            // Not JSON — preserve the raw text so error paths can surface it.
            rawBodyText = rawText;
            data = null;
        }
    }

    if (!response.ok) {
        const errorField = data && typeof data === 'object' ? data.error : null;
        const serverError = (errorField && typeof errorField === 'object') ? errorField : {};
        // The server sometimes returns `error` as a plain string
        // (e.g. { success: false, error: "Location is required" }).
        const stringError = typeof errorField === 'string' ? errorField : null;
        // A 401 from any endpoint means the session is gone (expired,
        // forced-logout, or never existed). Notify `AuthContext` so it can
        // clear in-memory state and bounce the user to the landing page.
        // The listener is responsible for ignoring 401s during the boot
        // probe (when no user is currently signed in).
        if (response.status === 401) {
            dispatchUnauthorized();
        }
        // When the server returns a flat string body (not a JSON envelope),
        // use that string directly as the error message rather than falling
        // back to the generic HTTP status text (e.g. "BAD REQUEST").
        const flatStringMessage = rawBodyText && rawBodyText.trim() ? rawBodyText.trim() : null;
        // Build a human-readable message from the server's error envelope.
        // Pydantic validation errors use { error: { code, errors: [{field, message}] } }
        // with no top-level message — so we fall back to the first errors[] entry.
        const validationMsg = Array.isArray(serverError.errors) && serverError.errors.length
            ? `${serverError.errors[0].field}: ${serverError.errors[0].message}`
            : null;
        throw new ApiError(
            serverError.code || `HTTP_${response.status}`,
            serverError.message || stringError || validationMsg || flatStringMessage || response.statusText || `Request failed (${response.status})`,
            response.status,
            data,
        );
    }

    if (data && typeof data === 'object' && data.success === false) {
        const errorField = data.error;
        const serverError = (errorField && typeof errorField === 'object') ? errorField : {};
        const stringError = typeof errorField === 'string' ? errorField : null;
        const validationMsg = Array.isArray(serverError.errors) && serverError.errors.length
            ? `${serverError.errors[0].field}: ${serverError.errors[0].message}`
            : null;
        throw new ApiError(
            serverError.code || 'REQUEST_FAILED',
            serverError.message || stringError || validationMsg || 'Request failed',
            response.status,
            data,
        );
    }

    return data;
}

export default request;
