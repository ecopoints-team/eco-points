"""A stored reward image_url must always fit the String(500) column."""
import io
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask
from sqlalchemy.pool import StaticPool

from app import Config, db
from app.controllers.rewards_controller import rewards_bp
from app.models import CommunityGroup, Organization, OrgType, User


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file:test-reward-image-db?mode=memory&cache=shared&uri=true'
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
    web_bp = Blueprint('web_rewards_img', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(rewards_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed(app):
    with app.app_context():
        ot = OrgType(name=f'ImgTestUni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()
        org = Organization(
            name=f'ImgOrg-{uuid.uuid4().hex[:6]}',
            full_name='Image Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()
        grp = CommunityGroup(organization_id=org.id, name='ImgGroup', abbreviation='IMG')
        db.session.add(grp)
        db.session.flush()
        admin = User(
            community_group_id=grp.id,
            first_name='Img',
            last_name='Admin',
            email=f'img-{uuid.uuid4().hex[:6]}@test.test',
            username=f'img_{uuid.uuid4().hex[:6]}',
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


def _png_bytes():
    import base64
    return base64.b64decode(
        b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )


@pytest.fixture(scope='module')
def img_ctx():
    app = _build_app()
    user_id = _seed(app)
    token = _mint(app, user_id)
    yield app, token
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_upload_returns_short_url(img_ctx):
    app, token = img_ctx
    with app.test_client() as c:
        data = {'image': (io.BytesIO(_png_bytes()), 'reward.png')}
        resp = c.post(
            '/api/web/rewards/image',
            data=data,
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {token}'},
        )
    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is True
    assert body['imageUrl'].startswith('/uploads/rewards/')
    assert len(body['imageUrl']) <= 500
