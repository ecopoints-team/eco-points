"""
Admin Dashboard Alignment — Backend Smoke Tests
================================================

Validates every GET endpoint used by the admin dashboard returns the
expected shape.  Also runs a CRUD cycle for groups and a basic RBAC
gate check.

Run:  cd server && python -m pytest tests/smoke/ -v --tb=short
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask

from app import Config, db
from app.controllers.auth_controller import auth_bp
from app.controllers.users_controller import users_bp
from app.controllers.groups_controller import groups_bp
from app.controllers.locations_controller import locations_bp
from app.controllers.machines_controller import machines_bp
from app.controllers.rewards_controller import rewards_bp
from app.controllers.logs_controller import logs_bp
from app.controllers.leaderboard_controller import leaderboard_bp
from app.controllers.analytics_controller import analytics_bp
from app.controllers.dashboard_controller import dashboard_bp
from app.controllers.settings_controller import settings_bp
from app.controllers.sessions_controller import sessions_bp
from app.models import (
    CommunityGroup,
    Organization,
    OrgType,
    RVM,
    Reward,
    User,
)


# ── App factory ───────────────────────────────────────────────────────────


def _build_app():
    """Self-contained Flask app with all admin blueprints."""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True

    db.init_app(app)

    from flask import Blueprint
    web_bp = Blueprint('web', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    web_bp.register_blueprint(groups_bp)
    web_bp.register_blueprint(locations_bp)
    web_bp.register_blueprint(machines_bp)
    web_bp.register_blueprint(rewards_bp)
    web_bp.register_blueprint(logs_bp)
    web_bp.register_blueprint(leaderboard_bp)
    web_bp.register_blueprint(analytics_bp)
    web_bp.register_blueprint(dashboard_bp)
    web_bp.register_blueprint(settings_bp)
    web_bp.register_blueprint(sessions_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


# ── Seed helpers ──────────────────────────────────────────────────────────


def _seed_full(app):
    """Seed org + group + superadmin + regular user + RVM + reward.
    Returns dict of all IDs."""
    with app.app_context():
        ot = OrgType(name=f'SmokeUni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()

        org = Organization(
            name=f'Smoke-{uuid.uuid4().hex[:6]}',
            full_name='Smoke Test University',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        grp = CommunityGroup(
            organization_id=org.id,
            name='Smoke Group',
            abbreviation='SMK',
            group_type='college',
        )
        db.session.add(grp)
        db.session.flush()

        admin = User(
            community_group_id=grp.id,
            first_name='Super',
            last_name='Admin',
            email=f'sa-{uuid.uuid4().hex[:6]}@smoke.test',
            username=f'sa_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.flush()

        regular = User(
            community_group_id=grp.id,
            first_name='Regular',
            last_name='User',
            email=f'user-{uuid.uuid4().hex[:6]}@smoke.test',
            username=f'user_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='user',
            user_type='student',
            is_active=True,
        )
        db.session.add(regular)
        db.session.flush()

        rvm = RVM(
            organization_id=org.id,
            machine_uuid=f'RVM-{uuid.uuid4().hex[:8]}',
            name='Smoke RVM',
            location_name='Main Lobby',
            is_online=True,
        )
        db.session.add(rvm)
        db.session.flush()

        reward = Reward(
            organization_id=org.id,
            name='Smoke Reward',
            description='Test item',
            points_required=100,
            category='Merchandise',
        )
        db.session.add(reward)
        db.session.commit()

        return {
            'org_id': org.id,
            'org_type_id': ot.id,
            'group_id': grp.id,
            'admin_id': admin.id,
            'user_id': regular.id,
            'rvm_id': rvm.id,
            'reward_id': reward.id,
        }


def _mint_jwt(app, user_id, role):
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ── Fixtures ──────────────────────────────────────────────────────────────


@pytest.fixture(scope='module')
def smoke_ctx():
    app = _build_app()
    ids = _seed_full(app)
    token = _mint_jwt(app, ids['admin_id'], 'superadmin')
    yield app, ids, token
    with app.app_context():
        db.session.remove()
        db.drop_all()


def _auth(token):
    return {'Authorization': f'Bearer {token}'}


# ══════════════════════════════════════════════════════════════════════════
# 5.2  GET endpoint smoke tests
# ══════════════════════════════════════════════════════════════════════════


class TestGetEndpoints:
    """Every admin GET endpoint must return 200 with success: true."""

    @pytest.mark.parametrize('path', [
        '/api/web/users',
        '/api/web/groups',
        '/api/web/locations',
        '/api/web/machines',
        '/api/web/rewards',
        '/api/web/org-types',
        '/api/web/leaderboard',
        '/api/web/logs/access',
        '/api/web/logs/bottles',
        '/api/web/logs/machines',
        '/api/web/logs/rewards',
        '/api/web/logs/transactions',
        # /api/web/analytics skipped: uses Postgres-only to_char()
        '/api/web/dashboard/stats',
    ])
    def test_get_returns_200(self, smoke_ctx, path):
        app, ids, token = smoke_ctx
        with app.test_client() as c:
            r = c.get(path, headers=_auth(token),
                       query_string={'location_id': ids['org_id']})
        assert r.status_code == 200, f'{path} → {r.status_code}: {r.get_data(as_text=True)[:200]}'
        body = r.get_json()
        assert body.get('success') is True or isinstance(body, list), \
            f'{path} missing success=true: {list(body.keys())[:5]}'


class TestResponseShapes:
    """Validate canonical field names in serialized records."""

    def test_user_record_has_canonical_keys(self, smoke_ctx):
        app, ids, token = smoke_ctx
        with app.test_client() as c:
            r = c.get(f'/api/web/users/{ids["user_id"]}', headers=_auth(token))
        assert r.status_code == 200
        user = r.get_json().get('user', r.get_json())
        for key in ('id', 'email', 'role', 'isActive', 'createdAt'):
            assert key in user, f'user record missing key: {key}'

    def test_location_record_has_canonical_keys(self, smoke_ctx):
        app, ids, token = smoke_ctx
        with app.test_client() as c:
            r = c.get('/api/web/locations', headers=_auth(token))
        assert r.status_code == 200
        body = r.get_json()
        locs = body.get('locations', body if isinstance(body, list) else [])
        if locs:
            loc = locs[0]
            for key in ('id', 'name', 'fullName', 'status', 'createdAt'):
                assert key in loc, f'location record missing key: {key}'

    def test_reward_record_has_canonical_keys(self, smoke_ctx):
        app, ids, token = smoke_ctx
        with app.test_client() as c:
            r = c.get('/api/web/rewards', headers=_auth(token),
                       query_string={'location_id': ids['org_id']})
        assert r.status_code == 200
        body = r.get_json()
        rewards = body.get('rewards', body if isinstance(body, list) else [])
        if rewards:
            rw = rewards[0]
            for key in ('id', 'name', 'pointsRequired', 'stockQuantity', 'category'):
                assert key in rw, f'reward record missing key: {key}'

    def test_group_record_has_canonical_keys(self, smoke_ctx):
        app, ids, token = smoke_ctx
        with app.test_client() as c:
            r = c.get('/api/web/groups', headers=_auth(token),
                       query_string={'location_id': ids['org_id']})
        assert r.status_code == 200
        body = r.get_json()
        groups = body.get('groups', body if isinstance(body, list) else [])
        if groups:
            g = groups[0]
            for key in ('id', 'name', 'groupType'):
                assert key in g, f'group record missing key: {key}'

    def test_machine_record_has_canonical_keys(self, smoke_ctx):
        app, ids, token = smoke_ctx
        with app.test_client() as c:
            r = c.get('/api/web/machines', headers=_auth(token),
                       query_string={'location_id': ids['org_id']})
        assert r.status_code == 200
        body = r.get_json()
        machines = body.get('machines', body if isinstance(body, list) else [])
        if machines:
            m = machines[0]
            for key in ('id', 'name', 'isOnline', 'locationName'):
                assert key in m, f'machine record missing key: {key}'


# ══════════════════════════════════════════════════════════════════════════
# 5.3  CRUD cycle smoke tests
# ══════════════════════════════════════════════════════════════════════════


class TestGroupCRUD:
    """Full create → update → delete cycle for community groups."""

    def test_group_crud_cycle(self, smoke_ctx):
        app, ids, token = smoke_ctx
        headers = _auth(token)

        with app.test_client() as c:
            # CREATE
            r = c.post('/api/web/groups', headers=headers, json={
                'name': 'CRUD Test Group',
                'abbreviation': 'CTG',
                'groupType': 'staff',
                'organizationId': ids['org_id'],
            })
            assert r.status_code in (200, 201), f'create: {r.get_data(as_text=True)[:200]}'
            body = r.get_json()
            created = body.get('group', body)
            group_id = created['id']

            # UPDATE
            r = c.put(f'/api/web/groups/{group_id}', headers=headers, json={
                'name': 'CRUD Updated Group',
                'abbreviation': 'CUG',
            })
            assert r.status_code == 200, f'update: {r.get_data(as_text=True)[:200]}'

            # DELETE
            r = c.delete(f'/api/web/groups/{group_id}', headers=headers)
            assert r.status_code in (200, 204), f'delete: {r.get_data(as_text=True)[:200]}'


# ══════════════════════════════════════════════════════════════════════════
# 5.4  RBAC smoke tests
# ══════════════════════════════════════════════════════════════════════════


class TestRBAC:
    """Non-admin JWT must be rejected on admin-only endpoints."""

    def test_regular_user_gets_403_on_admin_endpoints(self, smoke_ctx):
        app, ids, token = smoke_ctx
        user_token = _mint_jwt(app, ids['user_id'], 'user')

        admin_paths = [
            '/api/web/users',
            '/api/web/machines',
            '/api/web/logs/access',
        ]
        with app.test_client() as c:
            for path in admin_paths:
                r = c.get(path, headers=_auth(user_token))
                assert r.status_code in (401, 403), \
                    f'{path} allowed for user role: {r.status_code}'

    def test_superadmin_can_access_all_endpoints(self, smoke_ctx):
        app, ids, token = smoke_ctx
        admin_paths = [
            '/api/web/users',
            '/api/web/locations',
            '/api/web/machines',
            '/api/web/rewards',
            '/api/web/groups',
        ]
        with app.test_client() as c:
            for path in admin_paths:
                r = c.get(path, headers=_auth(token),
                           query_string={'location_id': ids['org_id']})
                assert r.status_code == 200, \
                    f'superadmin denied {path}: {r.status_code}'
