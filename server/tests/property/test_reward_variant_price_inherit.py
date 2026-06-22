"""A variant's effective price inherits the parent reward when its own
points_required is NULL, and overrides it when set."""
import uuid
import pytest
from flask import Flask

from app import Config, db
from app.models import CommunityGroup, Organization, OrgType, Reward, RewardVariant


def _build_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True
    db.init_app(app)
    with app.app_context():
        db.create_all()
    return app


def _seed_reward(app, points_required):
    with app.app_context():
        ot = OrgType(name=f'VarUni-{uuid.uuid4().hex[:6]}')
        db.session.add(ot); db.session.flush()
        org = Organization(name=f'VarOrg-{uuid.uuid4().hex[:6]}', full_name='Var Org',
                           type_id=ot.id, status='Active')
        db.session.add(org); db.session.flush()
        reward = Reward(organization_id=org.id, name='Tumbler', category='Merchandise',
                        points_required=points_required, is_active=True)
        db.session.add(reward); db.session.flush()
        return reward.id


def _effective_price(variant, reward):
    return variant.points_required if variant.points_required is not None else reward.points_required


@pytest.fixture(scope='module')
def app_ctx():
    app = _build_app()
    with app.app_context():
        yield app
        db.session.remove()
        db.drop_all()


def test_variant_price_column_exists_and_is_nullable(app_ctx):
    with app_ctx.app_context():
        ot = OrgType(name=f'VarUni2-{uuid.uuid4().hex[:6]}'); db.session.add(ot); db.session.flush()
        org = Organization(name=f'VarOrg2-{uuid.uuid4().hex[:6]}', full_name='Var Org 2',
                           type_id=ot.id, status='Active'); db.session.add(org); db.session.flush()
        reward = Reward(organization_id=org.id, name='Cup', category='Merchandise',
                        points_required=100, is_active=True); db.session.add(reward); db.session.flush()
        v = RewardVariant(reward_id=reward.id, variety_name='Large',
                          stock_quantity=5, is_active=True, points_required=None)
        db.session.add(v); db.session.commit()
        assert v.points_required is None
        assert _effective_price(v, reward) == 100


def test_variant_price_override(app_ctx):
    with app_ctx.app_context():
        ot = OrgType(name=f'VarUni3-{uuid.uuid4().hex[:6]}'); db.session.add(ot); db.session.flush()
        org = Organization(name=f'VarOrg3-{uuid.uuid4().hex[:6]}', full_name='Var Org 3',
                           type_id=ot.id, status='Active'); db.session.add(org); db.session.flush()
        reward = Reward(organization_id=org.id, name='Bag', category='Merchandise',
                        points_required=100, is_active=True); db.session.add(reward); db.session.flush()
        v = RewardVariant(reward_id=reward.id, variety_name='XL',
                          stock_quantity=5, is_active=True, points_required=150)
        db.session.add(v); db.session.commit()
        assert _effective_price(v, reward) == 150
