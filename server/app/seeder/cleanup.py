"""
EcoPoints Token Blacklist Cleanup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Flask CLI command to delete expired rows from the ``token_blacklist`` table.

Usage:
    flask cleanup-tokens

The command deletes all rows where ``expires_at < datetime.utcnow()``,
commits the transaction, and logs the number of deleted rows plus the
wall-clock duration of the cleanup transaction.

Validates: Requirements 4I.32, 4I.33
"""
import time
from datetime import datetime

import click
from flask import current_app
from flask.cli import with_appcontext


@click.command('cleanup-tokens')
@with_appcontext
def cleanup_tokens():
    """Delete expired rows from token_blacklist and log the result."""
    from .. import db
    from ..models import TokenBlacklist

    started = time.monotonic()

    deleted = (
        TokenBlacklist.query
        .filter(TokenBlacklist.expires_at < datetime.utcnow())
        .delete(synchronize_session=False)
    )
    db.session.commit()

    duration = time.monotonic() - started
    current_app.logger.info(
        f"token_blacklist cleanup: deleted={deleted} duration_s={duration:.3f}"
    )
