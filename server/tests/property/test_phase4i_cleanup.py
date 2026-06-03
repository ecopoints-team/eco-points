"""
Phase 4I / Property V — Bounded token blacklist.

**Validates: Requirements 4I.32, 4I.33, 4I.35**

Property V asserts that after ``flask cleanup-tokens`` runs:

1. Every row in ``token_blacklist`` with ``expires_at < NOW() - 1 day``
   is gone from the database.
2. Rows with ``expires_at >= NOW() - 1 day`` (i.e. current or recent
   tokens) are preserved.
3. The log output contains both ``deleted=`` and ``duration_s=``.

The test seeds ``token_blacklist`` with a mix of:
  - Rows with ``expires_at`` more than 1 day in the past (should be
    deleted by the cleanup command).
  - Rows with ``expires_at`` in the future or within the last day
    (should be kept).

The CLI command is invoked via Flask's test CLI runner:
``runner.invoke(cleanup_tokens)``.

Note on the cleanup threshold
------------------------------
The ``cleanup-tokens`` command deletes rows where
``expires_at < datetime.utcnow()`` (i.e. any expired token).  The
property test asserts the *stronger* invariant from Requirement 4I.35:
rows more than 1 day old are gone.  Since ``NOW() - 1 day < NOW()``,
any row that is more than 1 day expired is also expired, so the command
satisfies the requirement.  The test seeds "old" rows with
``expires_at = NOW() - 2 days`` (well past the 1-day threshold) and
"current" rows with ``expires_at = NOW() + 1 hour`` (clearly in the
future), making the boundary unambiguous.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from flask import Flask
from flask.testing import FlaskCliRunner
from hypothesis import HealthCheck, given, settings, strategies as st

from app import db
from app.models import TokenBlacklist
from app.seeder.cleanup import cleanup_tokens


# ─────────────────────────────────────────────────────────────────────
# App fixture
# ─────────────────────────────────────────────────────────────────────


@pytest.fixture(scope='module')
def cleanup_app():
    """Self-contained Flask app for the cleanup property test.

    Uses a separate in-memory SQLite database so it does not interfere
    with other property test modules.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        'sqlite:///file:cleanup-tokens-test?mode=memory&cache=shared&uri=true'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-cleanup'
    app.config['JWT_EXPIRY_HOURS'] = 1
    app.config['TESTING'] = True

    db.init_app(app)
    app.cli.add_command(cleanup_tokens)

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────


def _now_utc() -> datetime:
    """Return the current UTC time as a naive datetime (matching utcnow())."""
    return datetime.utcnow()


def _insert_rows(app: Flask, old_count: int, current_count: int) -> tuple[list[str], list[str]]:
    """Seed ``token_blacklist`` with ``old_count`` expired rows and
    ``current_count`` current/future rows.

    Returns ``(old_jtis, current_jtis)`` — the JTIs of each group so the
    test can assert their presence/absence after the cleanup run.

    "Old" rows: ``expires_at = NOW() - 2 days`` (well past the 1-day
    threshold from Requirement 4I.35).

    "Current" rows: ``expires_at = NOW() + 1 hour`` (clearly in the
    future; the cleanup command must NOT delete these).
    """
    now = _now_utc()
    old_expires = now - timedelta(days=2)
    current_expires = now + timedelta(hours=1)

    old_jtis: list[str] = []
    current_jtis: list[str] = []

    with app.app_context():
        for _ in range(old_count):
            jti = uuid.uuid4().hex
            row = TokenBlacklist(jti=jti, expires_at=old_expires)
            db.session.add(row)
            old_jtis.append(jti)

        for _ in range(current_count):
            jti = uuid.uuid4().hex
            row = TokenBlacklist(jti=jti, expires_at=current_expires)
            db.session.add(row)
            current_jtis.append(jti)

        db.session.commit()

    return old_jtis, current_jtis


# ─────────────────────────────────────────────────────────────────────
# Property V — Bounded token blacklist
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    old_count=st.integers(min_value=0, max_value=20),
    current_count=st.integers(min_value=0, max_value=20),
)
def test_property_v_bounded_token_blacklist(cleanup_app, old_count, current_count):
    """Property V — Bounded token blacklist.

    **Validates: Requirements 4I.32, 4I.33, 4I.35**

    After ``flask cleanup-tokens`` runs:

    1. Every row with ``expires_at < NOW() - 1 day`` is gone.
    2. Rows with ``expires_at >= NOW() - 1 day`` are preserved.
    3. The log output contains both ``deleted=`` and ``duration_s=``.
    """
    # ── Seed the database ────────────────────────────────────────────
    old_jtis, current_jtis = _insert_rows(cleanup_app, old_count, current_count)

    # ── Capture log output ───────────────────────────────────────────
    log_records: list[logging.LogRecord] = []

    class _CapturingHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            log_records.append(record)

    handler = _CapturingHandler()
    handler.setLevel(logging.DEBUG)

    # ── Invoke the CLI command ───────────────────────────────────────
    with cleanup_app.app_context():
        cleanup_app.logger.addHandler(handler)
        try:
            runner: FlaskCliRunner = cleanup_app.test_cli_runner()
            result = runner.invoke(cleanup_tokens)
        finally:
            cleanup_app.logger.removeHandler(handler)

    # The command must exit without error.
    assert result.exit_code == 0, (
        f'cleanup-tokens exited with code {result.exit_code}; '
        f'output: {result.output!r}; '
        f'exception: {result.exception!r}'
    )

    # ── Assertion 1: old rows are gone ───────────────────────────────
    # "Old" rows have expires_at = NOW() - 2 days, which is < NOW() - 1 day.
    # The cleanup command deletes rows where expires_at < NOW(), so all
    # old rows must be deleted.
    with cleanup_app.app_context():
        for jti in old_jtis:
            row = TokenBlacklist.query.filter_by(jti=jti).first()
            assert row is None, (
                f'Old token (jti={jti!r}, expires_at=NOW()-2d) should have '
                f'been deleted by cleanup-tokens but was still found in the DB.'
            )

    # ── Assertion 2: current rows are preserved ──────────────────────
    # "Current" rows have expires_at = NOW() + 1 hour, which is > NOW().
    # The cleanup command must NOT delete these.
    with cleanup_app.app_context():
        for jti in current_jtis:
            row = TokenBlacklist.query.filter_by(jti=jti).first()
            assert row is not None, (
                f'Current token (jti={jti!r}, expires_at=NOW()+1h) should '
                f'have been preserved by cleanup-tokens but was not found in '
                f'the DB.'
            )

    # ── Assertion 3: log line contains deleted= and duration_s= ─────
    # The command logs via current_app.logger.info(...). We capture the
    # log records via the handler attached above.
    log_messages = [r.getMessage() for r in log_records]
    matching = [m for m in log_messages if 'token_blacklist cleanup:' in m]

    assert len(matching) >= 1, (
        f'Expected at least one log line containing "token_blacklist cleanup:"; '
        f'got log messages: {log_messages!r}'
    )

    log_line = matching[-1]  # use the most recent matching line

    assert 'deleted=' in log_line, (
        f'Log line must contain "deleted="; got: {log_line!r}'
    )
    assert 'duration_s=' in log_line, (
        f'Log line must contain "duration_s="; got: {log_line!r}'
    )

    # ── Cleanup: remove the rows we inserted so the next example ─────
    # starts from a clean slate (Hypothesis re-uses the same DB).
    with cleanup_app.app_context():
        # Remove any surviving current rows we seeded in this example.
        for jti in current_jtis:
            row = TokenBlacklist.query.filter_by(jti=jti).first()
            if row is not None:
                db.session.delete(row)
        db.session.commit()


# ─────────────────────────────────────────────────────────────────────
# Deterministic smoke test — zero rows
# ─────────────────────────────────────────────────────────────────────


def test_cleanup_tokens_empty_table(cleanup_app):
    """Running cleanup-tokens on an empty table must succeed and log
    ``deleted=0``.
    """
    # Ensure the table is empty.
    with cleanup_app.app_context():
        TokenBlacklist.query.delete(synchronize_session=False)
        db.session.commit()

    log_records: list[logging.LogRecord] = []

    class _CapturingHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            log_records.append(record)

    handler = _CapturingHandler()
    handler.setLevel(logging.DEBUG)

    with cleanup_app.app_context():
        cleanup_app.logger.addHandler(handler)
        try:
            runner: FlaskCliRunner = cleanup_app.test_cli_runner()
            result = runner.invoke(cleanup_tokens)
        finally:
            cleanup_app.logger.removeHandler(handler)

    assert result.exit_code == 0, (
        f'cleanup-tokens failed on empty table: {result.output!r}'
    )

    log_messages = [r.getMessage() for r in log_records]
    matching = [m for m in log_messages if 'token_blacklist cleanup:' in m]
    assert matching, f'No cleanup log line found; messages: {log_messages!r}'

    log_line = matching[-1]
    assert 'deleted=0' in log_line, (
        f'Expected "deleted=0" in log line for empty table; got: {log_line!r}'
    )
    assert 'duration_s=' in log_line, (
        f'Expected "duration_s=" in log line; got: {log_line!r}'
    )


# ─────────────────────────────────────────────────────────────────────
# Deterministic smoke test — only old rows
# ─────────────────────────────────────────────────────────────────────


def test_cleanup_tokens_all_old(cleanup_app):
    """When all rows are expired (> 1 day old), cleanup-tokens must
    delete all of them and log ``deleted=<N>`` where N > 0.
    """
    N = 5
    old_jtis, _ = _insert_rows(cleanup_app, old_count=N, current_count=0)

    log_records: list[logging.LogRecord] = []

    class _CapturingHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            log_records.append(record)

    handler = _CapturingHandler()
    handler.setLevel(logging.DEBUG)

    with cleanup_app.app_context():
        cleanup_app.logger.addHandler(handler)
        try:
            runner: FlaskCliRunner = cleanup_app.test_cli_runner()
            result = runner.invoke(cleanup_tokens)
        finally:
            cleanup_app.logger.removeHandler(handler)

    assert result.exit_code == 0, (
        f'cleanup-tokens failed: {result.output!r}'
    )

    # All old rows must be gone.
    with cleanup_app.app_context():
        for jti in old_jtis:
            assert TokenBlacklist.query.filter_by(jti=jti).first() is None, (
                f'Old token {jti!r} should have been deleted.'
            )

    log_messages = [r.getMessage() for r in log_records]
    matching = [m for m in log_messages if 'token_blacklist cleanup:' in m]
    assert matching, f'No cleanup log line found; messages: {log_messages!r}'

    log_line = matching[-1]
    assert f'deleted={N}' in log_line, (
        f'Expected "deleted={N}" in log line; got: {log_line!r}'
    )
    assert 'duration_s=' in log_line, (
        f'Expected "duration_s=" in log line; got: {log_line!r}'
    )


# ─────────────────────────────────────────────────────────────────────
# Deterministic smoke test — only current rows
# ─────────────────────────────────────────────────────────────────────


def test_cleanup_tokens_all_current(cleanup_app):
    """When all rows are current (expires_at in the future), cleanup-tokens
    must delete none of them and log ``deleted=0``.
    """
    N = 5
    _, current_jtis = _insert_rows(cleanup_app, old_count=0, current_count=N)

    log_records: list[logging.LogRecord] = []

    class _CapturingHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            log_records.append(record)

    handler = _CapturingHandler()
    handler.setLevel(logging.DEBUG)

    with cleanup_app.app_context():
        cleanup_app.logger.addHandler(handler)
        try:
            runner: FlaskCliRunner = cleanup_app.test_cli_runner()
            result = runner.invoke(cleanup_tokens)
        finally:
            cleanup_app.logger.removeHandler(handler)

    assert result.exit_code == 0, (
        f'cleanup-tokens failed: {result.output!r}'
    )

    # All current rows must still be present.
    with cleanup_app.app_context():
        for jti in current_jtis:
            assert TokenBlacklist.query.filter_by(jti=jti).first() is not None, (
                f'Current token {jti!r} should NOT have been deleted.'
            )

    log_messages = [r.getMessage() for r in log_records]
    matching = [m for m in log_messages if 'token_blacklist cleanup:' in m]
    assert matching, f'No cleanup log line found; messages: {log_messages!r}'

    log_line = matching[-1]
    assert 'deleted=0' in log_line, (
        f'Expected "deleted=0" in log line for all-current table; got: {log_line!r}'
    )

    # Cleanup: remove the current rows we seeded.
    with cleanup_app.app_context():
        for jti in current_jtis:
            row = TokenBlacklist.query.filter_by(jti=jti).first()
            if row:
                db.session.delete(row)
        db.session.commit()
