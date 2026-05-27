"""
Integration test — Phase 4C / Task 21.5 (Property BB): Migration reversibility.

Validates: Requirements 7.8, 7.11.

Cross-phase property — for every Flask-Migrate revision introduced by
phases 0..5, applying ``flask db upgrade`` followed by
``flask db downgrade -1`` against a Postgres instance MUST leave the
schema byte-identical (column lists, constraints, indexes) to the
pre-upgrade state.

Scope
-----
Both ``phase4c_force_logout`` and ``rpi_auth`` are exercised.

Database choice
---------------
The spec mandates Postgres ("Supabase staging or local CI Postgres") —
SQLite would give a false sense of safety because Alembic ``op.drop_column``
and other DDL operate differently on SQLite (batch-rebuild) vs Postgres
(native ALTER). This test therefore:

* Reads ``TEST_DATABASE_URL`` (NOT ``DATABASE_URL`` — we do not want to
  clobber the production/dev connection from ``server/.env``).
* Skips with a clear message when ``TEST_DATABASE_URL`` is unset OR
  when it is not a Postgres URL.
* Connects, takes ownership of the ``public`` schema, runs the
  round-trip, then drops + recreates ``public`` to leave the test DB
  pristine.

How to run locally
------------------
::

    # Local Postgres (Docker, brew, etc.)
    set TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ecopoints_test
    pytest server/tests/integration/test_migration_reversibility.py -v

    # Supabase staging branch
    set TEST_DATABASE_URL=postgresql+psycopg://postgres.<branch>:<pw>@<host>:6543/postgres?sslmode=require
    pytest server/tests/integration/test_migration_reversibility.py -v

When ``TEST_DATABASE_URL`` is unset (the normal local dev case), every
test in this module is ``pytest.skip``-ped cleanly so it does not break
the broader suite.

Implementation notes
--------------------
The repository's ``server/migrations/env.py`` is a Flask-Migrate-flavoured
env that reads ``current_app.extensions['migrate'].db.get_engine()`` at
module import time. That means we cannot drive Alembic with a bare
``alembic.command.upgrade`` call — we need an active Flask app context
that has Flask-Migrate initialized against the test DB. We therefore
spin up the real Flask app via ``create_app()`` with ``DATABASE_URL``
temporarily overridden to ``TEST_DATABASE_URL``, then call
``flask_migrate.upgrade``/``flask_migrate.downgrade`` from inside
``app.app_context()``.
"""
from __future__ import annotations

import os
import pprint
from typing import Any, Iterator

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.exc import OperationalError, SQLAlchemyError


# ─── Configuration ─────────────────────────────────────────────────────────

# Per task 21.5, both revisions are exercised. Phase 4A was activated
# on 2026-05-27 when rpi_auth.py shipped.
REVISIONS_UNDER_TEST = [
    pytest.param('phase4c_force_logout', id='phase4c_force_logout'),
    pytest.param('rpi_auth', id='rpi_auth'),
]

TEST_DATABASE_URL_ENV_VAR = 'TEST_DATABASE_URL'


# ─── Skip plumbing ─────────────────────────────────────────────────────────


def _resolve_test_database_url() -> str | None:
    """Return the Postgres test DB URL, or ``None`` if no usable URL is
    configured. Accepts only Postgres URLs — SQLite would defeat the
    point of the test (see module docstring).

    Per task 21.5 step 9, both ``postgresql://`` and the legacy
    ``postgres://`` prefixes (heroku/render-style) are accepted, plus
    any of the SQLAlchemy driver flavours
    (``postgresql+psycopg``, ``postgresql+psycopg2``,
    ``postgresql+asyncpg``).
    """
    url_str = os.environ.get(TEST_DATABASE_URL_ENV_VAR, '').strip()
    if not url_str:
        return None
    # Cheap prefix gate first: this also accepts ``postgres://`` which
    # SA reports as backend ``'postgres'`` (legacy alias) so we can't
    # rely solely on ``get_backend_name()`` below.
    if not (url_str.startswith('postgresql://')
            or url_str.startswith('postgresql+')
            or url_str.startswith('postgres://')):
        return None
    try:
        url = make_url(url_str)
    except Exception:
        return None
    backend = url.get_backend_name()
    if backend not in ('postgresql', 'postgres'):
        return None
    # Normalise the legacy ``postgres://`` prefix to ``postgresql://``
    # because some SA dialects refuse to load plugin ``postgres``.
    if url_str.startswith('postgres://'):
        url_str = 'postgresql://' + url_str[len('postgres://'):]
    return url_str


_TEST_DB_URL = _resolve_test_database_url()

pytestmark = pytest.mark.skipif(
    _TEST_DB_URL is None,
    reason=(
        f'Postgres test DB not available; set {TEST_DATABASE_URL_ENV_VAR} to '
        'a Postgres URL (e.g. postgresql+psycopg://user:pw@host:5432/db) '
        'to enable migration-reversibility checks. SQLite is not accepted '
        'because Alembic DDL on SQLite uses batch-rebuild and would not '
        'exercise the same code paths as Postgres.'
    ),
)


# ─── Schema snapshot helper ────────────────────────────────────────────────


def _normalise_default(value: Any) -> str | None:
    """Normalise a column server-default for cross-revision comparison.

    ``Inspector.get_columns`` returns dialect-specific representations
    (e.g. ``"nextval('x_id_seq'::regclass)"``). For round-trip equality
    we strip trailing whitespace and casts that come from the dialect.
    Treat ``None`` as ``None``.
    """
    if value is None:
        return None
    s = str(value).strip()
    return s


def _normalise_type(col_type: Any) -> str:
    """Cast a SQLAlchemy column type to a deterministic string.

    ``repr()`` would include a Python object id and break comparisons.
    ``str()`` round-trips the SQL DDL fragment, which is what Postgres
    introspection reports back.
    """
    return str(col_type).strip().upper()


def snapshot_schema(engine: Engine) -> dict:
    """Return a deterministic, comparable dictionary describing the
    full schema reachable through ``Inspector(engine)``.

    The dict is order-independent: every list is sorted by the natural
    key for the kind of object (column ordinal for columns, name for
    indexes/constraints) so equality comparison is structural and the
    pytest dict-diff is human-readable.

    The ``alembic_version`` table is included so the test fails if
    Alembic's bookkeeping row didn't transition correctly.
    """
    inspector = inspect(engine)

    snapshot: dict[str, dict] = {}

    table_names = sorted(inspector.get_table_names())
    for table in table_names:
        cols = inspector.get_columns(table)
        # Columns: keep server ordinal because reordering them would
        # change DDL semantically; sort by "ordinal" via the inspector
        # output (which is already in column-position order).
        column_entries = [
            (
                col['name'],
                _normalise_type(col['type']),
                bool(col.get('nullable', True)),
                _normalise_default(col.get('default')),
            )
            for col in cols
        ]

        # Indexes — sort by name so order-of-creation doesn't matter.
        idx_entries = sorted(
            (
                (
                    idx['name'],
                    tuple(idx.get('column_names') or ()),
                    bool(idx.get('unique', False)),
                )
                for idx in inspector.get_indexes(table)
            ),
            key=lambda t: (t[0] or '', t[1]),
        )

        # Primary key columns — preserve declaration order.
        pk = inspector.get_pk_constraint(table) or {}
        pk_columns = tuple(pk.get('constrained_columns') or ())

        # Foreign keys — sort by (name, columns).
        fk_entries = sorted(
            (
                (
                    fk.get('name'),
                    tuple(fk.get('constrained_columns') or ()),
                    fk.get('referred_table'),
                    tuple(fk.get('referred_columns') or ()),
                )
                for fk in inspector.get_foreign_keys(table)
            ),
            key=lambda t: (t[0] or '', t[1]),
        )

        # Unique constraints — sort by name.
        uc_entries = sorted(
            (
                (uc.get('name'), tuple(uc.get('column_names') or ()))
                for uc in inspector.get_unique_constraints(table)
            ),
            key=lambda t: (t[0] or '', t[1]),
        )

        # Check constraints — sort by name. Postgres reports the
        # ``sqltext`` body which we keep verbatim; SQLite would not
        # reach this code path.
        cc_entries = sorted(
            (
                (cc.get('name'), str(cc.get('sqltext') or '').strip())
                for cc in inspector.get_check_constraints(table)
            ),
            key=lambda t: (t[0] or '', t[1]),
        )

        snapshot[table] = {
            'columns': column_entries,
            'indexes': idx_entries,
            'primary_key': pk_columns,
            'foreign_keys': fk_entries,
            'unique_constraints': uc_entries,
            'check_constraints': cc_entries,
        }

    return snapshot


def _format_schema_diff(before: dict, after: dict) -> str:
    """Build a human-readable diff between two schema snapshots for use
    in pytest assertion messages. Only the tables that differ are
    included in the output, keeping the failure message focused.
    """
    differing_tables = sorted(set(before) | set(after))
    lines: list[str] = []
    for tbl in differing_tables:
        b = before.get(tbl, '<<missing>>')
        a = after.get(tbl, '<<missing>>')
        if b == a:
            continue
        lines.append(f'--- table: {tbl} ---')
        lines.append(f'before:  {pprint.pformat(b)}')
        lines.append(f'after:   {pprint.pformat(a)}')
    return '\n'.join(lines) if lines else '(no per-table differences)'


# ─── Flask app + Flask-Migrate orchestration ───────────────────────────────


def _previous_revision(revision: str, migrations_dir: str) -> str | None:
    """Look up the ``down_revision`` of a given revision id by reading
    the migration script directly via Alembic's ``ScriptDirectory``.
    Returns ``None`` for the base.

    We do NOT need a Flask app context for this lookup — ``ScriptDirectory``
    parses the migration files standalone.
    """
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    cfg = Config()
    cfg.set_main_option('script_location', migrations_dir)
    script = ScriptDirectory.from_config(cfg)
    rev = script.get_revision(revision)
    if rev is None:
        raise LookupError(f'Unknown alembic revision: {revision!r}')
    down = rev.down_revision
    if isinstance(down, tuple):
        # We do not use branched migrations in this project, but be
        # defensive: pick the first parent.
        return down[0] if down else None
    return down


def _migrations_dir() -> str:
    """Return the absolute path to ``server/migrations``."""
    here = os.path.dirname(os.path.abspath(__file__))
    server_root = os.path.dirname(os.path.dirname(here))
    return os.path.join(server_root, 'migrations')


def _build_test_app(database_url: str):
    """Create a Flask app whose Flask-Migrate is bound to ``database_url``.

    ``Config.SQLALCHEMY_DATABASE_URI`` reads ``DATABASE_URL`` from the
    environment at class definition time, so we override the env var
    and force-set ``app.config['SQLALCHEMY_DATABASE_URI']`` after
    ``create_app()`` returns. Belt-and-braces.
    """
    # Override env so that ``Config`` and any downstream consumer uses
    # the test DB URL. We restore the original below.
    original_db_url = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = database_url
    try:
        from app import create_app, db as _db  # noqa: F401 — used by callers via app context
        app = create_app()
    finally:
        # Restore the original DATABASE_URL so other tests / fixtures
        # that import ``app`` later do not see the test DB.
        if original_db_url is None:
            os.environ.pop('DATABASE_URL', None)
        else:
            os.environ['DATABASE_URL'] = original_db_url

    # Belt-and-braces: also set the live config in case something inside
    # the app's create_app rebuilt the engine from the original env value.
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url

    return app


def _flask_migrate_upgrade(app, revision: str) -> None:
    """Run ``flask db upgrade <revision>`` using Flask-Migrate's
    in-process API. ``upgrade`` reads ``current_app`` so it MUST be
    called inside an app context.
    """
    from flask_migrate import upgrade as fm_upgrade

    with app.app_context():
        fm_upgrade(directory=_migrations_dir(), revision=revision)


def _flask_migrate_downgrade(app, revision: str) -> None:
    """Run ``flask db downgrade <revision>`` using Flask-Migrate's
    in-process API. ``revision`` is the Alembic revision string —
    ``'-1'`` means "one step back".
    """
    from flask_migrate import downgrade as fm_downgrade

    with app.app_context():
        fm_downgrade(directory=_migrations_dir(), revision=revision)


# ─── Engine / fixture ──────────────────────────────────────────────────────


def _reset_public_schema(engine: Engine) -> None:
    """Drop and recreate the ``public`` schema so the test starts from
    an empty database. Postgres-only.
    """
    with engine.begin() as conn:
        conn.execute(text('DROP SCHEMA IF EXISTS public CASCADE'))
        conn.execute(text('CREATE SCHEMA public'))


@pytest.fixture(scope='function')
def postgres_engine() -> Iterator[Engine]:
    """Function-scoped engine bound to ``TEST_DATABASE_URL``. Each test
    starts with a freshly-recreated ``public`` schema so revisions
    apply against a known-good empty database, and tears down by
    dropping the schema again. Connection is checked at fixture
    construction time so setup failures surface as ``pytest.skip``
    rather than a downstream ``OperationalError``.
    """
    assert _TEST_DB_URL is not None  # pytest.mark.skipif guarantees this
    try:
        engine = create_engine(_TEST_DB_URL, future=True)
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
    except ModuleNotFoundError as exc:
        # Triggered when the chosen Postgres driver (``psycopg2`` /
        # ``psycopg``) is not installed in the current venv. This is a
        # configuration issue rather than a test failure: skip with a
        # clear, actionable message.
        pytest.skip(
            f'Postgres driver not installed: {exc}. '
            f'Install one of `psycopg2-binary` or `psycopg[binary]`, '
            f'or use a SQLAlchemy URL prefixed with the driver you '
            f'actually have (e.g. `postgresql+psycopg://...`).'
        )
    except (OperationalError, SQLAlchemyError) as exc:
        pytest.skip(
            f'Could not connect to Postgres test DB at '
            f'{TEST_DATABASE_URL_ENV_VAR}: {type(exc).__name__}: {exc}'
        )

    _reset_public_schema(engine)
    try:
        yield engine
    finally:
        try:
            _reset_public_schema(engine)
        finally:
            engine.dispose()


# ─── The Property BB test ──────────────────────────────────────────────────


@pytest.mark.integration
@pytest.mark.parametrize('revision_id', REVISIONS_UNDER_TEST)
def test_migration_round_trip(revision_id: str, postgres_engine: Engine) -> None:
    """Property BB — for the given revision R, the schema state after
    ``upgrade(R)`` followed by ``downgrade(-1)`` MUST be byte-identical
    to the schema state immediately before ``upgrade(R)``.

    Validates: Requirements 7.8, 7.11.
    """
    database_url = _TEST_DB_URL
    assert database_url is not None  # pytest.mark.skipif guarantees this

    migrations_dir = _migrations_dir()
    previous = _previous_revision(revision_id, migrations_dir)

    # Build a Flask app bound to the test DB. Flask-Migrate's
    # ``upgrade``/``downgrade`` wrappers read ``current_app.extensions``
    # so every call must run inside this app's app context.
    app = _build_test_app(database_url)

    # 1. Position the schema at the revision IMMEDIATELY BEFORE R. If
    # R has no parent (i.e. it's the base revision), upgrade to base
    # is a no-op and the snapshot is empty.
    if previous is not None:
        _flask_migrate_upgrade(app, previous)

    # Force a fresh inspector view by disposing any cached metadata.
    postgres_engine.dispose()

    before_upgrade = snapshot_schema(postgres_engine)

    # 2. Upgrade to R.
    _flask_migrate_upgrade(app, revision_id)
    postgres_engine.dispose()
    after_upgrade = snapshot_schema(postgres_engine)

    # Sanity: the upgrade actually changed *something*. If this is the
    # base revision (``previous is None``), an empty pre-state is
    # acceptable — ``after_upgrade`` will obviously differ from ``{}``.
    assert after_upgrade != before_upgrade, (
        f'Revision {revision_id!r} upgrade was a no-op against schema '
        f'{previous!r}; this test cannot prove reversibility for a '
        'no-op migration. Either the revision is mis-routed in this '
        "test or the migration's upgrade() is empty."
    )

    # 2a. Per-revision sanity: assert the upgrade made the change the
    # migration *claims* to make. This catches the pathological case
    # where a no-op upgrade happens to round-trip cleanly even though
    # the migration body is broken.
    if revision_id == 'phase4c_force_logout':
        org_cols = {
            name for (name, *_rest)
            in after_upgrade.get('organizations', {}).get('columns', [])
        }
        assert 'force_logout_at' in org_cols, (
            "phase4c_force_logout upgrade did not add the "
            "'organizations.force_logout_at' column. Got columns: "
            f"{sorted(org_cols)}"
        )

    if revision_id == 'rpi_auth':
        rvm_cols = {
            name for (name, *_rest)
            in after_upgrade.get('rvms', {}).get('columns', [])
        }
        org_cols = {
            name for (name, *_rest)
            in after_upgrade.get('organizations', {}).get('columns', [])
        }
        assert 'api_key_hash' in rvm_cols, (
            "rpi_auth upgrade did not add 'rvms.api_key_hash'. "
            f"Got columns: {sorted(rvm_cols)}"
        )
        assert 'qr_hmac_secret_enc' in org_cols, (
            "rpi_auth upgrade did not add "
            "'organizations.qr_hmac_secret_enc'. Got columns: "
            f"{sorted(org_cols)}"
        )

    try:
        # 3. Downgrade by one step (back to ``previous``).
        _flask_migrate_downgrade(app, '-1')
        postgres_engine.dispose()
        after_downgrade = snapshot_schema(postgres_engine)

        # 4. Schema MUST be byte-identical to the pre-upgrade snapshot.
        assert after_downgrade == before_upgrade, (
            f'Revision {revision_id!r} is NOT reversible: schema after '
            f"upgrade+downgrade differs from schema before upgrade.\n"
            f'{_format_schema_diff(before_upgrade, after_downgrade)}'
        )
    finally:
        # Restore to head so a subsequent parametrize iteration (or
        # adjacent test) starts from a known-good state. The fixture's
        # teardown drops + recreates ``public`` so this is belt-and-
        # braces, but it makes the per-iteration intent explicit.
        try:
            _flask_migrate_upgrade(app, 'head')
        except Exception:
            # Suppress so the original assertion failure (if any) is
            # what surfaces in the report.
            pass


# Phase 4A migration test activated on 2026-05-27.
