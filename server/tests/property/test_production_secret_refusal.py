"""
Phase 21 / Property AA — Production secret refusal.

**Validates: Requirements 7.5**

Hypothesis-driven property tests for
``server/app/__init__.py::_check_required_secrets_in_production``
(Task 21.1). The helper enforces the universally-quantified invariant:

    for every required secret S, when ``FLASK_ENV == 'production'`` and
    S is missing OR set to a known development default,
    ``_check_required_secrets_in_production()`` MUST

      * call ``sys.exit(1)`` (raise ``SystemExit`` with ``code == 1``);
      * log S's NAME at CRITICAL level via the ``app`` logger; and
      * never log S's VALUE — nor the value of any other required
        secret currently set on the environment.

The required-secret set is the Phase 4A carve-out
``{SECRET_KEY, DATABASE_URL, RESEND_API_KEY, TWILIO_AUTH_TOKEN}``.
``qr_hmac_secret_ref`` will be reinstated once Phase 4A lands.

This module deliberately complements (does not replace) the example-
driven unit tests at ``server/tests/unit/test_startup_secret_check.py``;
the unit tests pin specific edge cases, the property tests fuzz over
random subsets / random values to exercise the helper across the
input space.

Test isolation
--------------
Hypothesis runs many examples per test-function call. The standard
``pytest.MonkeyPatch`` fixture is function-scoped, not example-scoped,
so each property body opens its own ``pytest.MonkeyPatch.context()``
inside the example. ``caplog`` is also function-scoped: every record
captured inside one example would otherwise leak into the next, so
each example calls ``caplog.clear()`` before exercising the helper.
The ``HealthCheck.function_scoped_fixture`` warning is suppressed
because we are using ``caplog`` deliberately and re-clearing it.
"""
from __future__ import annotations

import logging
import re

import pytest
from hypothesis import HealthCheck, assume, given, settings, strategies as st

# `app` is on sys.path via tests/conftest.py.
from app import (
    KNOWN_DEV_DEFAULTS,
    CRITICAL_PRODUCTION_SECRETS,
    OPTIONAL_PRODUCTION_SECRETS,
    _check_required_secrets_in_production,
)


# ─────────────────────────────────────────────────────────────────────
# Required-secret set assertions (non-property checks).
#
# These pin the rpi-carveout: the property bodies below assume the set
# is exactly four names, and `qr_hmac_secret_ref` is intentionally
# absent until Phase 4A lands.
# ─────────────────────────────────────────────────────────────────────

def test_required_set_matches_phase4a_carveout():
    """The critical + optional secret sets contain exactly the rpi-carveout four names."""
    assert set(CRITICAL_PRODUCTION_SECRETS) == {
        'SECRET_KEY',
        'DATABASE_URL',
    }
    assert set(OPTIONAL_PRODUCTION_SECRETS) == {
        'RESEND_API_KEY',
    }


def test_qr_hmac_secret_ref_not_in_required_set():
    """`qr_hmac_secret_ref` is reinstated once Phase 4A lands."""
    assert 'qr_hmac_secret_ref' not in CRITICAL_PRODUCTION_SECRETS
    assert 'qr_hmac_secret_ref' not in OPTIONAL_PRODUCTION_SECRETS
    assert 'QR_HMAC_SECRET_REF' not in CRITICAL_PRODUCTION_SECRETS
    assert 'QR_HMAC_SECRET_REF' not in OPTIONAL_PRODUCTION_SECRETS


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────


def _value_leaked(message: str, value: str) -> bool:
    """Token-shape heuristic for "the secret VALUE has been leaked".

    Mirrors the helper in
    ``server/tests/unit/test_startup_secret_check.py``. The log
    template contains generic English like ``"required secret"`` and
    ``"development default"``, so a naive substring check would
    false-positive on short dev-default tokens like ``'dev'`` or
    ``'secret'`` that overlap with English. Real leakage looks like
    ``=value``, ``"value"``, ``'value'``, ``: value`` — those are the
    shapes operators worry about (``key=value`` log lines and quoted
    secrets).

    For realistic generated values (8+ chars, mixed printable ASCII),
    a simple ``value not in message`` check is sufficient and is used
    in ``test_secret_value_never_logged`` below; this stricter heuristic
    is reserved for the dev-default test where short English-overlapping
    values can otherwise false-trip.

    Validates Requirement 7.5: variable NAME logged, VALUE not logged.
    """
    if not value:
        # Nothing to leak (missing or empty-string violations).
        return False
    quoted = (
        f"'{value}'",
        f'"{value}"',
        f"={value}",
        f": {value}",
        f"value={value}",
        f"value: {value}",
        f"value {value}",
        f"set to {value}",
        f"={value} ",
        f"={value}\"",
        f"{value}\n",
    )
    if any(q in message for q in quoted):
        return True
    return bool(re.search(rf"=\s*{re.escape(value)}\b", message))


# Hardcoded "real-looking" production values used as the clean baseline
# for every required secret. They are distinct from any value in
# ``KNOWN_DEV_DEFAULTS`` so the baseline never trips the check.
_CLEAN_PROD_ENV: dict[str, str] = {
    'SECRET_KEY': 'a-real-32-byte-production-secret-xyz',
    'DATABASE_URL': 'postgresql://user:pw@db.internal:5432/ecopoints',
    'RESEND_API_KEY': 're_real_production_api_key_deadbeef',
}

# Sanity at import time — ensures the baseline can never itself trip
# the check or leave a required secret unset.
_ALL_SECRETS = set(CRITICAL_PRODUCTION_SECRETS) | set(OPTIONAL_PRODUCTION_SECRETS)
assert set(_CLEAN_PROD_ENV) == _ALL_SECRETS, (
    '_CLEAN_PROD_ENV must cover every required secret; missing '
    f'{_ALL_SECRETS - set(_CLEAN_PROD_ENV)!r}'
)
for _name, _val in _CLEAN_PROD_ENV.items():
    assert _val not in KNOWN_DEV_DEFAULTS.get(_name, frozenset()), (
        f'Clean test value for {_name} collides with a dev default'
    )


def _apply_clean_prod_env(mp: pytest.MonkeyPatch) -> None:
    """Populate every required secret with its non-default baseline
    value plus ``FLASK_ENV='production'`` on the given MonkeyPatch.
    """
    mp.setenv('FLASK_ENV', 'production')
    for name, value in _CLEAN_PROD_ENV.items():
        mp.setenv(name, value)


# ─────────────────────────────────────────────────────────────────────
# Hypothesis strategies
# ─────────────────────────────────────────────────────────────────────


def critical_secret_names() -> st.SearchStrategy[str]:
    """Sample one critical-secret name."""
    return st.sampled_from(CRITICAL_PRODUCTION_SECRETS)


def optional_secret_names() -> st.SearchStrategy[str]:
    """Sample one optional-secret name."""
    return st.sampled_from(OPTIONAL_PRODUCTION_SECRETS)


def dev_default_values(name: str) -> st.SearchStrategy[str]:
    """Sample one dev-default value for the given secret name."""
    # `sorted()` keeps Hypothesis's shrinking deterministic across
    # interpreter runs (frozenset iteration order is undefined).
    return st.sampled_from(sorted(KNOWN_DEV_DEFAULTS[name]))


def realistic_secret_values() -> st.SearchStrategy[str]:
    """Generate visually-distinguishable realistic secret values.

    Constraints:
      * 8 to 80 characters (covers any plausible production secret
        length without making examples slow).
      * Printable ASCII (codepoints 33..126) — excludes whitespace
        (``space``, ``\\n``, ``\\r``) and ``\\x00``.
      * Excludes shell-special and quote characters (``"``, ``'``,
        ``\\``) so generated values are safe to round-trip through the
        environment and through log formatters.

    Generated values are exceedingly unlikely to collide with English
    log copy (``"production"``, ``"required"``, ``"secret"``, etc.),
    so a simple ``value not in record.getMessage()`` check is enough
    in ``test_secret_value_never_logged``.
    """
    return st.text(
        min_size=8,
        max_size=80,
        alphabet=st.characters(
            min_codepoint=33,
            max_codepoint=126,
            blacklist_characters="\"'\\\n\r\x00",
        ),
    )


# ─────────────────────────────────────────────────────────────────────
# Property 1 — Missing required secrets exit non-zero and log names.
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    missing=st.sets(
        st.sampled_from(CRITICAL_PRODUCTION_SECRETS),
        min_size=1,
        max_size=len(CRITICAL_PRODUCTION_SECRETS),
    ),
)
def test_missing_critical_secret_exits_and_logs_name(
    caplog: pytest.LogCaptureFixture,
    missing: set[str],
):
    """Property AA-1 — for every non-empty subset of critical secrets
    to remove, ``_check_required_secrets_in_production()`` must:

      * raise ``SystemExit(1)``;
      * log every removed variable's NAME in at least one CRITICAL
        log record.

    Validates Requirement 7.5.
    """
    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        _apply_clean_prod_env(mp)
        for name in missing:
            mp.delenv(name, raising=False)

        with caplog.at_level(logging.CRITICAL, logger='app'):
            with pytest.raises(SystemExit) as excinfo:
                _check_required_secrets_in_production()

    assert excinfo.value.code == 1, (
        f'Expected SystemExit(1) when missing {sorted(missing)!r}; '
        f'got SystemExit({excinfo.value.code!r})'
    )

    messages = [r.getMessage() for r in caplog.records]
    for name in missing:
        assert any(name in m for m in messages), (
            f'Expected variable name {name!r} in at least one CRITICAL '
            f'log record; got {messages!r}'
        )


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    missing=st.sets(
        st.sampled_from(OPTIONAL_PRODUCTION_SECRETS),
        min_size=1,
        max_size=len(OPTIONAL_PRODUCTION_SECRETS),
    ),
)
def test_missing_optional_secret_warns_only(
    caplog: pytest.LogCaptureFixture,
    missing: set[str],
):
    """Property AA-1.1 — for every non-empty subset of optional secrets
    to remove, ``_check_required_secrets_in_production()`` must:

      * return None (no SystemExit);
      * log every removed variable's NAME in at least one WARNING log record.
    """
    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        _apply_clean_prod_env(mp)
        for name in missing:
            mp.delenv(name, raising=False)

        with caplog.at_level(logging.WARNING, logger='app'):
            assert _check_required_secrets_in_production() is None

    messages = [r.getMessage() for r in caplog.records]
    for name in missing:
        assert any(name in m for m in messages), (
            f'Expected variable name {name!r} in at least one WARNING '
            f'log record; got {messages!r}'
        )


# ─────────────────────────────────────────────────────────────────────
# Property 2 — Dev-default values exit non-zero and log names.
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    secret_name=critical_secret_names(),
    data=st.data(),
)
def test_critical_dev_default_value_exits_and_logs_name(
    caplog: pytest.LogCaptureFixture,
    secret_name: str,
    data,
):
    """Property AA-2 — for every critical secret S and every value V
    sampled from ``KNOWN_DEV_DEFAULTS[S]``, setting S to V in a
    production env must:

      * raise ``SystemExit(1)``;
      * log S's NAME at CRITICAL level;
      * not leak V's VALUE into any log record (token-shape heuristic).
    """
    violating_value = data.draw(
        dev_default_values(secret_name),
        label='dev_default_value',
    )

    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        _apply_clean_prod_env(mp)
        mp.setenv(secret_name, violating_value)

        with caplog.at_level(logging.CRITICAL, logger='app'):
            with pytest.raises(SystemExit) as excinfo:
                _check_required_secrets_in_production()

    assert excinfo.value.code == 1, (
        f'Expected SystemExit(1) when {secret_name}={violating_value!r}; '
        f'got SystemExit({excinfo.value.code!r})'
    )

    messages = [r.getMessage() for r in caplog.records]
    assert any(secret_name in m for m in messages), (
        f'Expected variable name {secret_name!r} in at least one '
        f'CRITICAL log record; got {messages!r}'
    )

    for record in caplog.records:
        msg = record.getMessage()
        assert not _value_leaked(msg, violating_value), (
            f"Dev-default value {violating_value!r} for {secret_name} "
            f"leaked into log message: {msg!r}"
        )


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    secret_name=optional_secret_names(),
    data=st.data(),
)
def test_optional_dev_default_value_warns_only(
    caplog: pytest.LogCaptureFixture,
    secret_name: str,
    data,
):
    """Property AA-2.1 — for every optional secret S and every value V
    sampled from ``KNOWN_DEV_DEFAULTS[S]``, setting S to V in a
    production env must:

      * return None (no SystemExit);
      * log S's NAME at WARNING level;
      * not leak V's VALUE into any log record.
    """
    violating_value = data.draw(
        dev_default_values(secret_name),
        label='dev_default_value',
    )

    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        _apply_clean_prod_env(mp)
        mp.setenv(secret_name, violating_value)

        with caplog.at_level(logging.WARNING, logger='app'):
            assert _check_required_secrets_in_production() is None

    messages = [r.getMessage() for r in caplog.records]
    assert any(secret_name in m for m in messages), (
        f'Expected variable name {secret_name!r} in at least one '
        f'WARNING log record; got {messages!r}'
    )

    for record in caplog.records:
        msg = record.getMessage()
        assert not _value_leaked(msg, violating_value), (
            f"Dev-default value {violating_value!r} for {secret_name} "
            f"leaked into log message: {msg!r}"
        )


# ─────────────────────────────────────────────────────────────────────
# Property 3 — A still-present realistic value never appears in logs.
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    present_name=st.sampled_from(CRITICAL_PRODUCTION_SECRETS + OPTIONAL_PRODUCTION_SECRETS),
    present_value=realistic_secret_values(),
    other_name=st.sampled_from(CRITICAL_PRODUCTION_SECRETS),
    other_violation_kind=st.sampled_from(('missing', 'dev_default')),
    data=st.data(),
)
def test_secret_value_never_logged(
    caplog: pytest.LogCaptureFixture,
    present_name: str,
    present_value: str,
    other_name: str,
    other_violation_kind: str,
    data,
):
    """Property AA-3 — value-leak invariant.

    Set every required secret to its clean baseline, override
    ``present_name`` with a realistic generated value, and trigger the
    failure path by either unsetting OR dev-defaulting a different
    secret ``other_name``. The realistic ``present_value`` must NEVER
    appear in any captured CRITICAL log record.

    A simple ``value not in msg`` check is sufficient because realistic
    values are 8+ chars over a printable-ASCII alphabet excluding
    shell-special and whitespace characters; the probability of such a
    string appearing as a substring of the log template is negligible.

    Validates Requirement 7.5.
    """
    # The two secrets must be different so the realistic-value secret
    # is the one *still set on the env*, while another secret triggers
    # the failure path.
    assume(other_name != present_name)
    # Realistic values must not happen to coincide with a dev default
    # for ``present_name`` (otherwise the present secret itself trips
    # the check, breaking the test premise that only ``other_name`` is
    # the violation). With min_size=8 over a 94-char alphabet this is
    # vanishingly rare, but the assume() makes it impossible.
    assume(present_value not in KNOWN_DEV_DEFAULTS.get(present_name, frozenset()))
    # Realistic values must also be distinct from the clean baselines
    # of *other* secrets so the leakage check below has a unique target.
    assume(present_value not in _CLEAN_PROD_ENV.values())
    # Prevent substring collisions with English words in the log messages
    assume("product" not in present_value.lower())
    assume("secret" not in present_value.lower())
    assume("default" not in present_value.lower())
    assume("require" not in present_value.lower())
    assume("refus" not in present_value.lower())
    assume("database" not in present_value.lower())

    if other_violation_kind == 'dev_default':
        other_value = data.draw(
            dev_default_values(other_name),
            label='other_dev_default',
        )
    else:
        other_value = None  # 'missing'

    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        _apply_clean_prod_env(mp)
        mp.setenv(present_name, present_value)
        if other_violation_kind == 'missing':
            mp.delenv(other_name, raising=False)
        else:
            mp.setenv(other_name, other_value)

        with caplog.at_level(logging.CRITICAL, logger='app'):
            with pytest.raises(SystemExit) as excinfo:
                _check_required_secrets_in_production()

    assert excinfo.value.code == 1, (
        f'Expected SystemExit(1) for {other_name}/{other_violation_kind}; '
        f'got SystemExit({excinfo.value.code!r})'
    )

    # The headline assertion: a still-present realistic value is NEVER
    # written to the log stream — the ``%s`` log template only formats
    # the variable NAME.
    for record in caplog.records:
        msg = record.getMessage()
        assert present_value not in msg, (
            f'Realistic value for {present_name} (still-present secret) '
            f'leaked into log message: {msg!r}'
        )

    # The ``other_name`` violation must still be reported by name.
    messages = [r.getMessage() for r in caplog.records]
    assert any(other_name in m for m in messages), (
        f'Expected violating secret name {other_name!r} in at least one '
        f'CRITICAL log record; got {messages!r}'
    )


# ─────────────────────────────────────────────────────────────────────
# Property 4 — Clean production env passes (control / converse).
# ─────────────────────────────────────────────────────────────────────


def test_clean_production_env_passes(caplog: pytest.LogCaptureFixture):
    """Property AA-4 — control case.

    With ``FLASK_ENV='production'`` and every required secret set to a
    realistic non-default value, ``_check_required_secrets_in_production()``
    returns ``None`` without raising and emits no CRITICAL log records.

    This pins the converse direction of Property AA: a degenerate
    implementation that *always* raised would still satisfy the
    failure-path properties above; the control case rules that out.
    """
    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        _apply_clean_prod_env(mp)

        with caplog.at_level(logging.CRITICAL, logger='app'):
            assert _check_required_secrets_in_production() is None

    assert caplog.records == [], (
        'Expected no CRITICAL log records on a clean production env; '
        f'got: {[r.getMessage() for r in caplog.records]!r}'
    )


# Bonus negative control: outside production the helper is a no-op
# even when every required secret is missing.
@pytest.mark.parametrize(
    'flask_env', ['development', 'testing', 'staging', '', None],
)
def test_noop_outside_production(
    caplog: pytest.LogCaptureFixture, flask_env: str | None,
):
    """Outside ``FLASK_ENV == 'production'`` the helper returns
    silently even when EVERY required secret is missing. This pins the
    explicit guard at the top of
    ``_check_required_secrets_in_production``.
    """
    caplog.clear()
    with pytest.MonkeyPatch.context() as mp:
        if flask_env is None:
            mp.delenv('FLASK_ENV', raising=False)
        else:
            mp.setenv('FLASK_ENV', flask_env)
        for name in list(CRITICAL_PRODUCTION_SECRETS) + list(OPTIONAL_PRODUCTION_SECRETS):
            mp.delenv(name, raising=False)

        with caplog.at_level(logging.CRITICAL, logger='app'):
            assert _check_required_secrets_in_production() is None

    assert caplog.records == [], (
        f'Expected no CRITICAL log records when FLASK_ENV={flask_env!r}; '
        f'got: {[r.getMessage() for r in caplog.records]!r}'
    )
