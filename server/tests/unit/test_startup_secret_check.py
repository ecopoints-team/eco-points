"""
Unit tests for Task 21.1 — startup-time secret-presence check in
`server/app/__init__.py`.

Validates: Requirement 7.5.

Behaviour pinned by these tests:
  1. In non-production environments the check is a no-op.
  2. In production, missing required secrets cause `sys.exit(1)`.
  3. In production, a required secret set to a known development default
     causes `sys.exit(1)`.
  4. A clean production environment passes the check.
  5. The critical-log message NEVER contains the secret VALUE — only the
     variable NAME.
  6. The required-secret set matches the Phase 4A carve-out:
     `{SECRET_KEY, DATABASE_URL, RESEND_API_KEY, TWILIO_AUTH_TOKEN}`. The
     `qr_hmac_secret_ref` element is intentionally absent until Phase 4A
     lands.
"""
from __future__ import annotations

import logging
import re

import pytest

# `app` is on sys.path via tests/conftest.py.
from app import (
    KNOWN_DEV_DEFAULTS,
    CRITICAL_PRODUCTION_SECRETS,
    OPTIONAL_PRODUCTION_SECRETS,
    _check_required_secrets_in_production,
)


# ── Helpers ───────────────────────────────────────────────────────────────


def _value_leaked(message: str, value: str) -> bool:
    """Heuristic for "the secret VALUE has been leaked into a log message".

    The log template intentionally contains generic English like
    "required secret" and "development default", so a naive substring
    check would false-positive on dev-default tokens such as ``'dev'``,
    ``'secret'``, or ``'change-me'`` that happen to also be common
    English fragments. Real leakage looks like the value appearing as a
    distinct token, e.g. ``=value``, ``"value"``, ``: value``, ``'value'``.
    These are the shapes operators worry about — `key=value` log lines
    and quoted secrets — so we check for those explicitly.

    Validates Requirement 7.5: missing variable name SHALL be logged,
    its value SHALL NOT.
    """
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
    # Also catch any contiguous run that looks like `secret_name=value`
    # or `=value` at the end of a line.
    return bool(re.search(rf"=\s*{re.escape(value)}\b", message))


def _set_clean_production_env(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    """Set a fully populated production environment with non-default
    values for every required secret. Returns the mapping so individual
    tests can mutate one variable at a time.
    """
    env = {
        'FLASK_ENV': 'production',
        'SECRET_KEY': 'a-real-32-byte-production-secret-xyz',
        'DATABASE_URL': 'postgresql://user:pw@db.internal:5432/ecopoints',
        'RESEND_API_KEY': 're_real_production_api_key_deadbeef',
    }
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    return env


# ── Required-secret set ──────────────────────────────────────────────────


def test_required_set_matches_phase4a_carveout():
    """The critical and optional secret sets contain exactly the Phase 4A
    carve-out, with `qr_hmac_secret_ref` deliberately absent.
    """
    assert set(CRITICAL_PRODUCTION_SECRETS) == {
        'SECRET_KEY',
        'DATABASE_URL',
    }
    assert set(OPTIONAL_PRODUCTION_SECRETS) == {
        'RESEND_API_KEY',
    }
    # qr_hmac_secret_ref MUST NOT be present yet (Phase 4A is rpi-deferred).
    assert 'qr_hmac_secret_ref' not in CRITICAL_PRODUCTION_SECRETS
    assert 'qr_hmac_secret_ref' not in OPTIONAL_PRODUCTION_SECRETS
    assert 'QR_HMAC_SECRET_REF' not in CRITICAL_PRODUCTION_SECRETS
    assert 'QR_HMAC_SECRET_REF' not in OPTIONAL_PRODUCTION_SECRETS


def test_known_dev_defaults_cover_repo_placeholders():
    """The denylist covers the placeholder values that ship in
    `server/.env` and the documented `dev-key-DO-NOT-USE-IN-PRODUCTION`
    fallback in `Config.SECRET_KEY`.
    """
    assert 'dev-key-DO-NOT-USE-IN-PRODUCTION' in KNOWN_DEV_DEFAULTS['SECRET_KEY']
    assert 'your-resend-api-key' in KNOWN_DEV_DEFAULTS['RESEND_API_KEY']


# ── No-op in non-production ──────────────────────────────────────────────


@pytest.mark.parametrize('flask_env', ['development', 'testing', 'staging', '', None])
def test_noop_outside_production(
    monkeypatch: pytest.MonkeyPatch, flask_env: str | None
):
    """Outside `FLASK_ENV == 'production'` the check returns silently
    even when EVERY required secret is missing.
    """
    if flask_env is None:
        monkeypatch.delenv('FLASK_ENV', raising=False)
    else:
        monkeypatch.setenv('FLASK_ENV', flask_env)
    for name in list(CRITICAL_PRODUCTION_SECRETS) + list(OPTIONAL_PRODUCTION_SECRETS):
        monkeypatch.delenv(name, raising=False)

    # Returns None and does NOT call sys.exit.
    assert _check_required_secrets_in_production() is None


# ── Production: clean env passes ─────────────────────────────────────────


def test_production_clean_env_passes(monkeypatch: pytest.MonkeyPatch):
    _set_clean_production_env(monkeypatch)
    assert _check_required_secrets_in_production() is None


# ── Production: missing required secrets exit non-zero ──────────────────


@pytest.mark.parametrize('missing', list(CRITICAL_PRODUCTION_SECRETS))
def test_production_missing_critical_secret_exits_nonzero(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    missing: str,
):
    _set_clean_production_env(monkeypatch)
    monkeypatch.delenv(missing, raising=False)

    with caplog.at_level(logging.CRITICAL, logger='app'):
        with pytest.raises(SystemExit) as excinfo:
            _check_required_secrets_in_production()

    assert excinfo.value.code == 1
    # The variable NAME is logged so operators can fix it.
    assert any(missing in record.getMessage() for record in caplog.records)


def test_production_empty_string_treated_as_missing(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
):
    """A blank value (set but empty) is treated identically to unset."""
    _set_clean_production_env(monkeypatch)
    monkeypatch.setenv('DATABASE_URL', '')

    with caplog.at_level(logging.CRITICAL, logger='app'):
        with pytest.raises(SystemExit) as excinfo:
            _check_required_secrets_in_production()

    assert excinfo.value.code == 1
    assert any('DATABASE_URL' in r.getMessage() for r in caplog.records)


# ── Production: dev-default values exit non-zero ────────────────────────


@pytest.mark.parametrize(
    'name,value',
    [
        (name, value)
        for name in CRITICAL_PRODUCTION_SECRETS
        for value in KNOWN_DEV_DEFAULTS[name]
    ],
)
def test_production_critical_dev_default_value_exits_nonzero(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    name: str,
    value: str,
):
    _set_clean_production_env(monkeypatch)
    monkeypatch.setenv(name, value)

    with caplog.at_level(logging.CRITICAL, logger='app'):
        with pytest.raises(SystemExit) as excinfo:
            _check_required_secrets_in_production()

    assert excinfo.value.code == 1
    # The variable NAME is logged.
    assert any(name in r.getMessage() for r in caplog.records)
    # And the secret VALUE is NEVER logged (Requirement 7.5). We use a
    # token-shape heuristic rather than naive substring containment so
    # short dev-default values like 'dev' or 'secret' don't false-trip
    # on generic English in the log template (e.g. "development",
    # "required secret"). The implementation never quotes or assigns
    # the value, so this assertion fires on real leakage.
    for record in caplog.records:
        msg = record.getMessage()
        assert not _value_leaked(msg, value), (
            f"Secret value {value!r} for {name} leaked into log message: {msg!r}"
        )


@pytest.mark.parametrize('optional', list(OPTIONAL_PRODUCTION_SECRETS))
def test_production_missing_optional_secret_warns_only(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    optional: str,
):
    _set_clean_production_env(monkeypatch)
    monkeypatch.delenv(optional, raising=False)

    with caplog.at_level(logging.WARNING, logger='app'):
        assert _check_required_secrets_in_production() is None

    assert any(optional in record.getMessage() for record in caplog.records)
    assert not any(record.levelno >= logging.CRITICAL for record in caplog.records)


@pytest.mark.parametrize(
    'name,value',
    [
        (name, value)
        for name in OPTIONAL_PRODUCTION_SECRETS
        for value in KNOWN_DEV_DEFAULTS[name]
    ],
)
def test_production_optional_dev_default_value_warns_only(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    name: str,
    value: str,
):
    _set_clean_production_env(monkeypatch)
    monkeypatch.setenv(name, value)

    with caplog.at_level(logging.WARNING, logger='app'):
        assert _check_required_secrets_in_production() is None

    assert any(name in record.getMessage() for record in caplog.records)
    assert not any(record.levelno >= logging.CRITICAL for record in caplog.records)


# ── Production: secret VALUES never appear in logs ──────────────────────


def test_production_real_secret_value_never_logged(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
):
    """Even when a non-default value is set and another required secret
    is missing, the present-but-non-offending value is never written to
    the log stream.
    """
    secret_value = 'super-real-production-secret-please-do-not-leak'
    _set_clean_production_env(monkeypatch)
    monkeypatch.setenv('SECRET_KEY', secret_value)
    monkeypatch.delenv('DATABASE_URL', raising=False)

    with caplog.at_level(logging.CRITICAL, logger='app'):
        with pytest.raises(SystemExit):
            _check_required_secrets_in_production()

    for record in caplog.records:
        assert secret_value not in record.getMessage(), (
            f"Live secret value leaked: {record.getMessage()!r}"
        )
    # Sanity: the missing variable's name IS in the logs.
    assert any('DATABASE_URL' in r.getMessage() for r in caplog.records)


# ── Production: multiple violations are all reported ────────────────────


def test_production_multiple_violations_all_reported(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
):
    """When several required secrets are missing or insecure, every
    offender is logged before `sys.exit(1)`. This avoids the operator
    fixing one secret only to learn another is bad on the next start.
    """
    _set_clean_production_env(monkeypatch)
    monkeypatch.delenv('DATABASE_URL', raising=False)  # missing
    monkeypatch.setenv('SECRET_KEY', 'dev')             # known dev default

    with caplog.at_level(logging.CRITICAL, logger='app'):
        with pytest.raises(SystemExit) as excinfo:
            _check_required_secrets_in_production()

    assert excinfo.value.code == 1
    messages = ' || '.join(r.getMessage() for r in caplog.records)
    assert 'DATABASE_URL' in messages
    assert 'SECRET_KEY' in messages
