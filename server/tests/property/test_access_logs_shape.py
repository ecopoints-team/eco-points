"""Characterization test: get_access_logs output shape is stable.

Uses the same app/seed/JWT pattern as tests/smoke/test_admin_smoke.py.
Calls GET /api/web/logs/access and asserts the response is a 200 with a
list of dicts carrying the canonical keys. This guards the Phase B
optimization from changing the serialized contract.
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
from app.controllers.logs_controller import logs_bp
from app.models import CommunityGroup, Organization, OrgType, User


def _build_app():
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
    web_bp.register_blueprint(logs_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'LogsTest-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()

        org = Organization(
            name=f'Logs-{uuid.uuid4().hex[:6]}',
            full_name='Logs Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        grp = CommunityGroup(organization_id=org.id, name='LG', abbreviation='LG')
        db.session.add(grp)
        db.session.flush()

        admin = User(
            community_group_id=grp.id,
            first_name='Log',
            last_name='Admin',
            email=f'logadmin-{uuid.uuid4().hex[:6]}@test.test',
            username=f'logadmin_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        return {'admin_id': admin.id, 'org_id': org.id}


def _mint_jwt(app, user_id, role='superadmin'):
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


@pytest.fixture(scope='module')
def logs_ctx():
    app = _build_app()
    ids = _seed(app)
    token = _mint_jwt(app, ids['admin_id'])
    yield app, ids, token
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_access_logs_returns_canonical_shape(logs_ctx):
    app, ids, token = logs_ctx
    with app.test_client() as c:
        resp = c.get(
            '/api/web/logs/access',
            headers={'Authorization': f'Bearer {token}'},
            query_string={'location_id': ids['org_id']},
        )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['success'] is True
    assert isinstance(body['logs'], list)
    if body['logs']:
        row = body['logs'][0]
        for key in ('id', 'adminName', 'action', 'category', 'timestamp'):
            assert key in row, f'missing key {key} in {row}'
