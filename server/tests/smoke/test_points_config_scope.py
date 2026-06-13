"""
Phase 31 — Points Config "BAD REQUEST" Fix — Backend Smoke/Property Tests
=========================================================================

Validates Requirements 31.1, 31.2, 31.5, 31.6:

- GET /api/web/settings/points returns 200 + default config when no
  location scope is resolvable (superadmin, no ?location_id).
- The returned defaults match BOTTLE_PRICING exactly.
- A scoped GET returns the org's persisted config unchanged.
- PUT /api/web/settings/points still requires a location scope (400).

Run:  cd server && python -m pytest tests/smoke/test_points_config_scope.py -v --tb=short
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Blueprint, Flask

from app import Config, db
from app.controllers.auth_controller import auth_bp
from app.controllers.settings_controller import settings_bp
from app.models import (
    CommunityGroup,
    NotificationSetting,
    Organization,
    OrgType,
    User,
)


# Defaults must match settings_controller.get_points_config DEFAULTS
# and the seeder BOTTLE_PRICING (Requirement 31.2).
EXPECTED_DEFAULTS = {
    'smallWithLabel': 5, 'smallNoLabel': 3,
    'mediumWithLabel': 8, 'mediumNoLabel': 5,
    'largeWithLabel': 10, 'largeNoLabel': 7,
}


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
    app.register_blueprint(auth_bp)
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
# 31.1 / 31.2 — GET with no location scope → 200 + defaults
# ══════════════════════════════════════════════════════════════════════════


class TestNoScope:
    def test_get_no_scope_returns_200(self, ctx):
        """Requirement 31.1: no 400 when no location scope."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token))
        assert r.status_code == 200, r.get_data(as_text=True)[:200]
        assert r.get_json().get('success') is True

    def test_get_no_scope_returns_exact_defaults(self, ctx):
        """Requirement 31.2: returns the exact default config."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token))
        assert r.status_code == 200
        assert r.get_json().get('config') == EXPECTED_DEFAULTS


# ══════════════════════════════════════════════════════════════════════════
# 31.5 — Scoped GET returns the org's persisted config
# ══════════════════════════════════════════════════════════════════════════


class TestScopedGet:
    def test_scoped_get_returns_persisted_config(self, ctx):
        """Requirement 31.5: scoped GET returns the org's persisted config."""
        app, ids, token = ctx
        persisted = {
            'smallWithLabel': 1, 'smallNoLabel': 2,
            'mediumWithLabel': 3, 'mediumNoLabel': 4,
            'largeWithLabel': 6, 'largeNoLabel': 9,
        }
        with app.app_context():
            db.session.add(NotificationSetting(
                organization_id=ids['org_id'],
                alert_key='config_points',
                email_enabled=False,
                sms_enabled=False,
                recipients_json=json.dumps(persisted),
                is_active=True,
            ))
            db.session.commit()

        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token),
                      query_string={'location_id': ids['org_id']})
        assert r.status_code == 200, r.get_data(as_text=True)[:200]
        assert r.get_json().get('config') == persisted

    def test_scoped_get_unconfigured_org_returns_defaults(self, ctx):
        """A scoped org with no persisted row still gets defaults at 200."""
        app, ids, token = ctx
        # Fresh org with no config_points row.
        with app.app_context():
            ot = OrgType(name=f'PtsUni2-{uuid.uuid4().hex[:6]}')
            db.session.add(ot)
            db.session.flush()
            org2 = Organization(
                name=f'Pts2-{uuid.uuid4().hex[:6]}',
                full_name='Points Test Org 2',
                type_id=ot.id,
                status='Active',
            )
            db.session.add(org2)
            db.session.commit()
            org2_id = org2.id

        with app.test_client() as c:
            r = c.get('/api/web/settings/points', headers=_auth(token),
                      query_string={'location_id': org2_id})
        assert r.status_code == 200
        assert r.get_json().get('config') == EXPECTED_DEFAULTS


# ══════════════════════════════════════════════════════════════════════════
# 31.6 — PUT still requires a location scope
# ══════════════════════════════════════════════════════════════════════════


class TestPutStillStrict:
    def test_put_no_scope_returns_400(self, ctx):
        """Requirement 31.6: PUT behavior unchanged — 400 with no scope."""
        app, ids, token = ctx
        with app.test_client() as c:
            r = c.put('/api/web/settings/points', headers=_auth(token), json={
                'smallWithLabel': 5, 'smallNoLabel': 3,
                'mediumWithLabel': 8, 'mediumNoLabel': 5,
                'largeWithLabel': 10, 'largeNoLabel': 7,
            })
        assert r.status_code == 400, r.get_data(as_text=True)[:200]
        body = r.get_json()
        assert body.get('success') is False
