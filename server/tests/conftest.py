"""
Shared pytest configuration for the EcoPoints server test suite.

This conftest sets a SQLite-in-memory `DATABASE_URL` and a deterministic
`SECRET_KEY` so that test modules importing `server.app` can build a Flask
app without needing the production Postgres connection. It runs before any
test module imports `app` so that `server/app/__init__.py`'s `Config` can
read the env vars at import time.
"""
import os
import sys
from pathlib import Path

# Ensure the `server/` directory is on `sys.path` so `import app` works
# regardless of where pytest is invoked from.
_HERE = Path(__file__).resolve().parent
_SERVER_ROOT = _HERE.parent
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

# A SQLite-in-memory URI keeps every test run hermetic. The shared
# `cache=shared` mode lets multiple connections inside one app share the
# same in-memory schema, which Flask-SQLAlchemy needs for nested sessions.
os.environ.setdefault(
    'DATABASE_URL',
    'sqlite:///file:ecopoints-test?mode=memory&cache=shared&uri=true',
)
os.environ.setdefault('SECRET_KEY', 'test-secret-key-do-not-use-in-prod')
os.environ.setdefault('JWT_EXPIRY_HOURS', '1')
os.environ.setdefault('COOKIE_SAMESITE', 'Strict')

# ── Phase 4B / Task 11.3: CSRF escape hatch for the test suite ────────────
#
# `@token_required` automatically enforces double-submit CSRF validation
# (header == cookie) on every POST/PUT/PATCH/DELETE in production. The
# existing test suite (e.g. `tests/unit/test_users_role_hierarchy.py`,
# `tests/property/test_audit_completeness.py`) authenticates with a
# `Authorization: Bearer <jwt>` header and does not set the `csrf_token`
# cookie or the `X-CSRF-Token` header. To keep those suites passing as-is
# we flip the documented escape hatch ON for tests by default. The CSRF
# unit tests in `tests/unit/test_csrf_required.py` flip it back OFF
# per-test via `monkeypatch.setenv` so they exercise the real check.
os.environ.setdefault('AUTH_CSRF_DISABLED', 'true')


# ── Pytest marker registration ────────────────────────────────────────────
#
# Tests under `tests/integration/` use `@pytest.mark.integration` so they
# can be filtered with `pytest -m integration` (or excluded with
# `pytest -m 'not integration'`). Register the marker here so pytest
# does not emit `PytestUnknownMarkWarning` on collection.

def pytest_configure(config):
    config.addinivalue_line(
        'markers',
        'integration: integration tests that may require external services '
        '(Postgres, nginx edge, etc.); skip by default unless prerequisites '
        'are available.',
    )
