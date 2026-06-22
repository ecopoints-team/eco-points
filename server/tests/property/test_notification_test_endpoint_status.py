"""The notification-test endpoint must not return a 500 on config/send failure."""
import io
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask

from app import Config, db
from app.controllers.settings_controller import settings_bp
from app.models import CommunityGroup, Organization, OrgType, User


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    db.init_app(app)

    from flask import Blueprint
    web_bp = Blueprint('web_notif_test', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(settings_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'NotifTestUni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()
        org = Organization(
            name=f'NotifOrg-{uuid.uuid4().hex[:6]}',
            full_name='Notif Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()
        grp = CommunityGroup(organization_id=org.id, name='NotifGrp', abbreviation='NTF')
        db.session.add(grp)
        db.session.flush()
        admin = User(
            community_group_id=grp.id,
            first_name='Notif',
            last_name='Admin',
            email=f'notif-{uuid.uuid4().hex[:6]}@test.test',
            username=f'notif_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        return admin.id


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
def notif_ctx():
    app = _build_app()
    user_id = _seed(app)
    token = _mint(app, user_id)
    yield app, token
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_unconfigured_resend_returns_502_not_500(notif_ctx, monkeypatch):
    app, token = notif_ctx

    def _fake_send(*args, **kwargs):
        return False, 'Resend not configured (RESEND_API_KEY required)'

    monkeypatch.setattr('app.services.notification_service._send_email', _fake_send)

    with app.test_client() as c:
        resp = c.post(
            '/api/web/settings/notifications/test',
            json={'channel': 'email', 'recipient': 'qa@example.com'},
            headers={'Authorization': f'Bearer {token}'},
        )
    assert resp.status_code == 502, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is False
    assert 'Resend' in (body['error'] or '') or 'email' in (body['error'] or '').lower()
