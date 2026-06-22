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


import pytest
from datetime import datetime, timezone, timedelta
import uuid as _uuid


@pytest.fixture(scope='session')
def app():
    """Session-scoped Flask app for property tests."""
    import os
    os.environ.setdefault('DATABASE_URL',
        'sqlite:///file:ecopoints-sweep-test?mode=memory&cache=shared&uri=true')
    os.environ.setdefault('SECRET_KEY', 'test-secret-key-do-not-use-in-prod')

    from flask import Flask
    from app import Config, db
    from app.controllers.settings_controller import settings_bp
    from app.controllers.logs_controller import logs_bp

    _app = Flask(__name__)
    _app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    _app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    _app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
    _app.config['TESTING'] = True

    db.init_app(_app)

    from flask import Blueprint
    web_bp = Blueprint('web_sweep', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(settings_bp)
    web_bp.register_blueprint(logs_bp)
    _app.register_blueprint(web_bp)

    with _app.app_context():
        db.create_all()

    yield _app

    with _app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def seed_org_with_stale_maintenance(app):
    """Seed an org with a stale (>1h) unresolved MaintenanceLog and
    a matching maintenance_unresolved NotificationSetting."""
    from app import db
    from app.models import (
        OrgType, Organization, CommunityGroup, User, RVM,
        MaintenanceLog, NotificationSetting,
    )

    with app.app_context():
        ot = OrgType(name=f'SweepUni-{_uuid.uuid4().hex[:6]}')
        db.session.add(ot)
        db.session.flush()

        org = Organization(
            name=f'SweepOrg-{_uuid.uuid4().hex[:6]}',
            full_name='Sweep Test Org',
            type_id=ot.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        grp = CommunityGroup(organization_id=org.id, name='SweepGrp', abbreviation='SWP')
        db.session.add(grp)
        db.session.flush()

        tech = User(
            community_group_id=grp.id,
            first_name='Sweep',
            last_name='Tech',
            email=f'sweep-{_uuid.uuid4().hex[:6]}@test.test',
            username=f'sweep_{_uuid.uuid4().hex[:6]}',
            password_hash='not-used',
            role='technician',
            is_active=True,
        )
        db.session.add(tech)
        db.session.flush()

        rvm = RVM(
            organization_id=org.id,
            machine_uuid=f'RVM-SWEEP-{_uuid.uuid4().hex[:8]}',
            name='Sweep RVM',
            location_name='Main Lobby',
            is_online=True,
        )
        db.session.add(rvm)
        db.session.flush()

        # NotificationSetting for maintenance_unresolved with 1-hour threshold
        ns = NotificationSetting(
            organization_id=org.id,
            alert_key='maintenance_unresolved',
            email_enabled=True,
            sms_enabled=False,
            threshold=1,
            recipients_json='["sweep@example.com"]',
            is_active=True,
        )
        db.session.add(ns)

        # Stale maintenance log — created 2 hours ago, still Pending
        stale_log = MaintenanceLog(
            rvm_id=rvm.id,
            performed_by_id=tech.id,
            action_type='Clogged Filter',
            status='Pending',
            notes='Test stale maintenance',
        )
        db.session.add(stale_log)
        db.session.flush()
        # Backdate to 2 hours ago
        stale_log.created_at = datetime.now(timezone.utc) - timedelta(hours=2)

        db.session.commit()
        yield org.id

        # Cleanup
        db.session.delete(stale_log)
        db.session.delete(ns)
        db.session.delete(rvm)
        db.session.delete(tech)
        db.session.delete(grp)
        db.session.delete(org)
        db.session.delete(ot)
        db.session.commit()
