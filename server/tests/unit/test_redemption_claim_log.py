from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

import jwt
import pytest
from flask import Flask, jsonify

from app import Config, db
from app.controllers.logs_controller import logs_bp
from app.controllers.logs_controller import _describe_transaction
from app.models import (
    OrgType,
    Organization,
    CommunityGroup,
    User,
    Wallet,
    RewardCategory,
    Reward,
    RewardVariant,
    RewardRedemption,
    Transaction,
)

def _build_app():
    """Self-contained Flask app with the logs blueprint mounted."""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True

    db.init_app(app)

    # Mount logs_bp under web_bp
    from flask import Blueprint
    web_bp = Blueprint('web', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(logs_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app

def _seed_db_for_redemption(app):
    """Seed Org, Group, Admin User, Regular User, Wallet, Reward, Variant, and Redemption."""
    with app.app_context():
        suffix = uuid.uuid4().hex[:8]
        ot = OrgType(name=f'UniType-{suffix}')
        db.session.add(ot)
        db.session.flush()

        org = Organization(
            name=f'Org-{suffix}',
            full_name='Test Organization',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Default Group',
            abbreviation='DEF',
            
        )
        db.session.add(group)
        db.session.flush()

        # Admin user (actor)
        admin = User(
            community_group_id=group.id,
            first_name='Admin',
            last_name='Tester',
            email=f'admin-{suffix}@x.test',
            username=f'admin_{suffix}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.flush()

        # Regular user (redeemer)
        user = User(
            community_group_id=group.id,
            first_name='User',
            last_name='Tester',
            email=f'user-{suffix}@x.test',
            username=f'user_{suffix}',
            password_hash='not-used',
            role='student',
            is_active=True,
        )
        db.session.add(user)
        db.session.flush()

        # Wallet
        wallet = Wallet(user_id=user.id, points_balance=1000)
        db.session.add(wallet)
        db.session.flush()

        # Reward Category
        cat = RewardCategory(organization_id=org.id, name=f'Food-{suffix}')
        db.session.add(cat)
        db.session.flush()

        # Reward
        reward = Reward(
            category_id=cat.id,
            organization_id=org.id,
            name=f'Coffee-{suffix}',
            description='Tasty brew',
            points_required=100,
            is_active=True,
        )
        db.session.add(reward)
        db.session.flush()

        # Variant
        variant = RewardVariant(
            reward_id=reward.id,
            variety_name='Large',
            stock_quantity=10,
            is_active=True,
        )
        db.session.add(variant)
        db.session.flush()

        # Redemption (Pending)
        redemption = RewardRedemption(
            wallet_id=wallet.id,
            variant_id=variant.id,
            points_spent=100,
            status='pending',
            redemption_code=f'CODE{suffix[:4]}'.upper(),
            redeemed_at=datetime.now(timezone.utc),
        )
        db.session.add(redemption)
        db.session.flush()

        # Initial Redeem Transaction
        txn = Transaction(
            wallet_id=wallet.id,
            transaction_type='redeem',
            amount=-100,
            balance_before=1000,
            balance_after=900,
            reference_type='reward_redemption',
            reference_id=redemption.id,
        )
        db.session.add(txn)

        db.session.commit()
        return admin.id, user.id, redemption.id

def _mint_jwt(app, user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int(
            (now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()
        ),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

@pytest.fixture(scope='module')
def app_ctx():
    app = _build_app()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()

def test_claim_creates_confirmation_transaction_and_describes_correctly(app_ctx):
    """
    Updating status to 'claimed' must insert a redeem_confirm Transaction log
    with amount=0, and both the redeem and redeem_confirm transactions must be
    described with custom reward-name messages.
    """
    admin_id, user_id, redemption_id = _seed_db_for_redemption(app_ctx)
    token = _mint_jwt(app_ctx, admin_id, 'superadmin')

    with app_ctx.test_client() as client:
        # PUT /api/web/logs/rewards/<redemption_id>
        resp = client.put(
            f'/api/web/logs/rewards/{redemption_id}',
            headers={'Authorization': f'Bearer {token}'},
            json={'status': 'claimed'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is True
    assert body['log']['status'] == 'claimed'

    with app_ctx.app_context():
        # Verify transaction log counts
        txns = Transaction.query.filter_by(reference_type='reward_redemption', reference_id=redemption_id).all()
        # Should have 2 transactions: 1 redeem (-100 points) and 1 redeem_confirm (0 points)
        assert len(txns) == 2

        redeem_txn = next(t for t in txns if t.transaction_type == 'redeem')
        confirm_txn = next(t for t in txns if t.transaction_type == 'redeem_confirm')

        assert redeem_txn.amount == -100
        assert confirm_txn.amount == 0
        assert confirm_txn.wallet_id == redeem_txn.wallet_id

        # Verify describe transaction output
        redeem_desc = _describe_transaction(redeem_txn)
        confirm_desc = _describe_transaction(confirm_txn)

        assert redeem_desc.startswith('Redeemed Reward: Coffee-')
        assert confirm_desc.startswith('Claimed Reward: Coffee-')
