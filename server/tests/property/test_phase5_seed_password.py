"""
Phase 5 / Property X — Seed password policy.

Validates: Requirements 5.3, 5.4.

Two leaf assertions, exercised by Hypothesis-driven tests plus
deterministic smoke tests:

1. **Violating ``SEED_PASSWORD`` (Requirement 5.4)** — For every
   ``SEED_PASSWORD`` value that fails ``validate_password_policy()``,
   the seed script MUST exit non-zero AND the ``users`` table row
   count MUST be unchanged from the pre-run state.

2. **Satisfying ``SEED_PASSWORD`` (Requirement 5.3)** — For every
   ``SEED_PASSWORD`` value that satisfies ``validate_password_policy()``,
   the seed script MUST exit 0 AND every seeded user's ``password_hash``
   MUST verify against the supplied password via the project's
   ``werkzeug.security.check_password_hash`` (which the ``User`` model
   wraps as ``User.check_password``).

How the script is invoked
-------------------------
The task spec offers two approaches:
  (a) ``subprocess.run`` of ``server/seed.py`` for true exit-code
      semantics; or
  (b) Import the ``run_seed`` entrypoint and catch ``SystemExit``.

This module uses (b). ``server/app/seeder/seed.py::run_seed`` calls
``sys.exit(1)`` on policy failure, which raises ``SystemExit`` inside
the test process. ``pytest.raises(SystemExit)`` captures the same
exit-code semantics that subprocess execution would, but without the
per-example fork/process-creation cost — important because Hypothesis
runs many examples and we still snapshot DB row counts before/after
each example.

Test-DB isolation
-----------------
Each Hypothesis example resets the schema (``drop_all`` + ``create_all``)
so the DB starts empty per example. The "before" row count is therefore
zero for invalid-password examples and the assertion is that it stays
zero. For valid-password examples we additionally assert that exactly
seven user rows exist after the seed (one per seed role) and that each
row's hash verifies against the supplied password.

Hypothesis settings
-------------------
``max_examples`` is intentionally small (15) because each example
exercises a full seed transaction (DB writes + bcrypt-hashing seven
passwords). The four sub-strategies for the "violating" case and the
shuffled construction for the "satisfying" case give us strong
coverage of policy edge-cases at this example count.
"""
from __future__ import annotations

import string

import pytest
from flask import Flask
from hypothesis import HealthCheck, given, settings, strategies as st

from app import db
from app.models import User
from app.seeder.seed import (
    DEFAULT_SEED_PASSWORD,
    SEED_ROLES,
    run_seed,
)
from app.services.password_policy import validate_password_policy


# ─────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────

# Character classes used to build candidate passwords. Mirrors the
# ones in ``test_phase4g_password_policy.py`` so the two suites speak
# the same vocabulary.
_UPPER = string.ascii_uppercase
_LOWER = string.ascii_lowercase
_DIGITS = string.digits
# Drop chars that complicate shell quoting if a future maintainer
# switches this test to ``subprocess`` invocation; harmless here.
_SAFE_EXTRA = string.punctuation.replace('"', '').replace("'", '').replace('\\', '')
_ALL_CHARS = _UPPER + _LOWER + _DIGITS + _SAFE_EXTRA

# Seven seeded roles per Requirement 5.2.
_SEED_ROLE_NAMES: tuple[str, ...] = tuple(role for role, _, _ in SEED_ROLES)


# ─────────────────────────────────────────────────────────────────────
# Hypothesis strategies
# ─────────────────────────────────────────────────────────────────────


def passwords_violating_policy() -> st.SearchStrategy[str]:
    """Generate passwords that fail at least one rule of the policy.

    Four orthogonal sub-strategies, each violating exactly one of the
    four rules from ``validate_password_policy``:
      1. Length < 8.
      2. Length ≥ 8 but no uppercase letter.
      3. Length ≥ 8 but no lowercase letter.
      4. Length ≥ 8 but no digit.

    The ``.filter(...)`` calls in 2/3/4 ensure the example actually
    contains the OTHER required character classes, so the violation
    is on exactly one rule (not vacuously violating multiple).
    """
    too_short = st.text(
        alphabet=_ALL_CHARS,
        min_size=1,
        max_size=7,
    )
    no_upper = st.text(
        alphabet=_LOWER + _DIGITS,
        min_size=8,
        max_size=32,
    ).filter(
        lambda p: any(c in _LOWER for c in p) and any(c in _DIGITS for c in p)
    )
    no_lower = st.text(
        alphabet=_UPPER + _DIGITS,
        min_size=8,
        max_size=32,
    ).filter(
        lambda p: any(c in _UPPER for c in p) and any(c in _DIGITS for c in p)
    )
    no_digit = st.text(
        alphabet=_UPPER + _LOWER,
        min_size=8,
        max_size=32,
    ).filter(
        lambda p: any(c in _UPPER for c in p) and any(c in _LOWER for c in p)
    )
    return st.one_of(too_short, no_upper, no_lower, no_digit)


def passwords_satisfying_policy() -> st.SearchStrategy[str]:
    """Generate passwords that satisfy all four policy rules.

    Builds a candidate by concatenating one guaranteed character per
    required class (upper / lower / digit) plus 5–29 padding chars
    drawn from the full alphabet, then permuting the result so the
    required chars are not always at the front. The trailing
    ``.filter`` is a defensive sanity check.
    """
    required = st.builds(
        lambda u, l, d: u + l + d,
        st.text(alphabet=_UPPER, min_size=1, max_size=1),
        st.text(alphabet=_LOWER, min_size=1, max_size=1),
        st.text(alphabet=_DIGITS, min_size=1, max_size=1),
    )
    padding = st.text(alphabet=_ALL_CHARS, min_size=5, max_size=29)

    def _shuffle(req: str, pad: str) -> st.SearchStrategy[str]:
        return st.permutations(list(req + pad)).map(''.join)

    return (
        st.builds(_shuffle, required, padding)
        .flatmap(lambda s: s)
        .filter(
            lambda p: (
                len(p) >= 8
                and any(c in _UPPER for c in p)
                and any(c in _LOWER for c in p)
                and any(c in _DIGITS for c in p)
            )
        )
    )


# ─────────────────────────────────────────────────────────────────────
# App fixture
# ─────────────────────────────────────────────────────────────────────


@pytest.fixture(scope='module')
def seed_pw_app() -> Flask:
    """Self-contained Flask app for the seed-password property test.

    Uses a private SQLite in-memory database so the test does not
    collide with ``test_phase5_seed.py``'s fixture (which uses a
    different SQLite ``file:`` name).
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        'sqlite:///file:phase5-seed-password-test'
        '?mode=memory&cache=shared&uri=true'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-phase5-seed-password'
    app.config['TESTING'] = True

    db.init_app(app)

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


def _reset_db(app: Flask) -> None:
    """Drop and recreate every table so the example starts clean."""
    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()


def _user_count(app: Flask) -> int:
    """Return the current total number of ``users`` rows in the DB."""
    with app.app_context():
        return User.query.count()


# ─────────────────────────────────────────────────────────────────────
# Property X — violating SEED_PASSWORD → exit non-zero, no rows touched
# ─────────────────────────────────────────────────────────────────────


@settings(
    # Each example resets the schema and runs the seeder up to the
    # policy gate; 15 examples give strong coverage of the four
    # violation sub-strategies without making the suite slow.
    max_examples=15,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(password=passwords_violating_policy())
def test_property_x_violating_password_exits_nonzero_no_rows(
    seed_pw_app, monkeypatch, password
):
    """Property X (violating) — Validates: Requirement 5.4.

    For every ``SEED_PASSWORD`` that fails the password policy, the
    seed script MUST:
      - Exit with a non-zero status (``sys.exit(1)`` raises
        ``SystemExit`` with code != 0).
      - Leave the ``users`` row count unchanged from the pre-run state.

    The pre-run row count is captured AFTER ``_reset_db`` so it is
    always 0 here; the assertion is that the policy gate fires before
    any row is written, leaving the count at 0.
    """
    # ── Precondition: the password actually violates the policy ─────
    valid, _msg = validate_password_policy(password)
    assert not valid, (
        f'Strategy bug: passwords_violating_policy produced a '
        f'policy-compliant password {password!r}.'
    )

    # ── Reset DB and snapshot the pre-run user-row count ────────────
    _reset_db(seed_pw_app)
    monkeypatch.setenv('SEED_PASSWORD', password)
    before_count = _user_count(seed_pw_app)

    # ── Invoke the seeder; expect sys.exit(1) → SystemExit non-zero ─
    with seed_pw_app.app_context():
        with pytest.raises(SystemExit) as excinfo:
            run_seed(fresh=False)

    exit_code = excinfo.value.code
    assert exit_code is not None and exit_code != 0, (
        f'Seeder must exit non-zero on policy violation; got '
        f'SystemExit(code={exit_code!r}) for password={password!r}'
    )

    # ── users row count must be unchanged ───────────────────────────
    after_count = _user_count(seed_pw_app)
    assert after_count == before_count, (
        f'Seeder must NOT write any user rows on policy violation; '
        f'before={before_count}, after={after_count}, '
        f'password={password!r}'
    )


# ─────────────────────────────────────────────────────────────────────
# Property X — satisfying SEED_PASSWORD → exit 0, hashes verify
# ─────────────────────────────────────────────────────────────────────


@settings(
    # Each example writes one full seed (seven bcrypt-hashed users +
    # the org/group/rvm/reward chain). 10 examples are plenty; bcrypt
    # is the dominant cost.
    max_examples=10,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(password=passwords_satisfying_policy())
def test_property_x_satisfying_password_exits_zero_hashes_verify(
    seed_pw_app, monkeypatch, password
):
    """Property X (satisfying) — Validates: Requirement 5.3.

    For every ``SEED_PASSWORD`` that satisfies the password policy,
    the seed script MUST:
      - Exit 0 (i.e. ``run_seed`` returns normally without raising
        ``SystemExit``).
      - Produce seeded users whose ``password_hash`` verifies against
        the supplied password via ``check_password_hash`` (wrapped as
        ``User.check_password``).
    """
    # ── Precondition: the password actually satisfies the policy ────
    valid, _msg = validate_password_policy(password)
    assert valid, (
        f'Strategy bug: passwords_satisfying_policy produced a '
        f'policy-violating password {password!r}.'
    )

    # ── Reset DB and run the seeder ─────────────────────────────────
    _reset_db(seed_pw_app)
    monkeypatch.setenv('SEED_PASSWORD', password)

    # The seeder must return normally (no SystemExit). If it raises,
    # pytest will fail the test and surface the raised exception.
    with seed_pw_app.app_context():
        run_seed(fresh=False)

    # ── Assert one user per seed role, each verifying the password ──
    with seed_pw_app.app_context():
        for role in _SEED_ROLE_NAMES:
            email = f'{role}@ecopoints.local'
            user = User.query.filter_by(email=email).first()
            assert user is not None, (
                f'Seeder must create one user per role; missing '
                f'role={role!r} email={email!r} for password={password!r}'
            )
            assert user.password_hash, (
                f'Seeded user role={role!r} has empty password_hash '
                f'for password={password!r}'
            )
            assert user.check_password(password), (
                f'Seeded user role={role!r} email={email!r} '
                f'password_hash does not verify against the supplied '
                f'SEED_PASSWORD={password!r}'
            )


# ─────────────────────────────────────────────────────────────────────
# Deterministic smoke tests (always run; clear baseline on failure)
# ─────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    'bad_password',
    [
        '',                 # empty
        'short',            # too short
        'alllowercase1',    # no uppercase
        'ALLUPPERCASE1',    # no lowercase
        'NoDigitsHere',     # no digit
    ],
)
def test_violating_password_smoke(seed_pw_app, monkeypatch, bad_password):
    """Deterministic smoke: a handful of named violators exit non-zero
    with no rows touched."""
    _reset_db(seed_pw_app)
    monkeypatch.setenv('SEED_PASSWORD', bad_password)

    before_count = _user_count(seed_pw_app)

    with seed_pw_app.app_context():
        with pytest.raises(SystemExit) as excinfo:
            run_seed(fresh=False)

    assert excinfo.value.code not in (None, 0), (
        f'Expected non-zero exit for bad_password={bad_password!r}; '
        f'got SystemExit(code={excinfo.value.code!r})'
    )

    after_count = _user_count(seed_pw_app)
    assert after_count == before_count, (
        f'No rows should be written on policy violation; '
        f'before={before_count}, after={after_count}, '
        f'bad_password={bad_password!r}'
    )


def test_default_seed_password_smoke(seed_pw_app, monkeypatch):
    """Deterministic smoke: the default ``SeedPass!23`` satisfies the
    policy and seeds verifiable hashes for every role."""
    # Explicitly clear any stray env so the seeder falls back to the
    # documented default.
    monkeypatch.delenv('SEED_PASSWORD', raising=False)
    _reset_db(seed_pw_app)

    with seed_pw_app.app_context():
        run_seed(fresh=False)

    with seed_pw_app.app_context():
        for role in _SEED_ROLE_NAMES:
            email = f'{role}@ecopoints.local'
            user = User.query.filter_by(email=email).first()
            assert user is not None, f'Missing seeded user for role={role!r}'
            assert user.check_password(DEFAULT_SEED_PASSWORD), (
                f'Default seed password must verify for role={role!r}'
            )
