"""Authoritative per-verb RBAC matrix (single source of truth).

`ROLE_ACTION_PERMISSIONS[role][category]` is the set of verbs that role may
perform in that category. Everything else derives from this map:

  * `middleware.ROLE_PERMISSIONS` — the category set per role (any verb).
  * `auth_controller` — projects this structure into `GET /auth/me`.
  * `permission_required(category, action=...)` — server-side verb gate.
  * Client `AuthContext` — consumes the projected structure for UI gating.

Verbs: 'view', 'edit', 'create', 'delete', 'export'.
Non-admin roles ('user', 'dependent') are intentionally absent.
"""

ROLE_ACTION_PERMISSIONS = {
    'superadmin': {
        'dashboard': {'view', 'edit'},
        'users': {'view', 'edit', 'create', 'delete'},
        'machines': {'view', 'edit', 'create', 'delete'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'locations': {'view', 'edit', 'create', 'delete'},
        'groups': {'view', 'edit', 'create', 'delete'},
        'leaderboard': {'view', 'edit'},
        'analytics': {'view', 'export'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export', 'delete'},
        'settings': {'view', 'edit'},
    },
    'head_admin': {
        'dashboard': {'view', 'edit'},
        'users': {'view', 'edit', 'create', 'delete'},
        'machines': {'view', 'edit', 'create', 'delete'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'locations': {'view', 'edit'},
        'groups': {'view', 'edit', 'create', 'delete'},
        'leaderboard': {'view', 'edit'},
        'analytics': {'view'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export'},
        'settings': {'view', 'edit'},
    },
    'auditor': {
        'dashboard': {'view'},
        'users': {'view'},
        'machines': {'view'},
        'rewards': {'view'},
        'analytics': {'view'},
        'sessions': {'view', 'create'},
        'logs': {'view', 'export'},
        'settings': {'view'},
        'leaderboard': {'view'},
    },
    'inventory_officer': {
        'dashboard': {'view'},
        'rewards': {'view', 'edit', 'create', 'delete'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
        'leaderboard': {'view'},
    },
    'technician': {
        'dashboard': {'view'},
        'machines': {'view', 'edit'},
        'sessions': {'view', 'create'},
        'logs': {'view'},
        'settings': {'view'},
        'leaderboard': {'view'},
    },
}


def categories_for_role(role):
    """Return the set of categories the role has at least one verb in."""
    return set(ROLE_ACTION_PERMISSIONS.get(role, {}).keys())


def role_can(role, category, action):
    """True iff `role` may perform `action` in `category`."""
    return action in ROLE_ACTION_PERMISSIONS.get(role, {}).get(category, set())


def permissions_for_role(role):
    """Return the role's full {category: sorted([verbs])} map for JSON projection."""
    return {
        category: sorted(verbs)
        for category, verbs in ROLE_ACTION_PERMISSIONS.get(role, {}).items()
    }
