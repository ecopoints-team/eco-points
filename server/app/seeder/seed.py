"""
EcoPoints Deterministic Seed Script (Phase 5 — task 20.1)
==========================================================

Deterministic, idempotent seed that satisfies the Phase 5 contract from
``.kiro/specs/phased-platform-hardening``:

  1. Exactly one ``OrgType`` ("University").
  2. Exactly one ``Organization`` (``name="EcoPoints Test University"``,
     full_name same, abbreviation "EPTU" used for derived ``display_id``
     prefixes).
  3. Exactly one ``CommunityGroup`` under that Organization.
  4. Exactly one ``RVM`` under that Organization, provisioned with a
     BCrypt-hashed API key (printed once to stdout) and a Fernet-encrypted
     HMAC secret on the Organization row (Phase 4A).
  5. Exactly one ``Reward`` under that Organization.
  6. Exactly one ``User`` per role in
     ``{superadmin, head_admin, auditor, technician, inventory_officer,
     user, dependent}`` with email ``<role>@ecopoints.local``,
     ``role=<role>``, ``is_active=True``.

Password
--------
The seeded password is ``os.environ.get('SEED_PASSWORD', 'SeedPass!23')``.
It is validated with ``validate_password_policy()`` BEFORE the database
transaction is opened. On policy failure the script prints a clear
error to stderr and exits with status code 1 WITHOUT writing or
modifying any rows.

Idempotency
-----------
Every entity is upserted by a deterministic natural key:

  * ``OrgType``        by ``name``
  * ``Organization``   by ``name``
  * ``CommunityGroup`` by ``(organization_id, name)``
  * ``RVM``            by ``machine_uuid``
  * ``Reward``         by ``(organization_id, name)``
  * ``User``           by ``email``

Re-running the seeder against a previously-seeded database is a no-op
for row counts AND for primary keys: the existing rows are reused,
they are not deleted-and-recreated.

Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6.
"""
from __future__ import annotations

import os
import secrets
import sys
from typing import Optional

import bcrypt as _bcrypt

from .. import db
from ..models import (
    CommunityGroup,
    Organization,
    OrgType,
    Reward,
    RewardVariant,
    RVM,
    User,
    UserSecurity,
    Wallet,
)
from ..services.password_policy import validate_password_policy


# ───────────────────────────────────────────────────────────────────────
# Deterministic constants
# ───────────────────────────────────────────────────────────────────────

ORG_TYPE_NAME = 'University'
ORG_NAME = 'EcoPoints Test University'
ORG_ABBREVIATION = 'EPTU'                   # used for ``display_id`` prefixes
COMMUNITY_GROUP_NAME = 'Default Group'
COMMUNITY_GROUP_ABBR = 'DEFAULT'

RVM_MACHINE_UUID = 'RVM-EPTU-SEED-001'
RVM_NAME = 'Seed RVM'
RVM_LOCATION_NAME = 'Main Campus'

REWARD_NAME = 'Seed Reward'
REWARD_DESCRIPTION = 'Deterministic seed reward used by tests and local dev.'
REWARD_CATEGORY = 'Merchandise'
REWARD_POINTS_REQUIRED = 100
REWARD_VARIANT_NAME = 'Default'
REWARD_VARIANT_STOCK = 100

# Per-role users. Role -> (first_name, last_name).
SEED_ROLES: tuple[tuple[str, str, str], ...] = (
    ('superadmin', 'Super', 'Admin'),
    ('head_admin', 'Head', 'Admin'),
    ('auditor', 'Audit', 'Officer'),
    ('technician', 'Tech', 'Nician'),
    ('inventory_officer', 'Inventory', 'Officer'),
    ('user', 'Regular', 'User'),
    ('dependent', 'Dependent', 'User'),
)

DEFAULT_SEED_PASSWORD = 'SeedPass!23'


# ───────────────────────────────────────────────────────────────────────
# Idempotent upsert helpers
# ───────────────────────────────────────────────────────────────────────


def _wipe_all_tables() -> None:
    """Truncate every app table in dependency order using a raw engine
    connection so that ``SET statement_timeout = 0`` is guaranteed to
    apply to the same connection that runs TRUNCATE.

    Using TRUNCATE … CASCADE instead of DROP TABLE avoids Supabase's
    statement_timeout entirely on the DROP itself, and is orders of
    magnitude faster because it deallocates storage pages rather than
    row-by-row deletes.
    """
    # Tables in safe truncation order (children before parents).
    # CASCADE handles any remaining FK dependencies automatically.
    tables = [
        'recycling_items',
        'recycling_sessions',
        'transactions',
        'reward_redemptions',
        'bulk_deposits',
        'admin_logs',
        'maintenance_logs',
        'login_attempts',
        'token_blacklist',
        'otp_codes',
        'notification_logs',
        'notification_settings',
        'reward_variants',
        'reward_organization_assignments',
        'rewards',
        'reward_categories',
        'user_security',
        'wallet',
        'users',
        'rvms',
        'community_groups',
        'org_contact',
        'org_address',
        'organizations',
        'org_types',
    ]
    table_list = ', '.join(tables)
    with db.engine.connect() as conn:
        # Disable timeout on THIS connection for the truncate
        conn.execute(db.text('SET statement_timeout = 0'))
        conn.execute(db.text(f'TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE'))
        conn.commit()


def _get_or_create_org_type(name: str) -> OrgType:
    """Return the existing OrgType by name, or create a new one."""
    existing = OrgType.query.filter_by(name=name).first()
    if existing is not None:
        return existing
    ot = OrgType(name=name)
    db.session.add(ot)
    db.session.flush()
    return ot


def _get_or_create_organization(
    *, name: str, full_name: str, type_id: int
) -> Organization:
    """Return the existing Organization by name, or create a new one.

    Natural key: ``name`` (the spec's "org name" idempotency key).
    """
    existing = Organization.query.filter_by(name=name).first()
    if existing is not None:
        return existing
    org = Organization(
        name=name,
        full_name=full_name,
        type_id=type_id,
        status='Active',
    )
    db.session.add(org)
    db.session.flush()
    return org


def _get_or_create_community_group(
    *, organization_id: int, name: str, abbreviation: str
) -> CommunityGroup:
    """Return the existing CommunityGroup by (org_id, name), or create one."""
    existing = CommunityGroup.query.filter_by(
        organization_id=organization_id, name=name
    ).first()
    if existing is not None:
        return existing
    cg = CommunityGroup(
        organization_id=organization_id,
        name=name,
        abbreviation=abbreviation,
        educational_level=None,
    )
    db.session.add(cg)
    db.session.flush()
    return cg


def _get_or_create_rvm(
    *,
    organization_id: int,
    machine_uuid: str,
    name: str,
    location_name: str,
) -> RVM:
    """Return the existing RVM by ``machine_uuid``, or create one.

    Phase 4A: if the RVM is newly created, generate a random API key,
    store its BCrypt hash, and print the plaintext to stdout once.
    If the RVM already exists but has no ``api_key_hash``, provision
    one on re-run.
    """
    existing = RVM.query.filter_by(machine_uuid=machine_uuid).first()
    if existing is not None:
        # Back-fill api_key_hash on re-run if missing
        if not existing.api_key_hash:
            _provision_api_key(existing)
        return existing
    rvm = RVM(
        organization_id=organization_id,
        machine_uuid=machine_uuid,
        name=name,
        location_name=location_name,
        is_online=True,
        is_capacity_full=False,
    )
    db.session.add(rvm)
    db.session.flush()
    _provision_api_key(rvm)
    return rvm


def _provision_api_key(rvm: RVM) -> None:
    """Generate a random API key, store BCrypt hash, print plaintext once."""
    plaintext_key = secrets.token_urlsafe(32)
    hashed = _bcrypt.hashpw(
        plaintext_key.encode('utf-8'),
        _bcrypt.gensalt(),
    ).decode('utf-8')
    rvm.api_key_hash = hashed
    db.session.flush()
    print(f'  [Phase 4A] RVM API key for "{rvm.name}" '
          f'(uuid={rvm.machine_uuid}): {plaintext_key}')
    print('  ⚠  Store this key securely — it will NOT be shown again.')


def _get_or_create_reward(
    *,
    organization_id: int,
    name: str,
    description: str,
    category: str,
    points_required: int,
) -> Reward:
    """Return the existing Reward by (org_id, name), or create one."""
    existing = Reward.query.filter_by(
        organization_id=organization_id, name=name
    ).first()
    if existing is not None:
        return existing
    reward = Reward(
        organization_id=organization_id,
        name=name,
        description=description,
        category=category,
        points_required=points_required,
        is_active=True,
    )
    db.session.add(reward)
    db.session.flush()

    # Default variant so the reward has stock and is redeemable end-to-end.
    variant = RewardVariant(
        reward_id=reward.id,
        variety_name=REWARD_VARIANT_NAME,
        stock_quantity=REWARD_VARIANT_STOCK,
        is_active=True,
    )
    db.session.add(variant)
    db.session.flush()
    return reward


def _get_or_create_user(
    *,
    community_group_id: int,
    role: str,
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    org_abbreviation: str,
    username: str | None = None,
) -> tuple[User, bool]:
    """Return ``(user, created)``.

    Looks up by ``email`` (deterministic natural key). If the user
    already exists, returns it as-is — does NOT reset the password or
    touch other fields, which keeps primary keys and row counts stable
    across re-runs (Requirement 5.5).
    """
    existing = User.query.filter_by(email=email).first()
    if existing is not None:
        return existing, False

    user = User(
        community_group_id=community_group_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        username=username,
        role=role,
        is_active=True,
    )
    user.set_password(password)

    # ``user_type`` is only set for end-user role per the model docstring;
    # admin roles leave it NULL.
    if role == 'user':
        user.user_type = 'student'
    elif role == 'dependent':
        user.user_type = 'student'

    db.session.add(user)
    db.session.flush()

    # Display ID uses the org's abbreviation prefix so display_ids are
    # both deterministic and human-readable.
    user.display_id = User.generate_display_id(role, org_abbreviation)

    # Wallet + UserSecurity are created alongside every fresh user so
    # downstream queries that join through them never NPE.
    db.session.add(
        Wallet(user_id=user.id, points_balance=0, lifetime_points=0, streak=0)
    )
    db.session.add(
        UserSecurity(user_id=user.id, two_factor_enabled=False)
    )
    db.session.flush()
    return user, True


# ───────────────────────────────────────────────────────────────────────
# Main entrypoint
# ───────────────────────────────────────────────────────────────────────


def run_seed(fresh: bool = False, skip_wipe: bool = False) -> None:
    """Populate the database with the deterministic Phase 5 seed.

    Args:
        fresh: If True, drop and recreate all tables before seeding.
               Defaults to False so re-runs against a populated DB are
               idempotent (the spec's Requirement 5.5).
    """
    # ── 1. Resolve and validate the seed password BEFORE any DB write ──
    password = os.environ.get('SEED_PASSWORD', DEFAULT_SEED_PASSWORD)
    pw_valid, pw_message = validate_password_policy(password)
    if not pw_valid:
        # Per Requirement 5.4: on policy failure, exit non-zero with NO
        # rows touched. We reach this branch BEFORE ``db.create_all`` /
        # ``db.drop_all`` and BEFORE the upsert loop, so the database
        # is guaranteed unmodified.
        print(
            f'[seed] SEED_PASSWORD failed password policy: {pw_message}',
            file=sys.stderr,
        )
        sys.exit(1)

    # ── 2. Drop/create or just create schema, then upsert each entity ──
    if fresh and not skip_wipe:
        print('[seed] Wiping all data (TRUNCATE CASCADE)...')
        _wipe_all_tables()
    elif skip_wipe:
        print('[seed] Skipping wipe (--skip-wipe flag set).')
    print('[seed] Ensuring schema is up to date...')
    db.create_all()

    print('[seed] Upserting OrgType, Organization, CommunityGroup...')
    org_type = _get_or_create_org_type(ORG_TYPE_NAME)
    org = _get_or_create_organization(
        name=ORG_NAME, full_name=ORG_NAME, type_id=org_type.id,
    )
    cg = _get_or_create_community_group(
        organization_id=org.id,
        name=COMMUNITY_GROUP_NAME,
        abbreviation=COMMUNITY_GROUP_ABBR,
    )

    print('[seed] Upserting RVM (Phase 4A: with API key provisioning)...')
    rvm = _get_or_create_rvm(
        organization_id=org.id,
        machine_uuid=RVM_MACHINE_UUID,
        name=RVM_NAME,
        location_name=RVM_LOCATION_NAME,
    )

    # Phase 4A: ensure the org has a QR HMAC secret
    if not org.qr_hmac_secret_enc:
        from ..models import Organization as _Org
        hmac_secret = secrets.token_bytes(32)
        org.qr_hmac_secret_enc = _Org.encrypt_qr_hmac_secret(hmac_secret)
        db.session.flush()
        print('  [Phase 4A] QR HMAC secret provisioned for organization.')

    print('[seed] Upserting Reward...')
    reward = _get_or_create_reward(
        organization_id=org.id,
        name=REWARD_NAME,
        description=REWARD_DESCRIPTION,
        category=REWARD_CATEGORY,
        points_required=REWARD_POINTS_REQUIRED,
    )

    print('[seed] Upserting one User per role...')
    created_count = 0
    reused_count = 0
    for role, first_name, last_name in SEED_ROLES:
        email = f'{role}@ecopoints.local'
        username = role  # e.g. 'superadmin', 'head_admin', 'user'
        _, created = _get_or_create_user(
            community_group_id=cg.id,
            role=role,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password,
            org_abbreviation=ORG_ABBREVIATION,
            username=username,
        )
        if created:
            created_count += 1
        else:
            reused_count += 1

    db.session.commit()

    # ── 3. Summary banner ─────────────────────────────────────────────
    print()
    print('=' * 60)
    print('  Phase 5 deterministic seed COMPLETE')
    print('=' * 60)
    print(f'  Org type ........... {org_type.name}')
    print(f'  Organization ....... {org.name} (id={org.id})')
    print(f'  Community group .... {cg.name} (id={cg.id})')
    print(f'  RVM ................ {rvm.machine_uuid} (id={rvm.id})')
    print(f'  Reward ............. {reward.name} (id={reward.id})')
    print(f'  Users created ...... {created_count}')
    print(f'  Users reused ....... {reused_count}')
    print(f'  Total user rows .... {User.query.count()}')
    print()
    print('  Login emails: <role>@ecopoints.local for role in')
    print('    {superadmin, head_admin, auditor, technician,')
    print('     inventory_officer, user, dependent}')
    print(f'  Password: from $SEED_PASSWORD (default {DEFAULT_SEED_PASSWORD!r})')
    print()


# ═══════════════════════════════════════════════════════════════════════
# UNIFIED DEMO SEED — 50 Users with 2020–2026 Activity Data
# ═══════════════════════════════════════════════════════════════════════

import random
import string
import uuid as _uuid_mod
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from ..models import (
    AdminLog,
    BulkDeposit,
    LoginAttempt,
    MaintenanceLog,
    NotificationSetting,
    OrgAddress,
    OrgContact,
    RecyclingItem,
    RecyclingSession,
    RewardRedemption,
    Transaction,
)

# ── Fixed random seed for reproducibility ─────────────────────────────
_RNG = random.Random(42)

# ── Filipino names pool ───────────────────────────────────────────────
_FIRST_NAMES_M = [
    'Juan', 'Marco', 'Rafael', 'Carlos', 'Miguel',
    'Gabriel', 'Antonio', 'Jose', 'Andres', 'Luis',
    'Paolo', 'Enrique', 'Ramon', 'Jericho', 'Cedric',
    'Benedict', 'Nathaniel', 'Patrick', 'Renzo', 'Tristan',
    'Elijah', 'Adrian', 'Kenneth', 'Christian', 'Darwin',
]
_FIRST_NAMES_F = [
    'Maria', 'Angela', 'Sofia', 'Isabela', 'Camille',
    'Jasmine', 'Katrina', 'Patricia', 'Bianca', 'Nicole',
    'Samantha', 'Daniela', 'Francesca', 'Gabriela', 'Hannah',
    'Joanna', 'Kristine', 'Mikhaela', 'Regina', 'Victoria',
    'Alyssa', 'Beatrice', 'Celeste', 'Diana', 'Elena',
]
_LAST_NAMES = [
    'Dela Cruz', 'Santos', 'Reyes', 'Cruz', 'Bautista',
    'Gonzales', 'Garcia', 'Torres', 'Ramos', 'Villanueva',
    'Mendoza', 'Rivera', 'Fernandez', 'Lopez', 'Martinez',
    'Aquino', 'Castillo', 'Navarro', 'Flores', 'Soriano',
    'Salvador', 'Pascual', 'Dizon', 'Mercado', 'Manalo',
    'Aguilar', 'Valdez', 'Estrella', 'Morales', 'Santiago',
]

_USER_TYPES = ['student', 'student', 'student', 'faculty', 'staff']

# ── Recyclable items ─────────────────────────────────────────────────
_RECYCLABLE_CLASSES = [
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
_REWARDS_DATA = [
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
_ADMIN_ACTIONS = [
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

_MAINTENANCE_ACTIONS = [
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

# ── Year-over-year growth: sessions per user per month ────────────────
_YEAR_SESSION_RANGE = {
    2020: (1, 2),
    2021: (2, 3),
    2022: (3, 4),
    2023: (4, 5),
    2024: (3, 5),
    2025: (4, 6),
    2026: (5, 8),
}

# ── Seasonal multipliers (Philippine academic calendar) ───────────────
_SEASONAL_MULT = {
    1: 1.0, 2: 1.1, 3: 1.0, 4: 0.6, 5: 0.5, 6: 1.2,
    7: 1.3, 8: 1.2, 9: 1.1, 10: 1.0, 11: 0.7, 12: 0.4,
}


def _random_dt(start: datetime, end: datetime) -> datetime:
    delta = end - start
    secs = max(0, int(delta.total_seconds()))
    return start + timedelta(seconds=_RNG.randint(0, secs)) if secs > 0 else start


def _random_ip() -> str:
    return f'192.168.{_RNG.randint(1, 254)}.{_RNG.randint(1, 254)}'


def _redemption_code() -> str:
    return 'ECO-' + ''.join(_RNG.choices(string.ascii_uppercase + string.digits, k=8))


def run_demo_seed(skip_wipe: bool = False) -> None:
    """Unified demo seed: 50 users with 2020–2026 multi-year activity data.

    Calls ``run_seed(fresh=True)`` first to create base entities, then
    layers on 43 additional users and 7 years of recycling activity.
    """
    password = os.environ.get('SEED_PASSWORD', DEFAULT_SEED_PASSWORD)
    pw_valid, pw_msg = validate_password_policy(password)
    if not pw_valid:
        print(f'[demo-seed] Password policy failed: {pw_msg}', file=sys.stderr)
        sys.exit(1)

    # ── 1. Run base seed ──────────────────────────────────────────────
    print('=' * 60)
    print('  PHASE 1: Running base seed...')
    print('=' * 60)
    run_seed(fresh=True, skip_wipe=skip_wipe)

    # ── 2. Load base entities ─────────────────────────────────────────
    print()
    print('=' * 60)
    print('  PHASE 2: Creating demo data (2020–2026)...')
    print('=' * 60)

    org_eptu = Organization.query.filter_by(name='EcoPoints Test University').first()

    # Second org type + org
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

    # ── Addresses ─────────────────────────────────────────────────────
    print('[demo-seed] Creating org addresses...')
    if not OrgAddress.query.filter_by(organization_id=org_eptu.id).first():
        db.session.add(OrgAddress(
            organization_id=org_eptu.id,
            street_address='123 University Avenue',
            barangay='Brgy. Poblacion',
            city_municipality='Quezon City',
            province='Metro Manila', region='NCR', zip_code='1100',
        ))
    if not OrgAddress.query.filter_by(organization_id=org_gcs.id).first():
        db.session.add(OrgAddress(
            organization_id=org_gcs.id,
            street_address='456 Innovation Drive',
            barangay='Brgy. San Antonio',
            city_municipality='Makati City',
            province='Metro Manila', region='NCR', zip_code='1200',
        ))
    db.session.flush()

    # ── Contacts ──────────────────────────────────────────────────────
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

    # ── Community groups ──────────────────────────────────────────────
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
            abbreviation='BSIT', educational_level='College',
        )
        db.session.add(cg_bsit)
        db.session.flush()

    cg_bscs = CommunityGroup.query.filter_by(
        organization_id=org_eptu.id, name='BSCS'
    ).first()
    if not cg_bscs:
        cg_bscs = CommunityGroup(
            organization_id=org_eptu.id, name='BSCS',
            abbreviation='BSCS', educational_level='College',
        )
        db.session.add(cg_bscs)
        db.session.flush()

    cg_it = CommunityGroup.query.filter_by(
        organization_id=org_gcs.id, name='IT Department'
    ).first()
    if not cg_it:
        cg_it = CommunityGroup(
            organization_id=org_gcs.id, name='IT Department',
            abbreviation='IT', educational_level=None,
        )
        db.session.add(cg_it)
        db.session.flush()

    cg_hr = CommunityGroup.query.filter_by(
        organization_id=org_gcs.id, name='HR Department'
    ).first()
    if not cg_hr:
        cg_hr = CommunityGroup(
            organization_id=org_gcs.id, name='HR Department',
            abbreviation='HR', educational_level=None,
        )
        db.session.add(cg_hr)
        db.session.flush()

    eptu_groups = [cg_default, cg_bsit, cg_bscs]
    gcs_groups = [cg_it, cg_hr]

    # ── Additional RVMs ───────────────────────────────────────────────
    print('[demo-seed] Creating additional RVMs...')

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

    # ── Additional rewards ────────────────────────────────────────────
    print('[demo-seed] Creating rewards...')
    all_variants = []
    for rdata in _REWARDS_DATA:
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

    # ── Notification settings ─────────────────────────────────────────
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

    # ── Create 43 additional users with staggered created_at ──────────
    # Users are distributed across years to simulate gradual adoption.
    # Year -> how many users are created that year
    _USER_COHORTS = [
        (2020, 3),   # 3 early adopters (7 admins already exist)
        (2021, 8),
        (2022, 8),
        (2023, 8),
        (2024, 6),
        (2025, 6),
        (2026, 4),
    ]

    print('[demo-seed] Creating 43 additional users (staggered 2020–2026)...')
    all_first_names = _FIRST_NAMES_M + _FIRST_NAMES_F
    _RNG.shuffle(all_first_names)

    demo_users: list[User] = []
    # Load the 7 base seed users (admins, created_at = 2020)
    for role in ['superadmin', 'head_admin', 'auditor', 'technician',
                 'inventory_officer', 'user', 'dependent']:
        u = User.query.filter_by(email=f'{role}@ecopoints.local').first()
        if u:
            # Backdate admin users to Jan 2020 for realistic timeline
            u.created_at = datetime(2020, 1, _RNG.randint(1, 28),
                                    _RNG.randint(8, 17), 0, 0, tzinfo=timezone.utc)
            demo_users.append(u)

    user_i = 0
    cohort_idx = 0
    for cohort_year, cohort_count in _USER_COHORTS:
        for _ in range(cohort_count):
            if user_i >= 43:
                break
            fn = all_first_names[user_i % len(all_first_names)]
            ln = _LAST_NAMES[user_i % len(_LAST_NAMES)]
            email = f'{fn.lower()}.{ln.lower().replace(" ", "")}@ecopoints.local'
            username = f'{fn.lower()}.{ln.lower().replace(" ", "")}'

            existing = User.query.filter_by(email=email).first()
            if existing:
                existing.created_at = datetime(
                    cohort_year, _RNG.randint(1, 12), _RNG.randint(1, 28),
                    _RNG.randint(8, 17), 0, 0, tzinfo=timezone.utc,
                )
                demo_users.append(existing)
                user_i += 1
                continue

            # 70% EPTU, 30% GCS
            if user_i < 30:
                cg = _RNG.choice(eptu_groups)
                org_abbr = 'EPTU'
            else:
                cg = _RNG.choice(gcs_groups)
                org_abbr = 'GCS'

            created_at = datetime(
                cohort_year, _RNG.randint(1, 12), _RNG.randint(1, 28),
                _RNG.randint(8, 17), 0, 0, tzinfo=timezone.utc,
            )

            user = User(
                community_group_id=cg.id,
                first_name=fn,
                last_name=ln,
                email=email,
                username=username,
                role='user',
                is_active=True,
                user_type=_RNG.choice(_USER_TYPES),
                terms_accepted_at=created_at + timedelta(minutes=_RNG.randint(1, 30)),
                created_at=created_at,
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()

            user.display_id = User.generate_display_id('user', org_abbr)

            wallet = Wallet(
                user_id=user.id, points_balance=0,
                lifetime_points=0, streak=_RNG.randint(0, 15),
            )
            db.session.add(wallet)
            db.session.add(UserSecurity(user_id=user.id, two_factor_enabled=False))
            db.session.flush()

            demo_users.append(user)
            user_i += 1

    db.session.flush()
    print(f'  Total users: {User.query.count()}')

    # Collect end-users with wallets, and admin/tech users
    end_users = [u for u in demo_users if u.role in ('user', 'dependent') and u.wallet]
    admin_users = [u for u in demo_users if u.is_admin]
    tech_users = [u for u in demo_users if u.role == 'technician']
    if not tech_users:
        tech_users = admin_users[:1]

    # ── Recycling sessions + items + transactions (2020–2026) ─────────
    NOW = datetime.now(timezone.utc)
    print('[demo-seed] Creating recycling sessions (2020–2026)...')
    session_count = 0
    item_count = 0
    txn_count = 0

    for year in range(2020, NOW.year + 1):
        lo, hi = _YEAR_SESSION_RANGE.get(year, (3, 5))

        for month in range(1, 13):
            # Don't generate future months
            if year == NOW.year and month > NOW.month:
                break

            seasonal = _SEASONAL_MULT.get(month, 1.0)
            month_start = datetime(year, month, 1, tzinfo=timezone.utc)
            # End of month
            if month == 12:
                month_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
            else:
                month_end = datetime(year, month + 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)

            # Cap to now if current month
            if month_end > NOW:
                month_end = NOW

            # Only users who existed before this month can recycle
            eligible = [u for u in end_users if u.created_at and u.created_at <= month_end]
            if not eligible:
                continue

            for user in eligible:
                # Number of sessions this month for this user
                base_sessions = _RNG.randint(lo, hi)
                adjusted = max(1, int(base_sessions * seasonal))
                # Not every user recycles every month — 70% chance
                if _RNG.random() > 0.7:
                    continue

                for _ in range(adjusted):
                    session_start = _random_dt(month_start, month_end - timedelta(hours=1))
                    session_end = session_start + timedelta(minutes=_RNG.randint(2, 15))
                    rvm = _RNG.choice(rvms)

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
                    num_items = _RNG.randint(2, 5)
                    session_points = 0
                    for j in range(num_items):
                        detected_class, base_points = _RNG.choice(_RECYCLABLE_CLASSES)
                        confidence = round(_RNG.uniform(85.0, 99.9), 2)
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

                    # Earn transaction
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

            # Flush per-month to avoid huge uncommitted batch
            db.session.flush()

        print(f'  Year {year}: {session_count} sessions, {item_count} items so far')

    print(f'  Total — Sessions: {session_count}, Items: {item_count}, Transactions: {txn_count}')

    # ── Reward redemptions (spread across timeline) ───────────────────
    print('[demo-seed] Creating reward redemptions...')
    redemption_count = 0
    eligible_redeemers = [u for u in end_users if u.wallet.points_balance >= 50]

    for _ in range(min(80, len(eligible_redeemers) * 2)):
        user = _RNG.choice(eligible_redeemers)
        variant = _RNG.choice(all_variants)
        reward = variant.reward
        cost = reward.points_required

        if user.wallet.points_balance < cost:
            continue

        balance_before = user.wallet.points_balance
        user.wallet.points_balance -= cost

        is_claimed = _RNG.random() > 0.3
        # Spread redemptions across the user's active period
        redeem_start = max(
            user.created_at + timedelta(days=30),
            datetime(2021, 1, 1, tzinfo=timezone.utc),
        )
        redeemed_at = _random_dt(redeem_start, NOW)
        claimed_at = redeemed_at + timedelta(days=_RNG.randint(1, 5)) if is_claimed else None

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

    # ── Admin logs (spread across 2020–2026) ──────────────────────────
    print('[demo-seed] Creating admin logs...')
    admin_log_count = 0
    log_start = datetime(2020, 1, 1, tzinfo=timezone.utc)
    for _ in range(120):
        admin = _RNG.choice(admin_users) if admin_users else demo_users[0]
        action, category, note_tmpl = _RNG.choice(_ADMIN_ACTIONS)
        target_user = _RNG.choice(demo_users)
        target_name = f'{target_user.first_name} {target_user.last_name}'

        log = AdminLog(
            admin_user_id=admin.id,
            action=action,
            target=target_name,
            category=category,
            notes=note_tmpl.format(target=target_name),
            created_at=_random_dt(log_start, NOW),
        )
        db.session.add(log)
        admin_log_count += 1

    db.session.flush()
    print(f'  Admin logs: {admin_log_count}')

    # ── Maintenance logs (spread across timeline) ─────────────────────
    print('[demo-seed] Creating maintenance logs...')
    maint_count = 0
    for _ in range(3):  # 3 rounds of all 10 actions = 30 logs
        for action_type, status, notes in _MAINTENANCE_ACTIONS:
            rvm = _RNG.choice(rvms)
            tech = _RNG.choice(tech_users)
            log = MaintenanceLog(
                rvm_id=rvm.id,
                performed_by_id=tech.id,
                action_type=action_type,
                status=status,
                notes=notes,
                created_at=_random_dt(log_start, NOW),
            )
            db.session.add(log)
            maint_count += 1

    db.session.flush()
    print(f'  Maintenance logs: {maint_count}')

    # ── Login attempts (spread across timeline) ───────────────────────
    print('[demo-seed] Creating login attempts...')
    login_count = 0
    for _ in range(200):
        user = _RNG.choice(demo_users)
        is_success = _RNG.random() > 0.15
        if is_success:
            attempt_time = _random_dt(log_start, NOW)
        else:
            # Failed attempts > 1 hour old to avoid lockout
            attempt_time = _random_dt(log_start, NOW - timedelta(hours=1))
        attempt = LoginAttempt(
            identifier=user.email,
            ip_address=_random_ip(),
            user_id=user.id,
            is_success=is_success,
            failure_reason=None if is_success else _RNG.choice([
                'Wrong Password', 'Account Locked', 'Invalid OTP',
            ]),
            attempted_at=attempt_time,
        )
        db.session.add(attempt)
        login_count += 1

    db.session.flush()
    print(f'  Login attempts: {login_count}')

    # ── Bulk deposits ─────────────────────────────────────────────────
    print('[demo-seed] Creating bulk deposits...')
    bulk_count = 0
    for _ in range(10):
        admin = _RNG.choice(admin_users) if admin_users else demo_users[0]
        target = _RNG.choice(end_users)
        pts = _RNG.choice([25, 50, 75, 100, 150])

        balance_before = target.wallet.points_balance
        target.wallet.points_balance += pts
        target.wallet.lifetime_points += pts

        bd = BulkDeposit(
            admin_user_id=admin.id,
            wallet_id=target.wallet.id,
            total_points_awarded=pts,
            item_count=_RNG.randint(5, 30),
            notes=f'Manual deposit: {_RNG.choice(["Dropped off bags of bottles", "Campus cleanup drive", "Eco-week special collection", "Department recycling batch", "Student org collection drive"])}',
            created_at=_random_dt(log_start, NOW),
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

    # ── Summary ───────────────────────────────────────────────────────
    print()
    print('=' * 60)
    print('  UNIFIED DEMO SEED COMPLETE (2020–2026)')
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

