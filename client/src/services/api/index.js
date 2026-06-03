/**
 * EcoPoints — `client/src/services/api` barrel.
 *
 * Re-exports every per-domain API module under a namespace and ships a
 * default `{ auth, dashboard, ... }` aggregate so callers can pick whichever
 * import style they prefer:
 *
 *   import * as api from '@/services/api';
 *   import api from '@/services/api';
 *   import { users, rewards } from '@/services/api';
 *
 * The shared transport (`request`, `apiBase`, `ApiError`) is re-exported
 * directly from `./client` for callers that need to bypass the per-domain
 * helpers (rare — almost all consumers should use a domain module).
 *
 * Phase 1 — Requirements 1.3, 1.9
 */

export { request, apiBase, ApiError } from './client';

import * as auth from './auth';
import * as dashboard from './dashboard';
import * as users from './users';
import * as locations from './locations';
import * as machines from './machines';
import * as rewards from './rewards';
import * as logs from './logs';
import * as leaderboard from './leaderboard';
import * as groups from './groups';
import * as analytics from './analytics';
import * as settings from './settings';
import * as sessions from './sessions';

export {
    auth,
    dashboard,
    users,
    locations,
    machines,
    rewards,
    logs,
    leaderboard,
    groups,
    analytics,
    settings,
    sessions,
};

// ── Legacy compatibility namespaces ───────────────────────────────────────
// The legacy unified module exposed `orgTypes` and `bulkSessions` as
// top-level namespaces. The Phase 1 split folds those endpoints into
// `locations.js` (org types) and `sessions.js` (bulk sessions) respectively.
// To keep the callers' function shape (`orgTypesApi.getAll`, `bulkApi.create`,
// …) intact without renaming them at every call site, we re-export thin
// namespaces that map back onto the canonical per-domain functions.
//
// The legacy `cities` namespace is intentionally absent — Phase 1 drops the
// cities lookup endpoint entirely (Requirement 1.4); pages that need city
// data import `CITIES` from `client/src/data/mockData.js` instead.

export const orgTypes = {
    getAll: locations.getOrgTypes,
    create: locations.createOrgType,
    delete: locations.deleteOrgType,
};

export const bulkSessions = {
    getAll: sessions.getAll,
    create: sessions.create,
    getById: sessions.getById,
};

const api = {
    auth,
    dashboard,
    users,
    locations,
    machines,
    rewards,
    logs,
    leaderboard,
    groups,
    analytics,
    settings,
    sessions,
    orgTypes,
    bulkSessions,
};

export default api;
