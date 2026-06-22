"""Org-scoped backup must contain only the caller's organization (no leakage)."""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, Blueprint
from sqlalchemy.pool import StaticPool

from app import Config, db
from app.controllers.settings_controller import settings_bp
from app.models import CommunityGroup, Organization, OrgType, Reward, User


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file:test-org-backup-db?mode=memory&cache=shared&uri=true'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool,
    }
    db.init_app(app)
    web_bp = Blueprint('web_org_backup', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(settings_bp)
    app.register_blueprint(web_bp)
    with app.app_context():
        db.create_all()
    return app


def _seed_org(label):
    ot = OrgType(name=f'{label}Uni-{uuid.uuid4().hex[:6]}'); db.session.add(ot); db.session.flush()
    org = Organization(name=f'{label}Org-{uuid.uuid4().hex[:6]}', full_name=f'{label} Org',
                       type_id=ot.id, status='Active'); db.session.add(org); db.session.flush()
    grp = CommunityGroup(organization_id=org.id, name=f'{label}G', abbreviation=label[:3])
    db.session.add(grp); db.session.flush()
    admin = User(community_group_id=grp.id, first_name=label, last_name='Admin',
                 email=f'{label.lower()}-{uuid.uuid4().hex[:6]}@t.test',
                 username=f'{label.lower()}_{uuid.uuid4().hex[:6]}',
                 password_hash='x', role='head_admin', is_active=True)
    db.session.add(admin); db.session.flush()
    reward = Reward(organization_id=org.id, name=f'{label} Reward', category='Merchandise',
                    points_required=10, is_active=True); db.session.add(reward); db.session.flush()
    return org.id, admin.id, reward.id


def _mint(app, uid, role):
    now = datetime.now(timezone.utc)
    return jwt.encode({'user_id': uid, 'role': role, 'iat': int(now.timestamp()),
                       'exp': int((now + timedelta(hours=1)).timestamp()), 'jti': uuid.uuid4().hex},
                      app.config['SECRET_KEY'], algorithm='HS256')


@pytest.fixture(scope='module')
def ctx():
    app = _build_app()
    with app.app_context():
        a_org, a_admin, a_reward = _seed_org('Alpha')
        b_org, b_admin, b_reward = _seed_org('Beta')
        # a superadmin in org A
        sa = User(community_group_id=CommunityGroup.query.filter_by(organization_id=a_org).first().id,
                  first_name='Super', last_name='Admin',
                  email=f'sa-{uuid.uuid4().hex[:6]}@t.test', username=f'sa_{uuid.uuid4().hex[:6]}',
                  password_hash='x', role='superadmin', is_active=True)
        db.session.add(sa); db.session.commit()
        ids = {'a_org': a_org, 'a_admin': a_admin, 'a_reward': a_reward,
               'b_org': b_org, 'b_reward': b_reward, 'sa': sa.id}
    yield app, ids
    with app.app_context():
        db.session.remove(); db.drop_all()


def test_head_admin_backup_is_org_scoped(ctx):
    app, ids = ctx
    token = _mint(app, ids['a_admin'], 'head_admin')
    with app.test_client() as c:
        resp = c.get('/api/web/settings/backup', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['meta']['scope'] == 'organization'
    assert body['meta']['organization_id'] == ids['a_org']
    orgs = body['tables']['organizations']
    assert len(orgs) == 1 and orgs[0]['id'] == ids['a_org']
    reward_ids = {r['id'] for r in body['tables']['rewards']}
    assert ids['a_reward'] in reward_ids
    assert ids['b_reward'] not in reward_ids  # no cross-org leakage


def test_superadmin_backup_is_global(ctx):
    app, ids = ctx
    token = _mint(app, ids['sa'], 'superadmin')
    with app.test_client() as c:
        resp = c.get('/api/web/settings/backup', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['meta']['scope'] == 'global'
    org_ids = {o['id'] for o in body['tables']['organizations']}
    assert ids['a_org'] in org_ids and ids['b_org'] in org_ids
