"""
Unit tests for Phase 2 / Task 6.8 — `log_action()` helper in
`server/app/controllers/_shared.py` plus its 403 hook in
`@permission_required`.

Validates: Requirements 2.8, 7.2, 7.3.

The helper writes one `AdminLog` row per call capturing:
  - actor_user_id (admin_user_id column)
  - action
  - target (string-stringified from str / model / None)
  - category
  - structured envelope in `notes`:
      { before, after, ip, user_agent, notes }

Until a Phase 4 migration adds dedicated `before_json` / `after_json` /
`ip` / `user_agent` columns to `AdminLog`, those fields are folded into
the JSON envelope written into `notes`. These tests pin that contract
so the Phase 4 column split can land without changing call-sites.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, jsonify

# `app` is on sys.path via tests/conftest.py.
from app import Config, db
from app.controllers._shared import log_action, _log_action, _stringify_target
from app.middleware import token_required, permission_required
from app.models import AdminLog, CommunityGroup, OrgType, Organization, User


# ── Fixtures ──────────────────────────────────────────────────────────────


def _build_app():
    """Build a self-contained Flask app with a single stub route protected
    by `@token_required` + `@permission_required('users')` so the
    middleware's 403 hook can be exercised end-to-end.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS

    db.init_app(app)

    @app.route('/stub/users', methods=['GET'])
    @token_required
    @permission_required('users')
    def _stub_users(current_user):
        return jsonify({'success': True}), 200

    with app.app_context():
        db.create_all()
    return app


def _seed_user(app, role: str) -> int:
    with app.app_context():
        uniq = uuid.uuid4().hex[:8]
        ot = OrgType(name=f'TestUni-{uniq}')
        db.session.add(ot)
        db.session.flush()
        org = Organization(name=f'EPTU-{uniq}', full_name='Test U',
                           type_id=ot.id, status='Active')
        db.session.add(org)
        db.session.flush()
        cg = CommunityGroup(organization_id=org.id, name='Default', abbreviation='DEF')
        db.session.add(cg)
        db.session.flush()
        u = User(community_group_id=cg.id, first_name=role.capitalize(),
                 last_name='Tester', email=f'{role}-{uniq}@x.test',
                 username=f'{role}_{uniq}', password_hash='-',
                 role=role, is_active=True)
        db.session.add(u)
        db.session.commit()
        return u.id


def _mint_jwt(app, user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            'user_id': user_id,
            'role': role,
            'iat': int(now.timestamp()),
            'exp': int((now + timedelta(hours=1)).timestamp()),
            'jti': uuid.uuid4().hex,
        },
        app.config['SECRET_KEY'],
        algorithm='HS256',
    )


@pytest.fixture(scope='module')
def app_ctx():
    app = _build_app()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


# ── _stringify_target ─────────────────────────────────────────────────────


def test_stringify_target_handles_none_string_and_model(app_ctx):
    """`_stringify_target` must accept None, plain strings, and ORM objects."""
    assert _stringify_target(None) is None
    assert _stringify_target('hello') == 'hello'

    user_id = _seed_user(app_ctx, 'auditor')
    with app_ctx.app_context():
        u = db.session.get(User, user_id)
        assert _stringify_target(u) == u.name


# ── log_action: envelope shape ────────────────────────────────────────────


def test_log_action_writes_one_admin_log_row_with_structured_envelope(app_ctx):
    """log_action MUST write exactly one AdminLog row with action/target/
    category populated AND a JSON envelope in `notes` carrying before/
    after/ip/user_agent/notes.
    """
    actor_id = _seed_user(app_ctx, 'head_admin')
    target_id = _seed_user(app_ctx, 'user')
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.test_request_context(
        '/some/path',
        method='POST',
        headers={
            'Authorization': f'Bearer {token}',
            'User-Agent': 'pytest/1.0',
        },
        environ_base={'REMOTE_ADDR': '203.0.113.7'},
    ), app_ctx.app_context():
        actor = db.session.get(User, actor_id)
        target = db.session.get(User, target_id)
        expected_target_name = target.name
        before_count = AdminLog.query.count()

        log_action(
            actor,
            'user.update',
            target=target,
            before={'role': 'user', 'is_active': True},
            after={'role': 'auditor', 'is_active': True},
            category='users',
            notes='promotion',
        )
        db.session.commit()

        assert AdminLog.query.count() == before_count + 1
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        target_str = row.target
        envelope = json.loads(row.notes)

    assert row.admin_user_id == actor_id
    assert row.action == 'user.update'
    assert target_str == expected_target_name
    assert row.category == 'users'
    assert isinstance(row.created_at, datetime), row.created_at

    assert envelope['before'] == {'role': 'user', 'is_active': True}
    assert envelope['after'] == {'role': 'auditor', 'is_active': True}
    assert envelope['ip'] == '203.0.113.7'
    assert envelope['user_agent'] == 'pytest/1.0'
    assert envelope['notes'] == 'promotion'


def test_log_action_encodes_none_before_and_after_as_json_null(app_ctx):
    """`before=None` / `after=None` must serialize to JSON `null`, not the
    string "None", so downstream consumers can parse the envelope safely.
    """
    actor_id = _seed_user(app_ctx, 'superadmin')

    with app_ctx.test_request_context(
        '/x', method='GET', environ_base={'REMOTE_ADDR': '10.0.0.1'},
    ), app_ctx.app_context():
        actor = db.session.get(User, actor_id)
        log_action(actor, 'noop', target=None, before=None, after=None,
                   category='users')
        db.session.commit()

        row = AdminLog.query.order_by(AdminLog.id.desc()).first()

    envelope = json.loads(row.notes)
    assert envelope['before'] is None
    assert envelope['after'] is None
    # `target=None` should leave the column NULL, not the string "None".
    assert row.target is None


def test_log_action_does_not_commit_by_itself(app_ctx):
    """The helper must `db.session.add(...)` only; the caller commits.

    Rolling back after a `log_action` call MUST leave the AdminLog table
    unchanged so failed mutating handlers don't leak audit rows.
    """
    actor_id = _seed_user(app_ctx, 'head_admin')

    with app_ctx.test_request_context(
        '/y', method='POST', environ_base={'REMOTE_ADDR': '127.0.0.1'},
    ), app_ctx.app_context():
        actor = db.session.get(User, actor_id)
        before_count = AdminLog.query.count()
        log_action(actor, 'rolled.back', target='x', category='users')
        db.session.rollback()
        assert AdminLog.query.count() == before_count


def test_legacy_log_action_shim_routes_through_log_action(app_ctx):
    """`_log_action` is retained for backward compatibility and must produce
    the same JSON envelope shape as `log_action` so existing callers
    (rewards, machines, locations, groups, logs, sessions) write
    consistent rows.
    """
    actor_id = _seed_user(app_ctx, 'head_admin')

    with app_ctx.test_request_context(
        '/z', method='POST',
        headers={'User-Agent': 'legacy/1.0'},
        environ_base={'REMOTE_ADDR': '198.51.100.5'},
    ), app_ctx.app_context():
        actor = db.session.get(User, actor_id)
        _log_action(actor, 'legacy.action', target='widget#7',
                    category='rewards', notes='via shim')
        db.session.commit()

        row = AdminLog.query.order_by(AdminLog.id.desc()).first()

    assert row.action == 'legacy.action'
    assert row.target == 'widget#7'
    assert row.category == 'rewards'
    envelope = json.loads(row.notes)
    assert envelope == {
        'before': None,
        'after': None,
        'ip': '198.51.100.5',
        'user_agent': 'legacy/1.0',
        'notes': 'via shim',
    }


# ── permission_required 403 hook (Property G audit-write) ─────────────────


def test_permission_denied_writes_audit_row(app_ctx):
    """When `@permission_required('users')` rejects an admin role that
    lacks the category, ONE AdminLog row MUST be written with
    action='permission_denied', category=<missing>, target carrying the
    HTTP method + path, and notes mentioning the role.
    """
    # `technician` has {'machines','logs','settings','dashboard'} per
    # ROLE_PERMISSIONS — it lacks 'users', so the stub route MUST 403.
    actor_id = _seed_user(app_ctx, 'technician')
    token = _mint_jwt(app_ctx, actor_id, 'technician')

    with app_ctx.app_context():
        before_count = AdminLog.query.count()

    with app_ctx.test_client() as client:
        resp = client.get('/stub/users', headers={
            'Authorization': f'Bearer {token}',
            'User-Agent': 'pbt/0.1',
        })

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['error']['code'] == 'FORBIDDEN'
    assert body['error']['missing'] == 'users'

    with app_ctx.app_context():
        assert AdminLog.query.count() == before_count + 1
        row = AdminLog.query.order_by(AdminLog.id.desc()).first()
        assert row.admin_user_id == actor_id
        assert row.action == 'permission_denied'
        assert row.category == 'users'
        assert row.target == 'GET /stub/users'
        envelope = json.loads(row.notes)
        assert envelope['notes'] == 'role=technician'
        assert envelope['user_agent'] == 'pbt/0.1'


def test_permission_granted_does_not_write_audit_row(app_ctx):
    """Successful authorization MUST NOT trigger a permission_denied row.
    Only the explicit `log_action` call inside the handler should write
    audit rows on the success path.
    """
    actor_id = _seed_user(app_ctx, 'head_admin')
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.app_context():
        before_count = AdminLog.query.count()

    with app_ctx.test_client() as client:
        resp = client.get('/stub/users',
                          headers={'Authorization': f'Bearer {token}'})

    assert resp.status_code == 200
    with app_ctx.app_context():
        assert AdminLog.query.count() == before_count
