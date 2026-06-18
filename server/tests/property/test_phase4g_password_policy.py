"""
Phase 4G / Property U — Password policy on admin-create.

Validates: Requirements 4G.28, 4G.29.

Two leaf assertions:

1. **Violating passwords (Requirement 4G.29)** — For every password that
   fails at least one policy rule (too short, no uppercase, no lowercase,
   no digit), ``POST /api/web/users`` MUST respond HTTP 400 with
   ``error.code == "WEAK_PASSWORD"`` and the ``users`` row count in the
   DB MUST be unchanged.

2. **Satisfying passwords (Requirement 4G.28)** — For every password that
   meets all policy rules (length ≥ 8, ≥ 1 uppercase, ≥ 1 lowercase,
   ≥ 1 digit), ``POST /api/web/users`` MUST respond HTTP 201 and exactly
   one new ``users`` row MUST exist.

The test mounts a self-contained Flask app with the real ``users_bp``
registered under a ``/api/web`` prefix, seeds one ``superadmin`` actor
(to satisfy ``@permission_required('users')``), and mints a fresh JWT
per Hypothesis example.  A fresh unique email is generated per example
so uniqueness constraints never interfere with the password-policy
assertion.

``AUTH_CSRF_DISABLED=true`` is set so the CSRF double-submit check does
not interfere (we are testing password policy, not CSRF).
"""
from __future__ import annotations

import string
import uuid
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from flask import Blueprint, Flask
from hypothesis import HealthCheck, given, settings, strategies as st

from app import Config, db
from app.models import CommunityGroup, OrgType, Organization, User


# ─────────────────────────────────────────────────────────────────────
# Hypothesis strategies
# ─────────────────────────────────────────────────────────────────────

# Characters used to build passwords.
_UPPER = string.ascii_uppercase
_LOWER = string.ascii_lowercase
_DIGITS = string.digits
_SAFE_EXTRA = string.punctuation.replace('"', '').replace("'", '').replace('\\', '')
_ALL_CHARS = _UPPER + _LOWER + _DIGITS + _SAFE_EXTRA


def passwords_violating_policy():
    """Generate passwords that fail at least one policy rule.

    Four sub-strategies, each violating exactly one rule:
      1. Too short (< 8 chars) — drawn from all chars but length 1-7.
      2. No uppercase — length ≥ 8, only lowercase + digits.
      3. No lowercase — length ≥ 8, only uppercase + digits.
      4. No digit — length ≥ 8, only letters (upper + lower).
    """
    # 1. Too short (but may still have upper/lower/digit — doesn't matter)
    too_short = st.text(
        alphabet=_ALL_CHARS,
        min_size=1,
        max_size=7,
    )

    # 2. No uppercase: lowercase + digits only, length ≥ 8
    no_upper = st.text(
        alphabet=_LOWER + _DIGITS,
        min_size=8,
        max_size=32,
    ).filter(lambda p: any(c in _LOWER for c in p) and any(c in _DIGITS for c in p))

    # 3. No lowercase: uppercase + digits only, length ≥ 8
    no_lower = st.text(
        alphabet=_UPPER + _DIGITS,
        min_size=8,
        max_size=32,
    ).filter(lambda p: any(c in _UPPER for c in p) and any(c in _DIGITS for c in p))

    # 4. No digit: letters only, length ≥ 8
    no_digit = st.text(
        alphabet=_UPPER + _LOWER,
        min_size=8,
        max_size=32,
    ).filter(lambda p: any(c in _UPPER for c in p) and any(c in _LOWER for c in p))

    return st.one_of(too_short, no_upper, no_lower, no_digit)


def passwords_satisfying_policy():
    """Generate passwords that satisfy all policy rules.

    Strategy: build a password by concatenating:
      - 1 uppercase letter
      - 1 lowercase letter
      - 1 digit
      - 5+ additional characters from the full alphabet

    Then shuffle the result so the required chars are not always at the
    front (which would make the strategy trivially predictable).
    """
    required = st.builds(
        lambda u, l, d: u + l + d,
        st.text(alphabet=_UPPER, min_size=1, max_size=1),
        st.text(alphabet=_LOWER, min_size=1, max_size=1),
        st.text(alphabet=_DIGITS, min_size=1, max_size=1),
    )
    padding = st.text(alphabet=_ALL_CHARS, min_size=5, max_size=29)

    # Use st.permutations to shuffle without touching the random module.
    def combine_and_permute(req: str, pad: str) -> st.SearchStrategy[str]:
        chars = list(req + pad)
        return st.permutations(chars).map(''.join)

    return st.builds(combine_and_permute, required, padding).flatmap(lambda s: s).filter(
        lambda p: (
            len(p) >= 8
            and any(c in _UPPER for c in p)
            and any(c in _LOWER for c in p)
            and any(c in _DIGITS for c in p)
        )
    )


# ─────────────────────────────────────────────────────────────────────
# App fixture
# ─────────────────────────────────────────────────────────────────────


@pytest.fixture(scope='module')
def pw_policy_app():
    """Self-contained Flask app with the real ``users_bp`` registered.

    Seeds:
      - One Organization → CommunityGroup chain.
      - One ``superadmin`` actor (used to mint JWTs and satisfy the
        ``@permission_required('users')`` guard).

    Returns ``(app, actor_user_id, org_id, group_id)``.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        'sqlite:///file:pw-policy-test?mode=memory&cache=shared&uri=true'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-pw-policy'
    app.config['JWT_EXPIRY_HOURS'] = 1
    app.config['TESTING'] = True

    db.init_app(app)

    # Register the real users_bp under /api/web/users
    from app.controllers.users_controller import users_bp

    web_bp = Blueprint('web_pw_policy', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()

        suffix = uuid.uuid4().hex[:8]
        org_type = OrgType(name=f'PwPolicyUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'PWPOL-{suffix}',
            full_name='Password Policy Test University',
            type_id=org_type.id,
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

        actor = User(
            community_group_id=group.id,
            first_name='Admin',
            last_name='Actor',
            email=f'actor-{suffix}@example.test',
            username=f'actor_{suffix}',
            password_hash='not-used-directly',
            role='superadmin',
            is_active=True,
        )
        db.session.add(actor)
        db.session.commit()

        actor_id = actor.id
        org_id = org.id
        group_id = group.id

    yield app, actor_id, org_id, group_id

    with app.app_context():
        db.session.remove()


def _mint_jwt(app: Flask, user_id: int, role: str = 'superadmin') -> str:
    """Mint an HS256 JWT mirroring the auth_controller.login token shape."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return pyjwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def _user_count(app: Flask) -> int:
    """Return the current total number of User rows in the DB."""
    with app.app_context():
        return User.query.count()


# ─────────────────────────────────────────────────────────────────────
# Property U — violating passwords → HTTP 400 WEAK_PASSWORD, no new row
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(password=passwords_violating_policy())
def test_weak_password_rejected_on_admin_create(pw_policy_app, monkeypatch, password):
    """Property U (violating) — Validates: Requirements 4G.28, 4G.29.

    For every password that fails at least one policy rule, the admin
    user-create endpoint MUST:
      - Return HTTP 400.
      - Return ``error.code == "WEAK_PASSWORD"``.
      - Leave the ``users`` row count unchanged.
    """
    app, actor_id, org_id, group_id = pw_policy_app

    # Disable CSRF and cookie-only mode so the test focuses on password policy.
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    token = _mint_jwt(app, actor_id)
    before_count = _user_count(app)

    # Use a unique email per example to avoid 409 Conflict masking the 400.
    unique_email = f'weak-{uuid.uuid4().hex[:12]}@example.test'

    with app.test_client() as client:
        resp = client.post(
            '/api/web/users',
            json={
                'firstName': 'Test',
                'lastName': 'User',
                'email': unique_email,
                'password': password,
                'role': 'user',
                'locationId': org_id,
                'groupId': group_id,
            },
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 400, (
        f'Expected HTTP 400 for weak password {password!r}; '
        f'got {resp.status_code}: {resp.get_data(as_text=True)}'
    )

    body = resp.get_json()
    assert body is not None, 'Response body must be JSON'
    assert body.get('success') is False, f'Expected success=False; got {body!r}'

    err = body.get('error')
    assert isinstance(err, dict), f'error must be a dict; got {err!r}'
    assert err.get('code') == 'WEAK_PASSWORD', (
        f'Expected error.code == "WEAK_PASSWORD" for password {password!r}; '
        f'got {err!r}'
    )
    assert 'policy' in err, (
        f'Expected "policy" key in error dict; got {err!r}'
    )

    after_count = _user_count(app)
    assert after_count == before_count, (
        f'Expected user count to be unchanged ({before_count}) after weak-password '
        f'rejection; got {after_count} (password={password!r})'
    )


# ─────────────────────────────────────────────────────────────────────
# Property U — satisfying passwords → HTTP 201, one new row
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(password=passwords_satisfying_policy())
def test_strong_password_accepted_on_admin_create(pw_policy_app, monkeypatch, password):
    """Property U (satisfying) — Validates: Requirements 4G.28, 4G.29.

    For every password that meets all policy rules, the admin user-create
    endpoint MUST:
      - Return HTTP 201.
      - Create exactly one new ``users`` row.
    """
    app, actor_id, org_id, group_id = pw_policy_app

    # Disable CSRF and cookie-only mode so the test focuses on password policy.
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    token = _mint_jwt(app, actor_id)
    before_count = _user_count(app)

    # Use a unique email per example to avoid 409 Conflict.
    unique_email = f'strong-{uuid.uuid4().hex[:12]}@example.test'

    with app.test_client() as client:
        resp = client.post(
            '/api/web/users',
            json={
                'firstName': 'Test',
                'lastName': 'User',
                'email': unique_email,
                'password': password,
                'role': 'user',
                'locationId': org_id,
                'groupId': group_id,
            },
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 201, (
        f'Expected HTTP 201 for strong password {password!r}; '
        f'got {resp.status_code}: {resp.get_data(as_text=True)}'
    )

    body = resp.get_json()
    assert body is not None, 'Response body must be JSON'
    assert body.get('success') is True, f'Expected success=True; got {body!r}'

    after_count = _user_count(app)
    assert after_count == before_count + 1, (
        f'Expected exactly one new user row after successful create '
        f'(before={before_count}, after={after_count}, password={password!r})'
    )
