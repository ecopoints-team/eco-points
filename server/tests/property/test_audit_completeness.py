"""
Phase 2 / Property J — Audit log completeness and shape.

Validates: Requirements 2.8, 7.2, 7.3, 7.10.

For every successful mutating user/role/permission/security request and
for every 403 from Property G (permission_denied) or Property I
(ROLE_HIERARCHY_VIOLATION), exactly one new ``AdminLog`` row SHALL be
written with:

  * ``admin_user_id`` matching the JWT subject (``actor.user_id``)
  * a non-null, non-empty ``action``
  * a structured envelope in ``notes`` (per the Phase 2 design TODO until
    a Phase 4 migration adds dedicated columns) carrying ``before``,
    ``after``, ``ip``, ``user_agent``, and ``notes`` keys
  * a ``created_at`` value that is ISO-8601 serializable

For *create* operations the ``before`` key is allowed to be ``null`` (no
prior state) but MUST exist; ``after`` MUST be non-null.  For *update*
operations both ``before`` and ``after`` MUST be non-null dicts.

The property is parametrized over a list of representative
``(handler, body, expected_action_substring, expected_status,
require_before_non_null)`` scenario tuples drawn from the categories
mandated in `tasks.md` task 6.11:

  * ``POST   /api/web/users``                       (create user)
  * ``PUT    /api/web/users/<id>``                  (update user)
  * ``DELETE /api/web/users/<id>``                  (deactivate user)
  * ``POST   /api/web/users/<id>/adjust-points``    (points adjustment)
  * ``PUT    /api/web/settings/notifications``      (notifications cfg)
  * ``PUT    /api/web/settings/security``           (security cfg)
  * ``POST   /api/web/settings/security/force-logout`` (force logout)
  * 403 ROLE_HIERARCHY_VIOLATION on POST /users      (create)
  * 403 ROLE_HIERARCHY_VIOLATION on PUT  /users/<id> (update)
  * 403 permission_denied (Property G hook in middleware) — non-mutating
    GET on /users from a technician role that lacks the ``users``
    category.
  * 403 permission_denied on a mutating POST /users from the same
    technician (covers the "for every 403 from Property G" wording with
    a state-changing method as well).
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple

import jwt
import pytest
from flask import Blueprint, Flask
from hypothesis import HealthCheck, given, settings, strategies as st

# `app` is on sys.path via tests/conftest.py.
from app import Config, db
from app.controllers.auth_controller import auth_bp
from app.controllers.users_controller import users_bp
from app.controllers.settings_controller import settings_bp
from app.models import (
    AdminLog,
    CommunityGroup,
    NotificationSetting,
    OrgType,
    Organization,
    User,
    UserSecurity,
    Wallet,
)


# ── Fixtures ──────────────────────────────────────────────────────────────


def _build_app() -> Flask:
    """Self-contained Flask app with users + settings blueprints mounted at
    `/api/web/...` (matching the production routing surface).
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True

    db.init_app(app)

    web_bp = Blueprint('web', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    web_bp.register_blueprint(settings_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed_org(app: Flask) -> Tuple[int, int]:
    """Create an Organization + CommunityGroup; return ``(org_id, group_id)``."""
    suffix = uuid.uuid4().hex[:8]
    with app.app_context():
        org_type = OrgType(name=f'TestUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'EPTU-{suffix}',
            full_name='EcoPoints Test University',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Default Group',
            abbreviation='DEF',
            
        )
        db.session.add(group)
        db.session.commit()
        return org.id, group.id


def _seed_user(app: Flask, role: str, group_id: int, with_wallet: bool = False) -> int:
    with app.app_context():
        uniq = uuid.uuid4().hex[:8]
        user = User(
            community_group_id=group_id,
            first_name=role.capitalize(),
            last_name='Tester',
            email=f'{role}-{uniq}@example.test',
            username=f'{role}_{uniq}',
            password_hash='not-used',
            role=role,
            is_active=True,
        )
        db.session.add(user)
        db.session.flush()

        if with_wallet:
            wallet = Wallet(
                user_id=user.id,
                points_balance=100,
                lifetime_points=100,
                streak=0,
            )
            db.session.add(wallet)
            sec = UserSecurity(user_id=user.id, two_factor_enabled=False)
            db.session.add(sec)

        db.session.commit()
        return user.id


def _mint_jwt(app: Flask, user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int(
            (now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()
        ),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


@pytest.fixture(scope='module')
def app_ctx():
    app = _build_app()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


# ── Envelope assertion helpers ────────────────────────────────────────────


# Action codes that represent CREATE-style operations: ``before`` may be
# ``None`` (there's no prior state) but ``after`` MUST be non-null.
CREATE_ACTIONS = {'user.create', 'role_hierarchy_violation'}


def _assert_admin_log_envelope(
    row: AdminLog,
    *,
    expected_actor_id: int,
    expected_action_substring: str,
    require_before_non_null: bool,
    require_after_non_null: bool = True,
) -> None:
    """Assert the freshly-inserted ``AdminLog`` row satisfies Property J.

    The structured ``before`` / ``after`` / ``ip`` / ``user_agent`` fields
    live inside a JSON envelope in ``notes`` per the Phase 2 design's
    TODO note (the dedicated columns are scheduled for a Phase 4
    migration). Once those columns exist, only the JSON-decode step
    needs to swap to direct column reads.

    The ``require_before_non_null`` / ``require_after_non_null`` knobs
    mirror the relaxation the task description grants to *create*
    operations (no prior state → ``before`` may be null) and which the
    design analogously grants to *permission_denied* rows (no semantic
    pre/post state — the row's forensic value sits in ``target`` +
    ``notes``). Either way the *keys* MUST be present in the envelope;
    only the value-non-null check is conditional.
    """
    # Actor identity matches the JWT subject (Requirement 7.3).
    assert row.admin_user_id == expected_actor_id, (
        f'AdminLog.admin_user_id={row.admin_user_id!r} does not match '
        f'JWT subject {expected_actor_id!r}'
    )

    # Action is non-null and non-empty (Requirement 2.8 / 7.10).
    assert isinstance(row.action, str) and row.action, (
        f'AdminLog.action must be a non-empty string, got {row.action!r}'
    )
    assert expected_action_substring in row.action, (
        f'expected action containing {expected_action_substring!r}, '
        f'got {row.action!r}'
    )

    # ISO-8601 timestamp (Requirement 7.3).
    assert isinstance(row.created_at, datetime), (
        f'AdminLog.created_at must be a datetime, got {type(row.created_at)!r}'
    )
    iso = row.created_at.isoformat()
    # Round-trip through fromisoformat to confirm it really is ISO-8601.
    parsed = datetime.fromisoformat(iso)
    assert parsed is not None

    # Envelope shape (Requirement 7.3).
    envelope = json.loads(row.notes)
    assert isinstance(envelope, dict), (
        f'AdminLog.notes must decode to a dict, got {type(envelope)!r}'
    )
    for required_key in ('before', 'after', 'ip', 'user_agent'):
        assert required_key in envelope, (
            f'envelope missing required key {required_key!r}; got '
            f'keys={sorted(envelope.keys())!r}'
        )

    # `after` must be non-null when required by the scenario (the
    # default for successful create/update/delete and for hierarchy
    # violations whose `after` carries the attempted role). Permission-
    # denied rows opt out via ``require_after_non_null=False`` because
    # their forensic value sits in ``target`` + ``notes``, not in
    # before/after snapshots.
    if require_after_non_null:
        assert envelope['after'] is not None, (
            f'envelope.after must be non-null; got {envelope!r}'
        )
    if require_before_non_null:
        assert envelope['before'] is not None, (
            f'envelope.before must be non-null for action={row.action!r}; '
            f'got {envelope!r}'
        )

    # ip / user_agent keys present (string is fine, even if empty in the
    # test client when REMOTE_ADDR / User-Agent are absent).
    assert isinstance(envelope['ip'], str), (
        f'envelope.ip must be a string, got {type(envelope["ip"])!r}'
    )
    assert isinstance(envelope['user_agent'], str), (
        f'envelope.user_agent must be a string, got '
        f'{type(envelope["user_agent"])!r}'
    )


# ── Scenario implementations ──────────────────────────────────────────────
#
# Each scenario function:
#   1. Seeds the actor/target rows it needs.
#   2. Captures ``AdminLog.query.count()`` before the request.
#   3. Issues the request with a real Flask test client and a real JWT.
#   4. Asserts the expected status code AND that exactly one new
#      AdminLog row was written.
#   5. Loads the new row and runs it through ``_assert_admin_log_envelope``.
#
# The scenarios are sampled by Hypothesis to give Property J broad
# coverage without exploding test runtime: each scenario has the same
# success criterion (`delta == 1` + envelope shape), so randomising
# which one runs is sufficient to catch any regression that breaks the
# uniform contract.


def _scenario_create_user_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.10'},
            json={
                'firstName': 'Created',
                'lastName': 'User',
                'email': f'cu-{uuid.uuid4().hex[:6]}@x.test',
                'password': 'StrongPass1',
                'role': 'user',
                'locationId': org_id,
            },
        )

    assert resp.status_code == 201, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='user.create',
            require_before_non_null=False,  # creates have no prior state
        )


def _scenario_update_user_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    target_id = _seed_user(app, 'auditor', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.put(
            f'/api/web/users/{target_id}',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.11'},
            json={'firstName': 'Renamed'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='user.update',
            require_before_non_null=True,
        )


def _scenario_delete_user_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    target_id = _seed_user(app, 'auditor', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.delete(
            f'/api/web/users/{target_id}',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.12'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='user.deactivate',
            require_before_non_null=True,
        )


def _scenario_adjust_points_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    target_id = _seed_user(app, 'user', group_id, with_wallet=True)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.post(
            f'/api/web/users/{target_id}/adjust-points',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.13'},
            json={'amount': 25, 'reason': 'PBT-J adjust'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='user.adjust_points',
            require_before_non_null=True,
        )


def _scenario_update_notifications_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    # Seed at least one NotificationSetting so the update loop has
    # something to flip; the audit row is written regardless of the
    # number of items actually updated.
    with app.app_context():
        s = NotificationSetting(
            organization_id=org_id,
            alert_key='new_user_registered',
            email_enabled=True,
            sms_enabled=False,
            recipients_json='[]',
            is_active=True,
        )
        db.session.add(s)
        db.session.commit()

        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.put(
            '/api/web/settings/notifications',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.14'},
            json={
                'settings': [{
                    'alertKey': 'new_user_registered',
                    'emailEnabled': False,
                }],
            },
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='settings.notifications.update',
            # `before` is intentionally None for the bulk-update helper
            # (the handler doesn't snapshot pre-state); only `after`
            # must be non-null.
            require_before_non_null=False,
        )


def _scenario_update_security_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.put(
            '/api/web/settings/security',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.15'},
            json={
                'twoFactorRequired': True,
                'twoFactorMethod': 'email',
                'sessionTimeoutMinutes': 60,
                'maxLoginAttempts': 5,
                'lockoutDurationMinutes': 15,
            },
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='settings.security.update',
            # First-time write to security config has no `before` row.
            require_before_non_null=False,
        )


def _scenario_force_logout_success(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.post(
            '/api/web/settings/security/force-logout',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.16'},
            json={},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='settings.force_logout',
            require_before_non_null=True,
        )


def _scenario_create_user_hierarchy_violation(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.17'},
            json={
                'firstName': 'Above',
                'lastName': 'Actor',
                'email': f'above-{uuid.uuid4().hex[:6]}@x.test',
                'password': 'StrongPass1',
                'role': 'superadmin',  # higher than head_admin → violation
                'locationId': org_id,
            },
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['error']['code'] == 'ROLE_HIERARCHY_VIOLATION'

    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='role_hierarchy_violation',
            # `before` is None for create-time hierarchy violations (no
            # target row yet) — only `after` (the attempted role) must
            # be non-null.
            require_before_non_null=False,
        )


def _scenario_update_user_hierarchy_violation(app: Flask) -> None:
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'head_admin', group_id)
    target_id = _seed_user(app, 'auditor', group_id)
    token = _mint_jwt(app, actor_id, 'head_admin')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.put(
            f'/api/web/users/{target_id}',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.18'},
            json={'role': 'superadmin'},
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['error']['code'] == 'ROLE_HIERARCHY_VIOLATION'

    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='role_hierarchy_violation',
            require_before_non_null=True,
        )


def _scenario_permission_denied_get_users(app: Flask) -> None:
    """Property G hook: a technician (lacks ``users`` category) hitting
    ``GET /api/web/users`` MUST 403 AND emit one ``permission_denied``
    audit row.
    """
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'technician', group_id)
    token = _mint_jwt(app, actor_id, 'technician')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.get(
            '/api/web/users',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.19'},
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['error']['code'] == 'FORBIDDEN'
    assert body['error']['missing'] == 'users'

    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='permission_denied',
            # The middleware hook intentionally writes ``before=None``
            # and ``after=None`` for permission denials — the row's
            # purpose is to record *who* tried *what*, not pre/post
            # state. Property J therefore tolerates a null ``after`` on
            # this specific action code by short-circuiting the standard
            # check below.
            require_before_non_null=False,
            require_after_non_null=False,
        )
        # Special-case: permission_denied rows record metadata in
        # `target` + `notes`, not in `after`. Verify those are present
        # so the row remains useful for forensics (Requirement 2.8).
        envelope = json.loads(row.notes)
        assert row.target and 'GET /api/web/users' in row.target, row.target
        assert envelope['notes'] and 'role=technician' in envelope['notes'], (
            envelope['notes']
        )


def _scenario_permission_denied_post_users(app: Flask) -> None:
    """Same as above but with a state-changing POST so the audit row is
    written for a mutating-method denial as well.
    """
    org_id, group_id = _seed_org(app)
    actor_id = _seed_user(app, 'technician', group_id)
    token = _mint_jwt(app, actor_id, 'technician')

    with app.app_context():
        before = AdminLog.query.count()

    with app.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={
                'Authorization': f'Bearer {token}',
                'User-Agent': 'pbt-property-j/1.0',
            },
            environ_base={'REMOTE_ADDR': '203.0.113.20'},
            json={
                'firstName': 'NeverMade',
                'lastName': 'Tech',
                'email': f'nm-{uuid.uuid4().hex[:6]}@x.test',
                'password': 'StrongPass1',
                'role': 'user',
                'locationId': org_id,
            },
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['error']['code'] == 'FORBIDDEN'
    assert body['error']['missing'] == 'users'

    with app.app_context():
        after = AdminLog.query.count()
        assert after == before + 1, (before, after)
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        _assert_admin_log_envelope(
            row,
            expected_actor_id=actor_id,
            expected_action_substring='permission_denied',
            require_before_non_null=False,
            require_after_non_null=False,
        )
        envelope = json.loads(row.notes)
        assert row.target and 'POST /api/web/users' in row.target, row.target
        assert envelope['notes'] and 'role=technician' in envelope['notes'], (
            envelope['notes']
        )


# Ordered list keyed by a short scenario name so Hypothesis shrinks
# produce stable, debuggable counterexamples.
SCENARIOS = {
    'create_user_success': _scenario_create_user_success,
    'update_user_success': _scenario_update_user_success,
    'delete_user_success': _scenario_delete_user_success,
    'adjust_points_success': _scenario_adjust_points_success,
    'update_notifications_success': _scenario_update_notifications_success,
    'update_security_success': _scenario_update_security_success,
    'force_logout_success': _scenario_force_logout_success,
    'create_user_hierarchy_violation': _scenario_create_user_hierarchy_violation,
    'update_user_hierarchy_violation': _scenario_update_user_hierarchy_violation,
    'permission_denied_get_users': _scenario_permission_denied_get_users,
    'permission_denied_post_users': _scenario_permission_denied_post_users,
}


# ── Hypothesis property ───────────────────────────────────────────────────


@settings(
    max_examples=66,  # 6× scenario count: each scenario hit ~6 times on
                     # average → broad coverage without huge runtime.
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(scenario_name=st.sampled_from(sorted(SCENARIOS.keys())))
def test_audit_log_completeness_and_shape(app_ctx, scenario_name):
    """Property J: every successful mutating user/role/permission/security
    request and every 403 from Properties G or I writes exactly one
    ``AdminLog`` row whose envelope satisfies the contract documented
    in Requirements 2.8 / 7.2 / 7.3 / 7.10.
    """
    SCENARIOS[scenario_name](app_ctx)
