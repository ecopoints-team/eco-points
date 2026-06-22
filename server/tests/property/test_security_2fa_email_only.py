"""2FA method is email-only. 'sms' must be rejected with 400/422."""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask

from app import Config, db
from app.controllers.settings_controller import settings_bp
from app.models import CommunityGroup, Organization, OrgType, User, NotificationSetting


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    db.init_app(app)

    from flask import Blueprint
    web_bp = Blueprint('web_2fa_test', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(settings_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'TFAUni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()
        org = Organization(
            name=f'TFAOrg-{uuid.uuid4().hex[:6]}',
            full_name='2FA Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()
        grp = CommunityGroup(organization_id=org.id, name='TFAGrp', abbreviation='TFA')
        db.session.add(grp)
        db.session.flush()
        admin = User(
            community_group_id=grp.id,
            first_name='TFA',
            last_name='Admin',
            email=f'tfa-{uuid.uuid4().hex[:6]}@test.test',
            username=f'tfa_{uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='head_admin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        return admin.id, org.id


def _mint(app, user_id, role='head_admin'):
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
def tfa_ctx():
    app = _build_app()
    admin_id, org_id = _seed(app)
    token = _mint(app, admin_id)
    yield app, token, org_id
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_security_config_rejects_sms_method(tfa_ctx):
    app, token, org_id = tfa_ctx
    with app.test_client() as c:
        resp = c.put(
            '/api/web/settings/security',
            json={
                'twoFactorRequired': True,
                'twoFactorMethod': 'sms',
                'sessionTimeoutMinutes': 60,
                'maxLoginAttempts': 5,
                'lockoutDurationMinutes': 15,
            },
            headers={'Authorization': f'Bearer {token}'},
        )
    assert resp.status_code in (400, 422), resp.get_data(as_text=True)


def test_security_config_accepts_email_method(tfa_ctx):
    app, token, org_id = tfa_ctx
    # Seed the security config row first (head_admin needs loc_id)
    with app.app_context():
        ns = NotificationSetting(
            organization_id=org_id,
            alert_key='config_security',
            email_enabled=False,
            sms_enabled=False,
            recipients_json='[]',
            is_active=True,
        )
        db.session.add(ns)
        db.session.commit()

    with app.test_client() as c:
        resp = c.put(
            '/api/web/settings/security',
            json={
                'twoFactorRequired': True,
                'twoFactorMethod': 'email',
                'sessionTimeoutMinutes': 60,
                'maxLoginAttempts': 5,
                'lockoutDurationMinutes': 15,
            },
            headers={'Authorization': f'Bearer {token}'},
        )
    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json()['config']['twoFactorMethod'] == 'email'
