"""Creating a user must succeed (201/200) even if the notification raises."""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask
from sqlalchemy.pool import StaticPool

from app import Config, db
from app.controllers.users_controller import users_bp
from app.controllers.auth_controller import auth_bp
from app.models import CommunityGroup, Organization, OrgType, User


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file:test-notif-never500-db?mode=memory&cache=shared&uri=true'
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool,
    }
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    db.init_app(app)

    from flask import Blueprint
    web_bp = Blueprint('web_notif_never_500', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'N500Uni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()
        org = Organization(
            name=f'N500Org-{uuid.uuid4().hex[:6]}',
            full_name='N500 Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()
        grp = CommunityGroup(organization_id=org.id, name='N500Grp', abbreviation='N5G')
        db.session.add(grp)
        db.session.flush()
        admin = User(
            community_group_id=grp.id,
            first_name='N500',
            last_name='Admin',
            email=f'n500-{uuid.uuid4().hex[:6]}@test.test',
            username=f'n500_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        return admin.id, org.id, grp.id


def _mint(app, user_id):
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': 'superadmin',
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


@pytest.fixture(scope='module')
def n500_ctx():
    app = _build_app()
    admin_id, org_id, grp_id = _seed(app)
    token = _mint(app, admin_id)
    yield app, token, org_id, grp_id
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_create_user_succeeds_when_alert_raises(n500_ctx, monkeypatch):
    app, token, org_id, grp_id = n500_ctx

    def _boom(*args, **kwargs):
        raise RuntimeError('email backend down')

    monkeypatch.setattr('app.controllers.users_controller.trigger_alert', _boom)

    with app.test_client() as c:
        resp = c.post(
            '/api/web/users',
            json={
                'firstName': 'Notify',
                'lastName': 'Test',
                'email': f'notify-test-{uuid.uuid4().hex[:6]}@example.com',
                'username': f'notify_test_{uuid.uuid4().hex[:6]}',
                'password': 'Str0ng!Passw0rd',
                'role': 'user',
                'locationId': org_id,
                'communityGroupId': grp_id,
            },
            headers={'Authorization': f'Bearer {token}'},
        )
    assert resp.status_code in (200, 201), resp.get_data(as_text=True)
