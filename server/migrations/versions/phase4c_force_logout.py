"""Add force_logout_at column to organizations (Phase 4C).

Revision ID: phase4c_force_logout
Revises: phase3_session_notes
Create Date: 2026-05-04 15:00:00.000000

When an admin invokes force-logout-all, the server sets
organizations.force_logout_at = NOW(). The middleware then rejects any
JWT whose iat is strictly less than this timestamp with HTTP 401
error.code = "FORCED_LOGOUT".
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'phase4c_force_logout'
down_revision = 'phase3_session_notes'
branch_labels = None
depends_on = None


def upgrade():
    """Add organizations.force_logout_at (DateTime with timezone, nullable)."""
    op.add_column('organizations', sa.Column('force_logout_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    """Drop organizations.force_logout_at."""
    op.drop_column('organizations', 'force_logout_at')
