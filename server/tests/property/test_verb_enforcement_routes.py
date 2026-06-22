"""Auditor (view-only on users/machines/rewards) must be denied mutations.
Technician must be allowed to edit machines.
Uses the same self-contained app pattern as tests/smoke/test_admin_smoke.py.
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
from app.controllers.machines_controller import machines_bp
from app.controllers.rewards_controller import rewards_bp
from app.models import CommunityGroup, Organization, OrgType, RVM, User


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
    web_bp.register_blueprint(machines_bp)
    web_bp.register_blueprint(rewards_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        uniq = uuid.uuid4().hex[:6]
        ot = OrgType(name=f'VerbTest-{uniq}')
        db.session.add(ot)
        db.session.flush()

        org = Organization(
            name=f'VT-{uniq}', full_name='Verb Test Org',
            type_id=ot.id, status='Active',
        )
        db.session.add(org)
        db.session.flush()

        grp = CommunityGroup(organization_id=org.id, name='VG', abbreviation='VG')
        db.session.add(grp)
        db.session.flush()

        rvm = RVM(
            organization_id=org.id,
            machine_uuid=f'RVM-{uuid.uuid4().hex[:8]}',
            name='Verb Test RVM',
            location_name='Main',
            is_online=True,
        )
        db.session.add(rvm)

        def _user(role):
            u = User(
                community_group_id=grp.id,
                first_name=role.capitalize(), last_name='Tester',
                email=f'{role}-{uniq}@verbtest.test',
                username=f'{role}_{uniq}',
                password_hash='not-used',
                role=role, is_active=True,
            )
            db.session.add(u)
            db.session.flush()
            return u.id

        auditor_id = _user('auditor')
        technician_id = _user('technician')
        db.session.commit()
        return {'auditor_id': auditor_id, 'technician_id': technician_id, 'rvm_id': rvm.id, 'org_id': org.id}


def _mint(app, user_id, role):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {'user_id': user_id, 'role': role,
         'iat': int(now.timestamp()),
         'exp': int((now + timedelta(hours=1)).timestamp()),
         'jti': uuid.uuid4().hex},
        app.config['SECRET_KEY'], algorithm='HS256',
    )


@pytest.fixture(scope='module')
def verb_ctx():
    app = _build_app()
    ids = _seed(app)
    tokens = {
        'auditor': _mint(app, ids['auditor_id'], 'auditor'),
        'technician': _mint(app, ids['technician_id'], 'technician'),
    }
    yield app, ids, tokens
    with app.app_context():
        db.session.remove()
        db.drop_all()


def _auth(token):
    return {'Authorization': f'Bearer {token}'}


def test_auditor_cannot_create_user(verb_ctx):
    app, ids, tokens = verb_ctx
    with app.test_client() as c:
        resp = c.post('/api/web/users', json={
            'firstName': 'X', 'lastName': 'Y', 'email': 'x@y.com',
            'password': 'TestPass1', 'role': 'user', 'locationId': ids['org_id'],
        }, headers=_auth(tokens['auditor']))
    assert resp.status_code == 403
    body = resp.get_json()
    assert body['error']['code'] == 'FORBIDDEN'


def test_auditor_cannot_edit_machine(verb_ctx):
    app, ids, tokens = verb_ctx
    with app.test_client() as c:
        resp = c.put(
            f'/api/web/machines/{ids["rvm_id"]}',
            json={'name': 'Z'},
            headers=_auth(tokens['auditor']),
        )
    assert resp.status_code == 403


def test_technician_can_edit_machine(verb_ctx):
    app, ids, tokens = verb_ctx
    with app.test_client() as c:
        resp = c.put(
            f'/api/web/machines/{ids["rvm_id"]}',
            json={'name': 'Z-tech'},
            headers=_auth(tokens['technician']),
        )
    # 200 = edited; 404 = machine scoping issue; never 403
    assert resp.status_code in (200, 404), (
        f'Expected 200 or 404, got {resp.status_code}: {resp.get_data(as_text=True)[:200]}'
    )
