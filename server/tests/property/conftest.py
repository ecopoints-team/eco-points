"""
Shared fixtures for property-based tests under `server/tests/property/`.

`server/app/__init__.py::create_app()` registers Domain_Controller
sub-blueprints onto a module-level `web_bp` singleton. Flask flips
`web_bp._got_registered_once = True` after the first registration, so
calling `create_app()` a second time inside the same Python interpreter
raises::

    AssertionError: The setup method 'register_blueprint' can no longer
    be called on the blueprint 'web'.

Phase 1 and Phase 2 property tests both want a live Flask app fixture.
Defining one app fixture per test module — even at `scope='session'` —
does not work, because session-scoped fixtures are still per-fixture-
function: each module's `def app()` is a separate fixture object, so
each one calls `create_app()` once.

This conftest centralises a single, package-scoped `app` fixture. Both
`test_phase1_route_invariants.py` and `test_phase2_granularity.py` now
share the *same* fixture function, so `create_app()` is invoked exactly
once per pytest session and `web_bp` is registered exactly once.
"""
from __future__ import annotations

import pytest

from app import create_app, db


@pytest.fixture(scope='session')
def app():
    """Session-scoped Flask app shared across every property test module.

    Yields a fully-built Flask `app` with the in-memory SQLite schema
    already created. The teardown drops the schema.
    """
    application = create_app()
    with application.app_context():
        db.create_all()
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()
