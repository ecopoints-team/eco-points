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


def run_seed(fresh: bool = False) -> None:
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
    if fresh:
        print('[seed] Dropping all tables...')
        db.drop_all()
        print('[seed] Creating all tables...')
        db.create_all()
    else:
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
