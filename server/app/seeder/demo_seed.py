"""
EcoPoints Demo Seed — 50 Users with Realistic Activity Data
=============================================================

Creates a rich demo dataset for presentation and testing:
  - 2 organizations, 4 community groups, 3 RVMs, 5 rewards
  - 50 users (7 role-based + 43 regular users with Filipino names)
  - ~200 recycling sessions with ~600 items over 30 days
  - ~250 transactions (earn + redeem)
  - ~30 reward redemptions
  - ~50 admin logs
  - ~10 maintenance logs
  - ~100 login attempts
  - ~5 bulk deposits

Uses a fixed random seed (42) for reproducibility.
"""
from __future__ import annotations

import os
import random
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from .. import db
from ..models import (
    AdminLog,
    BulkDeposit,
    CommunityGroup,
    LoginAttempt,
    MaintenanceLog,
    NotificationSetting,
    Organization,
    OrgAddress,
    OrgContact,
    OrgType,
    RecyclingItem,
    RecyclingSession,
    Reward,
    RewardRedemption,
    RewardVariant,
    RVM,
    Transaction,
    User,
    UserSecurity,
    Wallet,
)
from ..services.password_policy import validate_password_policy
from .seed import run_seed

# ── Fixed random seed for reproducibility ─────────────────────────────
RNG = random.Random(42)

NOW = datetime.now(timezone.utc)
THIRTY_DAYS_AGO = NOW - timedelta(days=30)

DEFAULT_PASSWORD = 'SeedPass!23'

# ── Filipino names pool ───────────────────────────────────────────────
FIRST_NAMES_M = [
    'Juan', 'Marco', 'Rafael', 'Carlos', 'Miguel',
    'Gabriel', 'Antonio', 'Jose', 'Andres', 'Luis',
    'Paolo', 'Enrique', 'Ramon', 'Jericho', 'Cedric',
    'Benedict', 'Nathaniel', 'Patrick', 'Renzo', 'Tristan',
    'Elijah', 'Adrian', 'Kenneth', 'Christian', 'Darwin',
]
FIRST_NAMES_F = [
    'Maria', 'Angela', 'Sofia', 'Isabela', 'Camille',
    'Jasmine', 'Katrina', 'Patricia', 'Bianca', 'Nicole',
    'Samantha', 'Daniela', 'Francesca', 'Gabriela', 'Hannah',
    'Joanna', 'Kristine', 'Mikhaela', 'Regina', 'Victoria',
    'Alyssa', 'Beatrice', 'Celeste', 'Diana', 'Elena',
]
LAST_NAMES = [
    'Dela Cruz', 'Santos', 'Reyes', 'Cruz', 'Bautista',
    'Gonzales', 'Garcia', 'Torres', 'Ramos', 'Villanueva',
    'Mendoza', 'Rivera', 'Fernandez', 'Lopez', 'Martinez',
    'Aquino', 'Castillo', 'Navarro', 'Flores', 'Soriano',
    'Salvador', 'Pascual', 'Dizon', 'Mercado', 'Manalo',
    'Aguilar', 'Valdez', 'Estrella', 'Morales', 'Santiago',
]

USER_TYPES = ['student', 'student', 'student', 'faculty', 'staff']

# ── Recyclable items ─────────────────────────────────────────────────
RECYCLABLE_CLASSES = [
    ('coke_bottle', 5),
    ('sprite_bottle', 5),
    ('water_bottle', 3),
    ('juice_box', 2),
    ('aluminum_can', 7),
    ('beer_bottle', 4),
    ('plastic_cup', 2),
    ('milk_carton', 3),
]

# ── Reward definitions ────────────────────────────────────────────────
REWARDS_DATA = [
    {
        'name': 'Eco Tumbler',
        'description': 'Stainless steel insulated tumbler with EcoPoints branding. Perfect for hot or cold drinks.',
        'category': 'Merchandise',
        'points_required': 150,
        'variants': [
            ('Ocean Blue - 500ml', 25),
            ('Forest Green - 500ml', 25),
            ('Midnight Black - 750ml', 15),
        ],
    },
    {
        'name': 'Bamboo Straw Set',
        'description': 'Set of 4 bamboo straws with cleaning brush in a cotton pouch.',
        'category': 'Sustainable',
        'points_required': 80,
        'variants': [('Standard Set', 50)],
    },
    {
        'name': 'Canvas Tote Bag',
        'description': 'Heavy-duty canvas tote bag with eco-friendly print. Reusable and washable.',
        'category': 'Merchandise',
        'points_required': 120,
        'variants': [
            ('Natural - Small', 30),
            ('Natural - Large', 20),
        ],
    },
    {
        'name': 'Coffee Voucher',
        'description': 'Redeemable for one free coffee at partner cafes on campus.',
        'category': 'Voucher',
        'points_required': 50,
        'variants': [('Single Cup', 100)],
    },
    {
        'name': 'Recycled Notebook',
        'description': '80-page notebook made from 100% recycled paper. A5 size with dotted pages.',
        'category': 'Education',
        'points_required': 60,
        'variants': [('A5 Dotted', 40)],
    },
]

# ── Admin action templates ────────────────────────────────────────────
ADMIN_ACTIONS = [
    ('create_user', 'users', 'Created user account for {target}'),
    ('update_user', 'users', 'Updated profile for {target}'),
    ('deactivate_user', 'users', 'Deactivated user account: {target}'),
    ('activate_user', 'users', 'Re-activated user account: {target}'),
    ('update_machine', 'machines', 'Updated RVM configuration: {target}'),
    ('create_reward', 'rewards', 'Added new reward: {target}'),
    ('update_reward', 'rewards', 'Updated reward details: {target}'),
    ('update_settings', 'settings', 'Modified notification settings'),
    ('view_logs', 'logs', 'Accessed admin logs'),
    ('export_data', 'analytics', 'Exported analytics report'),
    ('update_group', 'groups', 'Updated community group: {target}'),
    ('force_logout', 'settings', 'Force-logged out all users in organization'),
]

MAINTENANCE_ACTIONS = [
    ('Sensor Calibration', 'Resolved', 'Calibrated IR proximity sensor. Detection accuracy improved to 98%.'),
    ('Bin Emptied', 'Resolved', 'Emptied collection bin. Capacity reset to 0%.'),
    ('Conveyor Belt Repair', 'Resolved', 'Replaced worn conveyor belt. Motor running smoothly.'),
    ('Camera Lens Cleaning', 'Resolved', 'Cleaned YOLOv8 camera lens. Image clarity restored.'),
    ('Software Update', 'Resolved', 'Updated firmware to v2.3.1. Added new bottle detection models.'),
    ('Power Supply Check', 'Resolved', 'Inspected power supply unit. All voltages within spec.'),
    ('Crusher Maintenance', 'Pending', 'Crusher motor showing intermittent fault. Parts ordered.'),
    ('Network Diagnostics', 'Resolved', 'Resolved WiFi connectivity drop. Changed to 5GHz band.'),
    ('Full Inspection', 'Resolved', 'Quarterly preventive maintenance completed. All systems nominal.'),
    ('Display Replacement', 'Pending', 'LCD display flickering. Replacement display ordered.'),
]


# ── Helpers ───────────────────────────────────────────────────────────

def _random_datetime(start: datetime, end: datetime) -> datetime:
    """Return a random datetime between start and end."""
    delta = end - start
    random_seconds = RNG.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def _random_ip() -> str:
    return f'192.168.{RNG.randint(1, 254)}.{RNG.randint(1, 254)}'


def _redemption_code() -> str:
    return 'ECO-' + ''.join(RNG.choices(string.ascii_uppercase + string.digits, k=8))


# ── Main demo seed ────────────────────────────────────────────────────

def run_demo_seed() -> None:
    """Populate database with rich demo data for presentation/testing.

    Calls ``run_seed()`` first to create base entities, then layers on
    43 additional users and activity data.
    """
    password = os.environ.get('SEED_PASSWORD', DEFAULT_PASSWORD)
    pw_valid, pw_msg = validate_password_policy(password)
    if not pw_valid:
        import sys
        print(f'[demo-seed] Password policy failed: {pw_msg}', file=sys.stderr)
        sys.exit(1)

    # ── 1. Run base seed (creates 7 role-based users + org + rvm + reward)
    print('=' * 60)
    print('  PHASE 1: Running base seed...')
    print('=' * 60)
    run_seed()

    # ── 2. Load base entities
    print()
    print('=' * 60)
    print('  PHASE 2: Creating demo data...')
    print('=' * 60)

    org_type_uni = OrgType.query.filter_by(name='University').first()
    org_eptu = Organization.query.filter_by(name='EcoPoints Test University').first()

    # Create second org type + org
    print('[demo-seed] Creating second organization (GreenCorp)...')
    org_type_corp = OrgType.query.filter_by(name='Corporation').first()
    if not org_type_corp:
        org_type_corp = OrgType(name='Corporation')
        db.session.add(org_type_corp)
        db.session.flush()

    org_gcs = Organization.query.filter_by(name='GCS').first()
    if not org_gcs:
        org_gcs = Organization(
            name='GCS', full_name='GreenCorp Solutions',
            type_id=org_type_corp.id, status='Active',
        )
        db.session.add(org_gcs)
        db.session.flush()

    # ── Addresses
    print('[demo-seed] Creating org addresses...')
    if not OrgAddress.query.filter_by(organization_id=org_eptu.id).first():
        db.session.add(OrgAddress(
            organization_id=org_eptu.id,
            street_address='123 University Avenue',
            barangay='Brgy. Poblacion',
            city_municipality='Quezon City',
            province='Metro Manila',
            region='NCR',
            zip_code='1100',
        ))
    if not OrgAddress.query.filter_by(organization_id=org_gcs.id).first():
        db.session.add(OrgAddress(
            organization_id=org_gcs.id,
            street_address='456 Innovation Drive',
            barangay='Brgy. San Antonio',
            city_municipality='Makati City',
            province='Metro Manila',
            region='NCR',
            zip_code='1200',
        ))
    db.session.flush()

    # ── Contacts
    print('[demo-seed] Creating org contacts...')
    if not OrgContact.query.filter_by(organization_id=org_eptu.id).first():
        db.session.add(OrgContact(
            organization_id=org_eptu.id,
            first_name='Elena', last_name='Reyes',
            email='elena.reyes@eptu.edu.ph', phone_number='+63-917-123-4567',
        ))
    if not OrgContact.query.filter_by(organization_id=org_gcs.id).first():
        db.session.add(OrgContact(
            organization_id=org_gcs.id,
            first_name='Marco', last_name='Santos',
            email='marco.santos@greencorp.ph', phone_number='+63-918-765-4321',
        ))
    db.session.flush()

    # ── Community groups
    print('[demo-seed] Creating community groups...')
    cg_default = CommunityGroup.query.filter_by(
        organization_id=org_eptu.id, name='Default Group'
    ).first()

    cg_bsit = CommunityGroup.query.filter_by(
        organization_id=org_eptu.id, name='BSIT'
    ).first()
    if not cg_bsit:
        cg_bsit = CommunityGroup(
            organization_id=org_eptu.id, name='BSIT',
            abbreviation='BSIT', group_type='college',
        )
        db.session.add(cg_bsit)
        db.session.flush()

    cg_bscs = CommunityGroup.query.filter_by(
        organization_id=org_eptu.id, name='BSCS'
    ).first()
    if not cg_bscs:
        cg_bscs = CommunityGroup(
            organization_id=org_eptu.id, name='BSCS',
            abbreviation='BSCS', group_type='college',
        )
        db.session.add(cg_bscs)
        db.session.flush()

    cg_it = CommunityGroup.query.filter_by(
        organization_id=org_gcs.id, name='IT Department'
    ).first()
    if not cg_it:
        cg_it = CommunityGroup(
            organization_id=org_gcs.id, name='IT Department',
            abbreviation='IT', group_type='staff',
        )
        db.session.add(cg_it)
        db.session.flush()

    cg_hr = CommunityGroup.query.filter_by(
        organization_id=org_gcs.id, name='HR Department'
    ).first()
    if not cg_hr:
        cg_hr = CommunityGroup(
            organization_id=org_gcs.id, name='HR Department',
            abbreviation='HR', group_type='staff',
        )
        db.session.add(cg_hr)
        db.session.flush()

    eptu_groups = [cg_default, cg_bsit, cg_bscs]
    gcs_groups = [cg_it, cg_hr]

    # ── Additional RVMs
    print('[demo-seed] Creating additional RVMs...')
    import bcrypt as _bcrypt

    rvm_seed = RVM.query.filter_by(machine_uuid='RVM-EPTU-SEED-001').first()
    rvms = [rvm_seed]

    for uuid_str, name, loc, org_id in [
        ('RVM-EPTU-002', 'Library RVM', 'University Library', org_eptu.id),
        ('RVM-GCS-001', 'Lobby RVM', 'Main Lobby', org_gcs.id),
    ]:
        rvm = RVM.query.filter_by(machine_uuid=uuid_str).first()
        if not rvm:
            api_key = secrets.token_urlsafe(32)
            hashed = _bcrypt.hashpw(api_key.encode(), _bcrypt.gensalt()).decode()
            rvm = RVM(
                organization_id=org_id, machine_uuid=uuid_str,
                name=name, location_name=loc,
                is_online=True, is_capacity_full=False,
                api_key_hash=hashed,
            )
            db.session.add(rvm)
            db.session.flush()
            print(f'  RVM API key for "{name}": {api_key}')
        rvms.append(rvm)

    # ── Additional rewards
    print('[demo-seed] Creating rewards...')
    all_variants = []
    for rdata in REWARDS_DATA:
        reward = Reward.query.filter_by(
            organization_id=org_eptu.id, name=rdata['name']
        ).first()
        if not reward:
            reward = Reward(
                organization_id=org_eptu.id,
                name=rdata['name'],
                description=rdata['description'],
                category=rdata['category'],
                points_required=rdata['points_required'],
                is_active=True,
            )
            db.session.add(reward)
            db.session.flush()

            for vname, vstock in rdata['variants']:
                v = RewardVariant(
                    reward_id=reward.id,
                    variety_name=vname,
                    stock_quantity=vstock,
                    is_active=True,
                )
                db.session.add(v)
                db.session.flush()
                all_variants.append(v)
        else:
            for v in reward.variants:
                all_variants.append(v)

    # Also include base seed reward variants
    base_reward = Reward.query.filter_by(
        organization_id=org_eptu.id, name='Seed Reward'
    ).first()
    if base_reward:
        all_variants.extend(base_reward.variants)

    db.session.flush()

    # ── Notification settings
    print('[demo-seed] Creating notification settings...')
    for org_id in [org_eptu.id, org_gcs.id]:
        for alert_key, threshold in [
            ('machine_offline', None),
            ('bin_full', None),
            ('low_reward_stock', 10),
        ]:
            existing = NotificationSetting.query.filter_by(
                organization_id=org_id, alert_key=alert_key
            ).first()
            if not existing:
                db.session.add(NotificationSetting(
                    organization_id=org_id,
                    alert_key=alert_key,
                    threshold=threshold,
                    email_enabled=True,
                    sms_enabled=False,
                    is_active=True,
                ))
    db.session.flush()

    # ── Create 43 additional users (7 already exist from base seed)
    print('[demo-seed] Creating 43 additional users...')
    all_first_names = FIRST_NAMES_M + FIRST_NAMES_F
    RNG.shuffle(all_first_names)

    demo_users: list[User] = []
    # Load the 7 base seed users
    for role in ['superadmin', 'head_admin', 'auditor', 'technician',
                 'inventory_officer', 'user', 'dependent']:
        u = User.query.filter_by(email=f'{role}@ecopoints.local').first()
        if u:
            demo_users.append(u)

    user_idx = 0
    for i in range(43):
        fn = all_first_names[i % len(all_first_names)]
        ln = LAST_NAMES[i % len(LAST_NAMES)]
        email = f'{fn.lower()}.{ln.lower().replace(" ", "")}@ecopoints.local'
        username = f'{fn.lower()}.{ln.lower().replace(" ", "")}'

        existing = User.query.filter_by(email=email).first()
        if existing:
            demo_users.append(existing)
            continue

        # Distribute across groups: 70% EPTU, 30% GCS
        if i < 30:
            cg = RNG.choice(eptu_groups)
            org_abbr = 'EPTU'
        else:
            cg = RNG.choice(gcs_groups)
            org_abbr = 'GCS'

        user = User(
            community_group_id=cg.id,
            first_name=fn,
            last_name=ln,
            email=email,
            username=username,
            role='user',
            is_active=True,
            user_type=RNG.choice(USER_TYPES),
            terms_accepted_at=_random_datetime(THIRTY_DAYS_AGO, NOW),
            created_at=_random_datetime(THIRTY_DAYS_AGO, NOW - timedelta(days=7)),
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        user.display_id = User.generate_display_id('user', org_abbr)

        wallet = Wallet(
            user_id=user.id, points_balance=0,
            lifetime_points=0, streak=RNG.randint(0, 15),
        )
        db.session.add(wallet)
        db.session.add(UserSecurity(user_id=user.id, two_factor_enabled=False))
        db.session.flush()

        demo_users.append(user)
        user_idx += 1

    db.session.flush()
    print(f'  Total users: {User.query.count()}')

    # Collect end-users (role = user or dependent) with wallets
    end_users = [u for u in demo_users if u.role in ('user', 'dependent') and u.wallet]
    admin_users = [u for u in demo_users if u.is_admin]
    tech_users = [u for u in demo_users if u.role == 'technician']
    if not tech_users:
        tech_users = admin_users[:1]

    # ── Recycling sessions + items + transactions
    print('[demo-seed] Creating recycling sessions & transactions...')
    session_count = 0
    item_count = 0
    txn_count = 0

    for user in end_users:
        # Each end-user gets 2–8 sessions over the past 30 days
        num_sessions = RNG.randint(2, 8)
        for _ in range(num_sessions):
            session_start = _random_datetime(THIRTY_DAYS_AGO, NOW - timedelta(hours=1))
            session_end = session_start + timedelta(minutes=RNG.randint(2, 15))
            rvm = RNG.choice(rvms)

            session = RecyclingSession(
                rvm_id=rvm.id,
                wallet_id=user.wallet.id,
                status='completed',
                start_time=session_start,
                end_time=session_end,
                total_points_earned=0,
                item_count=0,
            )
            db.session.add(session)
            db.session.flush()

            # 2–5 items per session
            num_items = RNG.randint(2, 5)
            session_points = 0
            for j in range(num_items):
                detected_class, base_points = RNG.choice(RECYCLABLE_CLASSES)
                confidence = round(RNG.uniform(85.0, 99.9), 2)
                is_accepted = confidence > 88.0
                pts = base_points if is_accepted else 0

                item = RecyclingItem(
                    session_id=session.id,
                    detected_class=detected_class,
                    points_awarded=pts,
                    confidence_score=Decimal(str(confidence)),
                    status='Accepted' if is_accepted else 'Rejected',
                    scanned_at=session_start + timedelta(seconds=30 * (j + 1)),
                )
                db.session.add(item)
                session_points += pts
                item_count += 1

            session.total_points_earned = session_points
            session.item_count = num_items
            db.session.flush()

            # Create earn transaction
            if session_points > 0:
                balance_before = user.wallet.points_balance
                user.wallet.points_balance += session_points
                user.wallet.lifetime_points += session_points

                txn = Transaction(
                    wallet_id=user.wallet.id,
                    transaction_type='earn',
                    amount=session_points,
                    balance_before=balance_before,
                    balance_after=user.wallet.points_balance,
                    reference_type='session',
                    reference_id=session.id,
                    created_at=session_end,
                )
                db.session.add(txn)
                txn_count += 1

            session_count += 1

    db.session.flush()
    print(f'  Sessions: {session_count}, Items: {item_count}, Transactions: {txn_count}')

    # ── Reward redemptions
    print('[demo-seed] Creating reward redemptions...')
    redemption_count = 0
    eligible_users = [u for u in end_users if u.wallet.points_balance >= 50]

    for _ in range(min(30, len(eligible_users))):
        user = RNG.choice(eligible_users)
        variant = RNG.choice(all_variants)
        reward = variant.reward
        cost = reward.points_required

        if user.wallet.points_balance < cost:
            continue

        balance_before = user.wallet.points_balance
        user.wallet.points_balance -= cost

        is_claimed = RNG.random() > 0.3  # 70% claimed
        redeemed_at = _random_datetime(THIRTY_DAYS_AGO + timedelta(days=7), NOW)
        claimed_at = redeemed_at + timedelta(days=RNG.randint(1, 5)) if is_claimed else None

        redemption = RewardRedemption(
            wallet_id=user.wallet.id,
            variant_id=variant.id,
            points_spent=cost,
            status='claimed' if is_claimed else 'pending',
            redemption_code=_redemption_code(),
            redeemed_at=redeemed_at,
            claimed_at=claimed_at,
        )
        db.session.add(redemption)
        db.session.flush()

        txn = Transaction(
            wallet_id=user.wallet.id,
            transaction_type='redeem',
            amount=-cost,
            balance_before=balance_before,
            balance_after=user.wallet.points_balance,
            reference_type='redemption',
            reference_id=redemption.id,
            created_at=redeemed_at,
        )
        db.session.add(txn)
        redemption_count += 1

    db.session.flush()
    print(f'  Redemptions: {redemption_count}')

    # ── Admin logs
    print('[demo-seed] Creating admin logs...')
    admin_log_count = 0
    for _ in range(50):
        admin = RNG.choice(admin_users) if admin_users else demo_users[0]
        action, category, note_tmpl = RNG.choice(ADMIN_ACTIONS)
        target_user = RNG.choice(demo_users)
        target_name = f'{target_user.first_name} {target_user.last_name}'

        log = AdminLog(
            admin_user_id=admin.id,
            action=action,
            target=target_name,
            category=category,
            notes=note_tmpl.format(target=target_name),
            created_at=_random_datetime(THIRTY_DAYS_AGO, NOW),
        )
        db.session.add(log)
        admin_log_count += 1

    db.session.flush()
    print(f'  Admin logs: {admin_log_count}')

    # ── Maintenance logs
    print('[demo-seed] Creating maintenance logs...')
    maint_count = 0
    for action_type, status, notes in MAINTENANCE_ACTIONS:
        rvm = RNG.choice(rvms)
        tech = RNG.choice(tech_users)
        log = MaintenanceLog(
            rvm_id=rvm.id,
            performed_by_id=tech.id,
            action_type=action_type,
            status=status,
            notes=notes,
            created_at=_random_datetime(THIRTY_DAYS_AGO, NOW),
        )
        db.session.add(log)
        maint_count += 1

    db.session.flush()
    print(f'  Maintenance logs: {maint_count}')

    # ── Login attempts
    print('[demo-seed] Creating login attempts...')
    login_count = 0
    for _ in range(100):
        user = RNG.choice(demo_users)
        is_success = RNG.random() > 0.15  # 85% success rate
        # Failed attempts must be >1 hour old to avoid triggering the
        # 15-minute lockout window when users try to log in after seeding.
        if is_success:
            attempt_time = _random_datetime(THIRTY_DAYS_AGO, NOW)
        else:
            attempt_time = _random_datetime(THIRTY_DAYS_AGO, NOW - timedelta(hours=1))
        attempt = LoginAttempt(
            identifier=user.email,
            ip_address=_random_ip(),
            user_id=user.id,
            is_success=is_success,
            failure_reason=None if is_success else RNG.choice([
                'Wrong Password', 'Account Locked', 'Invalid OTP',
            ]),
            attempted_at=attempt_time,
        )
        db.session.add(attempt)
        login_count += 1

    db.session.flush()
    print(f'  Login attempts: {login_count}')

    # ── Bulk deposits
    print('[demo-seed] Creating bulk deposits...')
    bulk_count = 0
    for _ in range(5):
        admin = RNG.choice(admin_users) if admin_users else demo_users[0]
        target = RNG.choice(end_users)
        pts = RNG.choice([25, 50, 75, 100, 150])

        balance_before = target.wallet.points_balance
        target.wallet.points_balance += pts
        target.wallet.lifetime_points += pts

        bd = BulkDeposit(
            admin_user_id=admin.id,
            wallet_id=target.wallet.id,
            total_points_awarded=pts,
            item_count=RNG.randint(5, 30),
            notes=f'Manual deposit: {RNG.choice(["Dropped off bags of bottles", "Campus cleanup drive", "Eco-week special collection", "Department recycling batch", "Student org collection drive"])}',
            created_at=_random_datetime(THIRTY_DAYS_AGO, NOW),
        )
        db.session.add(bd)
        db.session.flush()

        txn = Transaction(
            wallet_id=target.wallet.id,
            transaction_type='bulk_transaction',
            amount=pts,
            balance_before=balance_before,
            balance_after=target.wallet.points_balance,
            reference_type='bulk_deposit',
            reference_id=bd.id,
            created_at=bd.created_at,
        )
        db.session.add(txn)
        bulk_count += 1

    db.session.commit()
    print(f'  Bulk deposits: {bulk_count}')

    # ── Summary
    print()
    print('=' * 60)
    print('  DEMO SEED COMPLETE')
    print('=' * 60)
    print(f'  Organizations ...... {Organization.query.count()}')
    print(f'  Community Groups ... {CommunityGroup.query.count()}')
    print(f'  RVMs ............... {RVM.query.count()}')
    print(f'  Rewards ............ {Reward.query.count()}')
    print(f'  Users .............. {User.query.count()}')
    print(f'  Sessions ........... {RecyclingSession.query.count()}')
    print(f'  Items .............. {RecyclingItem.query.count()}')
    print(f'  Transactions ....... {Transaction.query.count()}')
    print(f'  Redemptions ........ {RewardRedemption.query.count()}')
    print(f'  Admin Logs ......... {AdminLog.query.count()}')
    print(f'  Maintenance Logs ... {MaintenanceLog.query.count()}')
    print(f'  Login Attempts ..... {LoginAttempt.query.count()}')
    print(f'  Bulk Deposits ...... {BulkDeposit.query.count()}')
    print()
    print('  All 50 users: password = SeedPass!23')
    print('  Admin login: superadmin@ecopoints.local')
    print()
"""Demo seed module for the EcoPoints platform."""
