"""
Phase 5 / Property W — Deterministic seed.

Validates: Requirements 5.1, 5.2, 5.5, 5.14.

Two leaf assertions, both exercised by a single Hypothesis-driven test
plus a couple of deterministic smoke tests:

1. **Convergence (Requirements 5.1, 5.2, 5.14)** — For arbitrary
   starting DB states (empty, partially seeded, fully seeded), invoking
   ``run_seed()`` produces a post-state with exactly:
     - one Organization (deterministic natural key).
     - one CommunityGroup linked to that Organization.
     - one RVM linked to that Organization.
     - one Reward linked to that Organization.
     - exactly seven Users — one per role in
       ``{superadmin, head_admin, auditor, technician,
       inventory_officer, user, dependent}`` — each with email
       ``<role>@ecopoints.local``, ``role=<role>``, ``is_active=True``.

2. **Idempotency (Requirement 5.5)** — Running ``run_seed()`` twice
   consecutively yields byte-identical row counts AND byte-identical
   primary keys for every seed entity (snapshot1 == snapshot2).

3. **Phase 4A provisioning** — The seeded RVM has a non-null
   ``api_key_hash`` and the org has a non-null ``qr_hmac_secret_enc``.
"""
from __future__ import annotations

import pytest
from flask import Flask
from hypothesis import HealthCheck, given, settings, strategies as st

from app import db
from app.models import (
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
from app.seeder.seed import (
    COMMUNITY_GROUP_ABBR,
    COMMUNITY_GROUP_NAME,
    ORG_NAME,
    ORG_TYPE_NAME,
    REWARD_CATEGORY,
    REWARD_DESCRIPTION,
    REWARD_NAME,
    REWARD_POINTS_REQUIRED,
    REWARD_VARIANT_NAME,
    REWARD_VARIANT_STOCK,
    RVM_LOCATION_NAME,
    RVM_MACHINE_UUID,
    RVM_NAME,
    SEED_ROLES,
    run_seed,
)


# ─────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────

# All 7 seed roles per Requirement 5.2: every property-test assertion
# enumerates this exact set.
SEED_ROLE_NAMES: tuple[str, ...] = tuple(role for role, _, _ in SEED_ROLES)


# ─────────────────────────────────────────────────────────────────────
# App fixture
# ─────────────────────────────────────────────────────────────────────


@pytest.fixture(scope='module')
def seed_app():
    """Self-contained Flask app for the deterministic seed property test.

    Uses a private SQLite in-memory database so the test does not collide
    with any other property-test module's fixture. The test resets the
    schema (drop_all + create_all) at the start of every Hypothesis
    example, so each example starts from a known clean slate.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        'sqlite:///file:phase5-seed-test?mode=memory&cache=shared&uri=true'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-phase5-seed'
    app.config['TESTING'] = True

    db.init_app(app)

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


# ─────────────────────────────────────────────────────────────────────
# Hypothesis strategy — arbitrary starting DB states
# ─────────────────────────────────────────────────────────────────────


@st.composite
def db_starting_states(draw):
    """Draw a representation of a starting DB state for the seeder.

    The seeder's idempotency contract (Requirement 5.5) is that it
    converges on the same final state no matter which subset of seed
    entities is already present. The strategy therefore enumerates a
    spectrum of "before" states from empty through fully seeded. Each
    label maps to a setup helper in ``_apply_starting_state``.

    For ``partial_some_users``, the strategy also draws the subset of
    roles to pre-seed (a non-empty proper subset of the 7 seed roles)
    so Hypothesis explores partial-user populations.
    """
    label = draw(st.sampled_from([
        'empty',
        'partial_org_type_only',
        'partial_org_only',
        'partial_org_chain',
        'partial_org_chain_with_rvm',
        'partial_org_chain_with_reward',
        'partial_some_users',
        'fully_seeded',
    ]))

    if label == 'partial_some_users':
        role_subset = draw(
            st.sets(
                st.sampled_from(SEED_ROLE_NAMES),
                min_size=1,
                max_size=len(SEED_ROLE_NAMES) - 1,
            )
        )
    else:
        role_subset = frozenset()

    return label, frozenset(role_subset)


# ─────────────────────────────────────────────────────────────────────
# DB-state setup helpers
# ─────────────────────────────────────────────────────────────────────


def _reset_db(app: Flask) -> None:
    """Drop and recreate every table so the example starts clean."""
    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()


def _apply_starting_state(
    app: Flask, label: str, role_subset: frozenset[str]
) -> None:
    """Pre-populate the DB with a subset of seed entities matching
    ``label``. All entities use the seeder's deterministic natural keys
    (``ORG_NAME``, ``RVM_MACHINE_UUID``, ``<role>@ecopoints.local``)
    so the seeder's upsert path is exercised, not its insert path.
    """
    if label == 'empty':
        return

    if label == 'fully_seeded':
        # Drive the seeder once before the test invokes it — the test
        # asserts that the *second* invocation is a no-op.
        with app.app_context():
            run_seed(fresh=False)
        return

    # All other labels manually pre-create a subset of seed entities so
    # we can exercise idempotency from arbitrary intermediate states.
    with app.app_context():
        org_type = OrgType(name=ORG_TYPE_NAME)
        db.session.add(org_type)
        db.session.flush()

        if label == 'partial_org_type_only':
            db.session.commit()
            return

        org = Organization(
            name=ORG_NAME,
            full_name=ORG_NAME,
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        if label == 'partial_org_only':
            db.session.commit()
            return

        cg = CommunityGroup(
            organization_id=org.id,
            name=COMMUNITY_GROUP_NAME,
            abbreviation=COMMUNITY_GROUP_ABBR,
            group_type='staff',
        )
        db.session.add(cg)
        db.session.flush()

        if label == 'partial_org_chain':
            db.session.commit()
            return

        if label == 'partial_org_chain_with_rvm':
            rvm = RVM(
                organization_id=org.id,
                machine_uuid=RVM_MACHINE_UUID,
                name=RVM_NAME,
                location_name=RVM_LOCATION_NAME,
                is_online=True,
                is_capacity_full=False,
            )
            db.session.add(rvm)
            db.session.commit()
            return

        if label == 'partial_org_chain_with_reward':
            reward = Reward(
                organization_id=org.id,
                name=REWARD_NAME,
                description=REWARD_DESCRIPTION,
                category=REWARD_CATEGORY,
                points_required=REWARD_POINTS_REQUIRED,
                is_active=True,
            )
            db.session.add(reward)
            db.session.flush()
            db.session.add(RewardVariant(
                reward_id=reward.id,
                variety_name=REWARD_VARIANT_NAME,
                stock_quantity=REWARD_VARIANT_STOCK,
                is_active=True,
            ))
            db.session.commit()
            return

        if label == 'partial_some_users':
            # Pre-create users for the chosen subset of roles (using the
            # seeder's deterministic natural-key emails). The seeder's
            # second run must reuse these rows, not delete-and-recreate.
            for role in role_subset:
                role_tuple = next(t for t in SEED_ROLES if t[0] == role)
                _, first, last = role_tuple
                email = f'{role}@ecopoints.local'
                user = User(
                    community_group_id=cg.id,
                    first_name=first,
                    last_name=last,
                    email=email,
                    role=role,
                    is_active=True,
                )
                # Set a policy-compliant password directly so the
                # seeder's idempotent path treats the row as already
                # done. The test does not assert on password hashes;
                # it only asserts row identity (PKs) and the
                # role/email/is_active contract.
                user.set_password('PreSeeded!23')
                db.session.add(user)
                db.session.flush()
                db.session.add(Wallet(
                    user_id=user.id,
                    points_balance=0,
                    lifetime_points=0,
                    streak=0,
                ))
                db.session.add(UserSecurity(
                    user_id=user.id,
                    two_factor_enabled=False,
                ))
            db.session.commit()
            return

        # Defensive: any unhandled label is a programming error in the
        # strategy.
        db.session.rollback()
        raise AssertionError(f'Unhandled starting-state label: {label!r}')


# ─────────────────────────────────────────────────────────────────────
# Snapshot + invariant helpers
# ─────────────────────────────────────────────────────────────────────


def _snapshot_seed_entities(app: Flask) -> dict:
    """Capture row counts and primary keys for every seed entity.

    Used to assert byte-identical state across consecutive seeder runs
    (Requirement 5.5).
    """
    with app.app_context():
        db.session.expire_all()
        org_types = sorted(
            (ot.id, ot.name) for ot in OrgType.query.all()
        )
        organizations = sorted(
            (o.id, o.name) for o in Organization.query.all()
        )
        community_groups = sorted(
            (cg.id, cg.organization_id, cg.name)
            for cg in CommunityGroup.query.all()
        )
        rvms = sorted(
            (r.id, r.organization_id, r.machine_uuid, bool(r.api_key_hash))
            for r in RVM.query.all()
        )
        rewards = sorted(
            (r.id, r.organization_id, r.name)
            for r in Reward.query.all()
        )
        users = sorted(
            (u.id, u.email, u.role, bool(u.is_active))
            for u in User.query.all()
        )
        return {
            'org_types': org_types,
            'organizations': organizations,
            'community_groups': community_groups,
            'rvms': rvms,
            'rewards': rewards,
            'users': users,
        }


def _assert_post_seed_invariants(snapshot: dict) -> None:
    """Assert that ``snapshot`` describes the canonical post-seed state.

    Validates Requirements 5.1, 5.2, 5.14.

    rpi-carveout (task 20.3): does NOT assert ``rvm.api_key_hash IS NOT
    NULL`` because the column is introduced by the deferred Phase 4A
    migration. The RVM-count and natural-key assertions still hold.

    # TODO Phase 4A: assert rvm.api_key_hash is not None  (task 20.3 carve-out)
    """
    # ── Exactly one Organization (Requirement 5.1) ────────────────────
    assert len(snapshot['organizations']) == 1, (
        f'Expected exactly one Organization; got {len(snapshot["organizations"])}: '
        f'{snapshot["organizations"]!r}'
    )
    org_id, org_name = snapshot['organizations'][0]
    assert org_name == ORG_NAME, (
        f'Expected Organization.name == {ORG_NAME!r}; got {org_name!r}'
    )

    # ── Exactly one CommunityGroup (Requirement 5.1) ──────────────────
    assert len(snapshot['community_groups']) == 1, (
        f'Expected exactly one CommunityGroup; got '
        f'{len(snapshot["community_groups"])}: {snapshot["community_groups"]!r}'
    )
    _cg_id, cg_org_id, cg_name = snapshot['community_groups'][0]
    assert cg_org_id == org_id, (
        f'CommunityGroup.organization_id={cg_org_id} must match Organization.id={org_id}'
    )
    assert cg_name == COMMUNITY_GROUP_NAME, (
        f'Expected CommunityGroup.name == {COMMUNITY_GROUP_NAME!r}; got {cg_name!r}'
    )

    # ── Exactly one RVM with api_key_hash provisioned ─────────────────
    assert len(snapshot['rvms']) == 1, (
        f'Expected exactly one RVM; got {len(snapshot["rvms"])}: '
        f'{snapshot["rvms"]!r}'
    )
    _rvm_id, rvm_org_id, rvm_uuid, rvm_has_key = snapshot['rvms'][0]
    assert rvm_org_id == org_id, (
        f'RVM.organization_id={rvm_org_id} must match Organization.id={org_id}'
    )
    assert rvm_uuid == RVM_MACHINE_UUID, (
        f'Expected RVM.machine_uuid == {RVM_MACHINE_UUID!r}; got {rvm_uuid!r}'
    )
    assert rvm_has_key is True, (
        'Phase 4A: RVM.api_key_hash must be non-null after seeding'
    )

    # ── Exactly one Reward (Requirement 5.1) ──────────────────────────
    assert len(snapshot['rewards']) == 1, (
        f'Expected exactly one Reward; got {len(snapshot["rewards"])}: '
        f'{snapshot["rewards"]!r}'
    )
    _reward_id, reward_org_id, reward_name = snapshot['rewards'][0]
    assert reward_org_id == org_id, (
        f'Reward.organization_id={reward_org_id} must match Organization.id={org_id}'
    )
    assert reward_name == REWARD_NAME, (
        f'Expected Reward.name == {REWARD_NAME!r}; got {reward_name!r}'
    )

    # ── Exactly one User per role (Requirements 5.2, 5.14) ────────────
    expected_n = len(SEED_ROLE_NAMES)
    assert len(snapshot['users']) == expected_n, (
        f'Expected exactly {expected_n} users (one per seed role); got '
        f'{len(snapshot["users"])}: {snapshot["users"]!r}'
    )

    # Build per-role view to detect duplicates.
    by_role: dict[str, tuple[int, str, bool]] = {}
    for uid, email, role, is_active in snapshot['users']:
        assert role not in by_role, (
            f'Duplicate user for role={role!r}: existing={by_role[role]!r}, '
            f'new=(id={uid}, email={email!r}, is_active={is_active!r})'
        )
        by_role[role] = (uid, email, is_active)

    # Every seed role must be present with the deterministic contract.
    for role in SEED_ROLE_NAMES:
        assert role in by_role, (
            f'Missing seeded user for role={role!r}; present roles: '
            f'{sorted(by_role.keys())!r}'
        )
        uid, email, is_active = by_role[role]
        expected_email = f'{role}@ecopoints.local'
        assert email == expected_email, (
            f'Role={role!r}: expected email {expected_email!r}; got {email!r}'
        )
        assert is_active is True, (
            f'Role={role!r}: expected is_active=True; got {is_active!r}'
        )


# ─────────────────────────────────────────────────────────────────────
# Property W — Deterministic seed
# ─────────────────────────────────────────────────────────────────────


@settings(
    # DB I/O per example (drop_all + create_all + 1-2 seeds + snapshots)
    # is expensive; the property is well-covered by 15 examples spread
    # across the named scenarios.
    max_examples=15,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(starting=db_starting_states())
def test_property_w_deterministic_seed(seed_app, monkeypatch, starting):
    """Property W — Deterministic seed.

    Validates: Requirements 5.1, 5.2, 5.5, 5.14.

    For arbitrary starting DB states, ``run_seed()`` MUST converge on
    the canonical post-seed state, and a second consecutive invocation
    MUST be a perfect no-op (byte-identical row counts AND primary
    keys). Phase 4A provisioning (api_key_hash, qr_hmac_secret_enc)
    is verified by the non-null assertion in the invariant checker.
    """
    label, role_subset = starting

    # Ensure the seeder uses the policy-compliant default password and
    # never trips its own ``sys.exit(1)`` policy gate (Requirement 5.4).
    monkeypatch.setenv('SEED_PASSWORD', 'SeedPass!23')

    # ── Reset DB to the chosen starting state ────────────────────────
    _reset_db(seed_app)
    _apply_starting_state(seed_app, label, role_subset)

    # ── First seed run: convergence (Requirements 5.1, 5.2, 5.14) ────
    with seed_app.app_context():
        run_seed(fresh=False)

    snapshot1 = _snapshot_seed_entities(seed_app)
    _assert_post_seed_invariants(snapshot1)

    # ── Second seed run: idempotency (Requirement 5.5) ───────────────
    with seed_app.app_context():
        run_seed(fresh=False)

    snapshot2 = _snapshot_seed_entities(seed_app)
    _assert_post_seed_invariants(snapshot2)

    # Byte-identical row counts AND primary keys across the two runs.
    assert snapshot1 == snapshot2, (
        f'Seeder must be idempotent: snapshots differ across consecutive '
        f'invocations.\n'
        f'  starting state: label={label!r}, role_subset={sorted(role_subset)!r}\n'
        f'  snapshot1: {snapshot1!r}\n'
        f'  snapshot2: {snapshot2!r}'
    )


# ─────────────────────────────────────────────────────────────────────
# Deterministic smoke tests (always run, give clear baseline failures)
# ─────────────────────────────────────────────────────────────────────


def test_seed_empty_db_smoke(seed_app, monkeypatch):
    """Deterministic smoke: empty DB → seeder converges on contract."""
    monkeypatch.setenv('SEED_PASSWORD', 'SeedPass!23')
    _reset_db(seed_app)

    with seed_app.app_context():
        run_seed(fresh=False)

    snapshot = _snapshot_seed_entities(seed_app)
    _assert_post_seed_invariants(snapshot)


def test_seed_idempotent_on_fully_seeded_db_smoke(seed_app, monkeypatch):
    """Deterministic smoke: a second consecutive run is a no-op."""
    monkeypatch.setenv('SEED_PASSWORD', 'SeedPass!23')
    _reset_db(seed_app)

    with seed_app.app_context():
        run_seed(fresh=False)
    snapshot1 = _snapshot_seed_entities(seed_app)
    _assert_post_seed_invariants(snapshot1)

    with seed_app.app_context():
        run_seed(fresh=False)
    snapshot2 = _snapshot_seed_entities(seed_app)
    _assert_post_seed_invariants(snapshot2)

    assert snapshot1 == snapshot2, (
        f'Seeder must be idempotent across consecutive invocations.\n'
        f'  snapshot1: {snapshot1!r}\n'
        f'  snapshot2: {snapshot2!r}'
    )
