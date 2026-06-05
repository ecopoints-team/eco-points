"""
JWT Authentication Middleware
Provides @token_required decorator for protected routes.
"""
import hmac
import os
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from pydantic import BaseModel, ValidationError
from .models import User
from . import db


# ── Phase 4B: CSRF protection ───────────────────────────────────────
# HTTP methods that mutate server state. These are the only methods on
# which CSRF validation fires; "safe" methods (GET, HEAD, OPTIONS) bypass
# the check entirely (Requirements 4B.13, 4B.14, 7.6).
_UNSAFE_METHODS = frozenset({'POST', 'PUT', 'PATCH', 'DELETE'})


# ── Role hierarchy: higher number = more privilege ──────────────────
ROLE_HIERARCHY = {
    'dependent': 0,
    'user': 1,
    'technician': 2,
    'inventory_officer': 3,
    'auditor': 4,
    'head_admin': 5,
    'superadmin': 6,
}

# ── Admin role set: roles authorized to access any admin surface ────
# Phase 0: the universal admin guard rejects every role NOT in this set
# regardless of HTTP method, decorator, or category.
ADMIN_ROLE_SET = {
    'superadmin',
    'head_admin',
    'auditor',
    'technician',
    'inventory_officer',
}

# ── Granular permissions per role ───────────────────────────────────
# Maps each admin role → set of allowed permission categories. This map
# is the *authoritative* server-side RBAC source for Phase 2
# (Requirements 2.1, 2.9). Both `@permission_required(*categories)` and
# the `GET /api/web/auth/me` projection consult this map.
#
# Canonical category set (drawn from the audit-spec category list, see
# `role_permissions.md` and Phase 2 design):
#
#     users, machines, rewards, locations, logs, analytics,
#     settings, groups, sessions, leaderboard, dashboard
#
# Phase 0 / Phase 2 invariants enforced by construction:
#   - Only roles in `ADMIN_ROLE_SET` appear as keys. The non-admin roles
#     `user` and `dependent` are absent so that even an accidental
#     `ROLE_PERMISSIONS.get(role, set())` lookup cannot grant them any
#     category. Admin-only granularity is therefore structurally
#     guaranteed: `_require_admin_or_403` rejects non-admin roles before
#     this map is consulted, AND the map itself contains no non-admin
#     entry to fall back on.
#   - No verb-style categories (e.g. 'read', 'write'). Every entry is a
#     domain category that maps 1-to-1 to an Admin_UI page / Domain_
#     Controller. This keeps the (route → category) mapping mechanical
#     for the Phase 2 `@admin_required → @permission_required` sweep.
#
# Per-role rationale (see `role_permissions.md` and Phase 2 task 6.1):
#   - superadmin:        all categories (platform-wide).
#   - head_admin:        all categories (organization-scoped).
#   - auditor:           read-heavy review surfaces — logs, analytics,
#                        sessions, dashboard, leaderboard — plus
#                        settings for audit configuration.
#   - technician:        machines + the operational surfaces a
#                        field tech needs (logs, settings, dashboard).
#   - inventory_officer: rewards (CRUD) + the operational surfaces an
#                        inventory officer needs (logs, settings,
#                        dashboard).
ROLE_PERMISSIONS = {
    'superadmin': {
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    },
    'head_admin': {
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    },
    'auditor': {
        'logs', 'analytics', 'sessions', 'settings',
        'leaderboard', 'dashboard',
    },
    'technician': {
        'machines', 'logs', 'settings', 'dashboard',
    },
    'inventory_officer': {
        'rewards', 'logs', 'settings', 'dashboard',
    },
}

# Defensive invariant check: keys must be exactly the admin role set, and
# the non-admin roles `user` / `dependent` must never appear here. Phase 0
# (Requirement 0.7) and Phase 2 (Requirement 2.1, 2.9) both rely on this.
assert set(ROLE_PERMISSIONS.keys()) == ADMIN_ROLE_SET, (
    "ROLE_PERMISSIONS keys must equal ADMIN_ROLE_SET; "
    f"got {set(ROLE_PERMISSIONS.keys())!r}"
)
assert 'user' not in ROLE_PERMISSIONS and 'dependent' not in ROLE_PERMISSIONS, (
    "Non-admin roles must be absent from ROLE_PERMISSIONS"
)


def _require_admin_or_403(current_user):
    """Phase 0 shared admin guard (Requirement 0.1, 0.6).

    Returns a Flask `(response, 403)` tuple when `current_user.role` is not in
    `ADMIN_ROLE_SET`, regardless of HTTP method. Returns `None` when the user
    is an admin and the calling decorator should proceed with its remaining
    checks.

    Both `@admin_required` and `@permission_required` MUST call this helper as
    their first authorization step so that the GET-method bypass is closed
    uniformly across every admin surface.
    """
    role = getattr(current_user, 'role', None)
    if role not in ADMIN_ROLE_SET:
        return jsonify({
            'success': False,
            'error': {
                'code': 'ADMIN_REQUIRED',
                'message': 'Admin access required',
            },
        }), 403
    return None


def _check_csrf_or_403():
    """Phase 4B shared CSRF guard (Requirements 4B.13, 4B.14, 7.6).

    Compares the ``X-CSRF-Token`` request header to the ``csrf_token`` cookie
    using ``hmac.compare_digest`` (constant-time). Both values must be
    present **and** non-empty for the check to succeed; if either is missing
    the guard returns a Flask ``(response, 403)`` tuple. Returns ``None``
    when the values match and the calling decorator should proceed.

    The check is intentionally method-agnostic at this layer: callers (such
    as ``@token_required`` for unsafe methods, or the standalone
    ``@csrf_required`` decorator) are responsible for deciding *when* to
    invoke it. Safe methods (GET, HEAD, OPTIONS) are never gated by CSRF.

    Escape hatch: when the env var ``AUTH_CSRF_DISABLED`` is set to the
    literal string ``'true'`` (case-insensitive), the guard is a no-op and
    returns ``None``. This exists so the existing test suite — which
    POST/PUT/DELETEs with Bearer tokens but without CSRF cookies — continues
    to work without rewriting every fixture; production deployments leave
    the var unset (default ``'false'``) so CSRF is enforced. The env var is
    read **per-request** so tests can flip it via ``monkeypatch``.
    """
    if os.environ.get('AUTH_CSRF_DISABLED', 'false').lower() == 'true':
        return None

    header_value = request.headers.get('X-CSRF-Token') or ''
    cookie_value = request.cookies.get('csrf_token') or ''

    # Both values must be present (non-empty) AND byte-equal under a
    # constant-time comparison. ``hmac.compare_digest`` raises on mixed
    # str/bytes types, so we keep both as str.
    if (
        not header_value
        or not cookie_value
        or not hmac.compare_digest(header_value, cookie_value)
    ):
        return jsonify({
            'success': False,
            'error': {
                'code': 'CSRF_INVALID',
                'message': 'CSRF token missing or invalid',
            },
        }), 403
    return None


def csrf_required(f):
    """Decorator that enforces double-submit CSRF validation on a route.

    Compares the ``X-CSRF-Token`` request header to the ``csrf_token``
    cookie via ``hmac.compare_digest``. Mismatch (or either value missing)
    → HTTP 403 with envelope::

        {
          "success": false,
          "error": {
            "code": "CSRF_INVALID",
            "message": "CSRF token missing or invalid"
          }
        }

    The decorator only fires on unsafe methods (``POST``, ``PUT``,
    ``PATCH``, ``DELETE``); safe methods (``GET``, ``HEAD``, ``OPTIONS``)
    pass through unchanged so that read traffic is unaffected
    (Requirement 4B.13).

    In practice CSRF is wired automatically inside ``@token_required`` for
    every authenticated unsafe request, so most handlers do not need this
    standalone decorator. It is exposed for completeness and for the rare
    case where a route wants CSRF protection without authentication.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in _UNSAFE_METHODS:
            denied = _check_csrf_or_403()
            if denied:
                return denied
        return f(*args, **kwargs)

    return decorated


def token_required(f):
    """Decorator that enforces a valid JWT on a route.

    Phase 4B (Task 11.2 / Requirement 4B.12) — token source resolution:

      1. **Cookie first.** The decorator first reads ``request.cookies.get('token')``.
         If a cookie value is present, it is used as the JWT and validated
         (decode + blacklist + active-user checks). If the cookie is present
         but invalid (expired, tampered, blacklisted, or referring to a
         missing/inactive user), the request is rejected with HTTP 401 and
         the ``Authorization`` header is **not** consulted as a fallback —
         the fallback only fires when the cookie is *absent*.
      2. **Bearer fallback.** If, and only if, the ``token`` cookie is
         absent **and** the ``AUTH_COOKIE_ONLY`` env var is not set to the
         literal string ``'true'`` (case-insensitive), the decorator falls
         back to the ``Authorization: Bearer <jwt>`` header.
      3. **Reject otherwise.** If the cookie is absent and either the
         header is also absent or ``AUTH_COOKIE_ONLY == 'true'``, the
         decorator returns HTTP 401 with the standard "missing token"
         error.

    ``AUTH_COOKIE_ONLY`` is read **dynamically** on every request (via
    ``os.environ.get`` inside the decorator body) rather than at import
    time so that tests can monkey-patch the env var per-case without
    re-importing the module. The default is ``'false'`` to preserve
    backward compatibility with existing Bearer-header clients during
    the Phase 4B transition window.

    Phase 4B / Task 11.3 — automatic CSRF enforcement: after the JWT is
    validated, when ``request.method`` is one of
    ``{POST, PUT, PATCH, DELETE}`` the decorator invokes the shared
    ``_check_csrf_or_403`` helper, which compares the ``X-CSRF-Token``
    header to the ``csrf_token`` cookie via ``hmac.compare_digest``.
    Mismatch (or either value missing) returns HTTP 403 with
    ``error.code == "CSRF_INVALID"``. Safe methods (GET, HEAD, OPTIONS)
    are unaffected. The escape-hatch env var ``AUTH_CSRF_DISABLED=true``
    disables the check; tests that exercise mutating endpoints with
    Bearer tokens flip this on per-suite via ``conftest.py`` /
    ``monkeypatch``.

    Injects ``current_user`` (a User model instance) into the wrapped
    function on success.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # ── Phase 4B: cookie-first token source resolution ─────────────
        #
        # Read AUTH_COOKIE_ONLY *inside* the decorator (not at module
        # import) so that tests can flip it via monkeypatch / setenv on a
        # per-case basis. Default 'false' keeps the Bearer fallback live
        # during the Phase 4B transition window (Requirement 4B.12).
        cookie_only = (
            os.environ.get('AUTH_COOKIE_ONLY', 'false').lower() == 'true'
        )

        cookie_token = request.cookies.get('token')
        token = None
        # If a cookie token is present, it wins — validate it. Per the
        # task contract, we do NOT fall back to the Bearer header when
        # the cookie is present-but-invalid; only an *absent* cookie
        # triggers the header fallback.
        if cookie_token:
            token = cookie_token
        elif not cookie_only:
            # Cookie absent AND fallback allowed → check the header.
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]
        # else: cookie absent AND AUTH_COOKIE_ONLY == 'true' → reject below.

        if not token:
            return jsonify({'success': False, 'error': 'Authentication token is missing'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            # Check token blacklist
            jti = payload.get('jti')
            if jti:
                from .models import TokenBlacklist
                if TokenBlacklist.query.filter_by(jti=jti).first():
                    return jsonify({'success': False, 'error': 'Token has been revoked'}), 401
            current_user = db.session.get(User, payload['user_id'])
            if not current_user:
                return jsonify({'success': False, 'error': 'User not found'}), 401
            if not current_user.is_active:
                return jsonify({'success': False, 'error': 'Account is deactivated'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        # ── Phase 4C: Force-logout check ──────────────────────────────
        # After successfully decoding the JWT and looking up the user,
        # check the user's organization's force_logout_at timestamp.
        # If the JWT was issued (iat) before force_logout_at, reject it
        # with HTTP 401 and error.code = "FORCED_LOGOUT".
        # (Requirement 4C.19, Phase 4C property — forced-logout invariant)
        try:
            community_group = getattr(current_user, 'community_group', None)
            organization = getattr(community_group, 'organization', None) if community_group else None
            force_logout_at = getattr(organization, 'force_logout_at', None) if organization else None
            if force_logout_at is not None:
                iat = payload.get('iat')
                if iat is not None:
                    # Convert force_logout_at to a UTC epoch timestamp.
                    # If the datetime is naive (no tzinfo), treat it as UTC
                    # since the column is DateTime(timezone=True) and stores
                    # UTC values; some backends (e.g. SQLite) strip tzinfo
                    # on retrieval.
                    from datetime import timezone as _tz
                    if force_logout_at.tzinfo is None:
                        force_logout_epoch = force_logout_at.replace(
                            tzinfo=_tz.utc
                        ).timestamp()
                    else:
                        force_logout_epoch = force_logout_at.timestamp()
                    if iat < force_logout_epoch:
                        return jsonify({
                            'success': False,
                            'error': {
                                'code': 'FORCED_LOGOUT',
                                'force_logout_at': force_logout_at.isoformat(),
                            },
                        }), 401
        except (AttributeError, TypeError):
            # If the relationship chain is broken (None community_group,
            # None organization, etc.), skip the check gracefully.
            pass

        # ── Phase 4B: CSRF check on unsafe methods ─────────────────────
        # Per Requirement 4B.13/4B.14 and Task 11.3, every authenticated
        # state-changing request (POST/PUT/PATCH/DELETE) MUST present a
        # matching ``X-CSRF-Token`` header that byte-equals the
        # ``csrf_token`` cookie. The check is centralized in
        # ``_check_csrf_or_403`` so the standalone ``@csrf_required``
        # decorator and this in-token-required wiring share one
        # implementation. Safe methods (GET, HEAD, OPTIONS) bypass the
        # check so read traffic is unaffected.
        if request.method in _UNSAFE_METHODS:
            denied = _check_csrf_or_403()
            if denied:
                return denied

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator that requires the user to be in `ADMIN_ROLE_SET` (Requirement 0.2).

    Phase 0 hardening: this decorator delegates entirely to
    `_require_admin_or_403`. Non-admin roles receive HTTP 403 with
    `error.code == "ADMIN_REQUIRED"` for every HTTP method, including GET.
    The previous `if request.method != 'GET'` early-return branch is removed.

    MUST be applied AFTER `@token_required` so that `current_user` is injected.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        denied = _require_admin_or_403(current_user)
        if denied:
            return denied
        return f(current_user, *args, **kwargs)

    return decorated


def superadmin_required(f):
    """Decorator that requires superadmin role.
    Must be used AFTER @token_required.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Super Admin access required'}), 403
        return f(current_user, *args, **kwargs)

    return decorated


def permission_required(*categories, allow_non_admin=False):
    """Decorator that gates a route on `ROLE_PERMISSIONS[current_user.role]`
    after the universal admin guard passes (Requirement 0.3, 0.4, 0.8).

    Phase 0 hardening:
      1. The decorator's first action is `_require_admin_or_403(current_user)`,
         which returns HTTP 403 `ADMIN_REQUIRED` for every non-admin role
         regardless of HTTP method. The previous `if request.method != 'GET'`
         early-return branch is removed entirely.
         Exception: if `allow_non_admin` is True, non-admin roles bypass the check.
      2. Only after the admin guard passes does the decorator evaluate the
         requested categories against `ROLE_PERMISSIONS[current_user.role]`.
      3. On a category miss the decorator returns HTTP 403 with
         `error.code == "FORBIDDEN"`, the missing category, and a message.

    Stacking rule (Requirement 0.4 / 0.5): `@token_required` MUST precede
    `@permission_required` in the decorator stack so that `current_user` is
    injected. Static analysis (`tests/static/test_decorator_stacking.py`)
    enforces this invariant in CI.

    Usage::

        @some_bp.route('/...', methods=['POST'])
        @token_required
        @permission_required('users')
        def handler(current_user, ...): ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            role = getattr(current_user, 'role', None)
            if role not in ADMIN_ROLE_SET:
                if allow_non_admin:
                    return f(current_user, *args, **kwargs)
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'ADMIN_REQUIRED',
                        'message': 'Admin access required',
                    },
                }), 403
            role_perms = ROLE_PERMISSIONS.get(current_user.role, set())
            for cat in categories:
                if cat not in role_perms:
                    # Phase 2 / Task 6.8: write one audit row for every
                    # Property-G 403 (Requirement 2.8). Lazy-import the
                    # helper to avoid the controllers ↔ middleware import
                    # cycle (`_shared` imports from `middleware`, and
                    # `middleware` would otherwise re-import `_shared` at
                    # module load). The audit row is committed here
                    # because no calling handler is in scope; if the
                    # commit fails for any reason we still return 403,
                    # never letting an unauditable success through.
                    try:
                        from .controllers._shared import log_action  # noqa: WPS433

                        log_action(
                            current_user,
                            'permission_denied',
                            target=f'{request.method} {request.path}',
                            before=None,
                            after=None,
                            category=cat,
                            notes=f'role={current_user.role}',
                        )
                        db.session.commit()
                    except Exception:
                        # Best-effort audit; never let a logging failure
                        # change the 403 outcome the caller depends on.
                        try:
                            db.session.rollback()
                        except Exception:
                            pass

                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'FORBIDDEN',
                            'missing': cat,
                            'message': (
                                f"Role '{current_user.role}' lacks permission "
                                f"for category '{cat}'"
                            ),
                        },
                    }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator


def can_manage_role(actor_role, target_role):
    """Check if actor_role can create/modify users with target_role.
    Returns True only if actor has strictly higher privilege than target.
    """
    actor_level = ROLE_HIERARCHY.get(actor_role, 0)
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    return actor_level > target_level


def get_user_org_id(user):
    """Resolve the organization_id for a user via the CommunityGroup → Organization chain."""
    if user.community_group:
        return user.community_group.organization_id
    return None


# ── Phase 4A: RPI hardware authentication ────────────────────────────


def rpi_auth_required(f):
    """Decorator that validates the ``X-API-Key`` header against the RVM's
    ``api_key_hash`` using BCrypt constant-time compare (Phase 4A).

    Resolution order:

      1. Read ``machineUuid`` from the request body (JSON) — this is the
         primary path since every RPI endpoint sends ``machineUuid`` in
         the POST body.
      2. Fall back to ``request.view_args.get('machine_uuid')`` for
         path-parameter routes (currently unused but future-proof).
      3. If no ``machineUuid`` is resolved, return 400.
      4. Look up the RVM by ``machine_uuid``. If not found → 404
         ``RPI_MACHINE_UNKNOWN``.
      5. Read the ``X-API-Key`` request header and call
         ``rvm.verify_api_key(key)`` — if false → 401
         ``RPI_AUTH_INVALID``.
      6. On success, inject the resolved ``rvm`` as the first positional
         argument to the wrapped handler (before ``payload`` if
         ``@validate_request`` is also applied).

    Stack order::

        @rpi_bp.route('/...', methods=['POST'])
        @rpi_auth_required              # outermost — resolves rvm
        @validate_request(SomeSchema)   # innermost — produces payload
        def handler(rvm, payload): ...

    Requirements: 4A.2, 4A.3
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Resolve machineUuid — body first, path args second.
        body = request.get_json(silent=True) or {}
        machine_uuid = body.get('machineUuid')
        if not machine_uuid:
            machine_uuid = (request.view_args or {}).get('machine_uuid')
        if not machine_uuid:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'RPI_AUTH_INVALID',
                    'message': 'machineUuid is required',
                },
            }), 401

        # Look up RVM
        from .models import RVM
        rvm = RVM.query.filter_by(machine_uuid=machine_uuid).first()
        if not rvm:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'RPI_MACHINE_UNKNOWN',
                    'machineUuid': machine_uuid,
                    'message': 'Machine not registered',
                },
            }), 404

        # Validate X-API-Key header
        api_key = request.headers.get('X-API-Key', '')
        if not api_key or not rvm.verify_api_key(api_key):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'RPI_AUTH_INVALID',
                    'message': 'Invalid or missing API key',
                },
            }), 401

        return f(rvm, *args, **kwargs)

    return decorated


def compute_qr_suffix(secret: bytes, display_id: str) -> str:
    """Compute the 6-char hex HMAC suffix for a QR payload (Phase 4A).

    Returns ``HMAC-SHA256(secret, display_id)[:6]`` as lowercase hex.
    The RVM hardware stamps this suffix onto QR codes; the server
    validates it in ``POST /api/rpi/authenticate`` before any user
    lookup (Requirement 4A.5, 4A.6).

    Usage::

        suffix = compute_qr_suffix(org_secret, 'USER-AU-001')
        qr_payload = f'{display_id}.{suffix}'
    """
    import hashlib
    import hmac as _hmac
    digest = _hmac.new(secret, display_id.encode('utf-8'), hashlib.sha256).hexdigest()
    return digest[:6]


# ── Phase 4E: schema-validated input on every mutating route ─────────
#
# Pydantic v2 surfaces an ``extra_forbidden`` error type when a schema
# configured with ``ConfigDict(extra='forbid')`` receives an unknown key.
# The decorator below distinguishes that case from every other validation
# failure so the response envelope can carry ``UNKNOWN_FIELD`` (with the
# offending key under ``field``) for unknown keys and ``VALIDATION_ERROR``
# (with a flat ``[{field, message}, ...]`` array) for everything else
# (Requirements 4E.24, 4E.25 / Property L / Property S).
_PYDANTIC_EXTRA_FORBIDDEN = 'extra_forbidden'


def _format_loc(loc):
    """Render a Pydantic error ``loc`` tuple as a dotted field path.

    Pydantic emits ``loc`` as a tuple whose elements may be field names
    (``str``) or list indices (``int``). For a top-level field the tuple
    is ``('field_name',)`` and we want ``'field_name'``. For a nested
    location like ``('items', 0, 'detected_class')`` we want
    ``'items.0.detected_class'`` so the client can pinpoint the offending
    element inside an array.

    Empty tuples (whole-body errors) collapse to the empty string; the
    caller is responsible for substituting a sensible default.
    """
    return '.'.join(str(part) for part in loc)


def _serialize_pydantic_errors(err):
    """Flatten a Pydantic ``ValidationError`` into ``[{field, message}]``.

    Each entry preserves the dotted ``loc`` rendering produced by
    :func:`_format_loc` so nested-array errors stay addressable, and uses
    the human-readable ``msg`` Pydantic already generated. We deliberately
    do not include ``type``/``input`` here — the public contract is
    ``[{field, message}]`` (Requirement 4E.24).
    """
    out = []
    for record in err.errors():
        out.append({
            'field': _format_loc(record.get('loc', ())),
            'message': record.get('msg', ''),
        })
    return out


def validate_request(schema):
    """Phase 4E decorator that schema-validates ``request.data`` against a
    Pydantic v2 model and injects the parsed instance as ``payload``.

    Behavior (Requirements 4E.24, 4E.25 / Property L / Property S):

      * Calls ``schema.model_validate_json(request.data)`` against the
        raw request body bytes (NOT ``request.get_json()``) so Pydantic
        owns JSON parsing, type coercion, and unknown-key rejection.
      * Empty bodies are tolerated: when ``request.data`` is missing,
        empty, or whitespace-only the decorator substitutes ``b'{}'`` so
        empty-body schemas (e.g. ``LogoutSchema``, ``ForceLogoutSchema``)
        validate cleanly without forcing callers to send an explicit
        ``{}``.
      * On a Pydantic ``extra_forbidden`` error (the ``extra='forbid'``
        violation) the decorator returns HTTP 400 with::

            {
              "success": false,
              "error": {
                "code": "UNKNOWN_FIELD",
                "field": "<offending key>",
                "errors": [{"field": "...", "message": "..."}, ...]
              }
            }

        The ``field`` key is the dotted path of the first
        ``extra_forbidden`` error in the report; the ``errors`` array is
        the *full* Pydantic error list (every error type, not just
        ``extra_forbidden``) serialized via :func:`_serialize_pydantic_errors`.
      * On any other ``pydantic.ValidationError`` the decorator returns
        HTTP 400 with::

            {
              "success": false,
              "error": {
                "code": "VALIDATION_ERROR",
                "errors": [{"field": "...", "message": "..."}, ...]
              }
            }

      * On success the validated model is forwarded to the wrapped
        handler as the keyword argument ``payload`` (the kwarg name is
        ``payload`` — do not rename). ``request.data`` is never mutated.

    Stack-order rule (Requirement 4E.23 / task 14.3): this decorator is
    the **innermost** authorization decorator on every mutating route::

        @some_bp.route('/...', methods=['POST'])
        @token_required                    # outermost — injects current_user
        @permission_required('users')      # admin guard + category gate
        @csrf_required                     # double-submit CSRF
        @validate_request(SomeSchema)      # innermost — produces payload kwarg
        def handler(current_user, payload, ...): ...

    Putting ``@validate_request`` innermost keeps unauthenticated /
    unauthorized requests from spending CPU on schema parsing and ensures
    the audit trail records authentication failures separately from input
    validation failures. The static decorator-stacking test
    (``server/tests/static/test_decorator_stacking.py``) enforces the
    invariant in CI.

    Raises:
        TypeError: at decoration time when ``schema`` is not a Pydantic
            ``BaseModel`` subclass. This catches the easy mistake of
            passing an instance, a string, or ``None`` instead of the
            schema class itself.
    """
    if not (isinstance(schema, type) and issubclass(schema, BaseModel)):
        raise TypeError(
            "validate_request(schema) requires a pydantic.BaseModel "
            f"subclass; got {schema!r}"
        )

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Read raw bytes per task contract; do NOT call
            # request.get_json() (it would re-parse and could mutate
            # internal Flask state if a body is consumed elsewhere).
            raw = request.data or b''
            # Tolerate empty bodies for empty-body schemas: an empty or
            # whitespace-only body is treated as ``{}`` so schemas like
            # ``LogoutSchema`` and ``ForceLogoutSchema`` validate without
            # the client having to send an explicit JSON object.
            if not raw.strip():
                raw = b'{}'

            try:
                payload = schema.model_validate_json(raw)
            except ValidationError as exc:
                errors = _serialize_pydantic_errors(exc)
                # Find the first extra_forbidden error (if any) — its
                # ``loc`` names the offending key. Pydantic v2 emits one
                # error record per extra key, so we surface the first.
                offending = next(
                    (
                        rec for rec in exc.errors()
                        if rec.get('type') == _PYDANTIC_EXTRA_FORBIDDEN
                    ),
                    None,
                )
                if offending is not None:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'UNKNOWN_FIELD',
                            'field': _format_loc(offending.get('loc', ())),
                            'errors': errors,
                        },
                    }), 400
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'errors': errors,
                    },
                }), 400

            # Success: hand the parsed model to the wrapped handler
            # under the documented kwarg name. Callers MUST accept
            # ``payload`` exactly (no rename).
            kwargs['payload'] = payload
            return f(*args, **kwargs)

        return decorated

    return decorator
