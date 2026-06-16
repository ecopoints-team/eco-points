"""
Points Config Smoke Tests
=========================

Now that points are FIXED (not configurable), these tests verify:

- GET /api/web/settings/points always returns 200 + the fixed BOTTLE_POINTS constant.
- The values match server/app/constants.py::BOTTLE_POINTS exactly.
- PUT /api/web/settings/points no longer exists (405 Method Not Allowed).

Run:  cd server && python -m pytest tests/smoke/test_points_config_scope.py -v --tb=short
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Blueprint, Flask

from app import Config, db
from app.constants import BOTTLE_POINTS
from app.controllers.settings_controller import settings_bp
from app.models import CommunityGroup, Organization, OrgType, User


# ── App factory ───────────────────────────────────────────────────────────


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True

    db.init_app(app)

    web_bp = Blueprint('web', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(settings_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'PtsUni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()
        org = Organization(
            name=f'Pts-{uuid.uuid4().hex[:6]}',
            full_name='Points Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()
        grp = CommunityGroup(
            organization_id=org.id,
            name='Pts Group',
            abbreviation='PTS',
            group_type='college',
        )
        db.session.add(grp)
        db.session.flush()
        admin = User(
            community_group_id=grp.id,
            first_name='Super',
            last_name='Admin',
            email=f'sa-{uuid.uuid4().hex[:6]}@pts.test',
            username=f'sa_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        return {'org_id': org.id, 'admin_id': admin.id}


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


def _auth(token):
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='module')
def ctx():
    app = _build_app()
    ids = _seed(app)
    token = _mint_jwt(app, ids['admin_id'], 'superadmin')
    yield app, ids, token
    with app.app_context():
        db.session.remove()
        db.drop_all()


# ══════════════════════════════════════════════════════════════════════════
# GET always returns the fixed BOTTLE_POINTS constant
# ══════════════════════════════════════════════════════════════════════════


class TestFixedPoints:
    def test_get_returns_200(self, ctx):
        """GET /api/web/settings/points returns 200."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token))
        assert r.status_code == 200, r.get_data(as_text=True)[:200]
        assert r.get_json().get('success') is True

    def test_get_returns_fixed_bottle_points(self, ctx):
        """GET returns exactly BOTTLE_POINTS — no per-org overrides."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token))
        assert r.status_code == 200
        assert r.get_json().get('config') == BOTTLE_POINTS

    def test_get_with_scope_still_returns_fixed_points(self, ctx):
        """Scoped GET also returns the fixed constant (no DB lookup)."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token),
                      query_string={'location_id': ids['org_id']})
        assert r.status_code == 200
        assert r.get_json().get('config') == BOTTLE_POINTS

    def test_put_no_longer_exists(self, ctx):
        """PUT /api/web/settings/points is removed — returns 405."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.put('/api/web/settings/points', headers=_auth(token), json={})
        assert r.status_code == 405, (
            f'PUT should be 405 Method Not Allowed; got {r.status_code}: '
            f'{r.get_data(as_text=True)[:200]}'
        )
