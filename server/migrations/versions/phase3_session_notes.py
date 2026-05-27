"""Add nullable `notes` column to `recycling_sessions` (Phase 3 task 8.2).

Revision ID: phase3_session_notes
Revises: 879d7ee9fab9
Create Date: 2026-05-04 14:42:20.591014

The Admin_UI bulk-sessions page (alignment doc §2) renders a `notes`
field per session. The current `RecyclingSession` model has no `notes`
column — the modal collects the value but it never persists. This
revision adds the column so 8.2's serializer can surface it (and 8.3 can
render the empty-state placeholder when the value is null).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'phase3_session_notes'
down_revision = '879d7ee9fab9'
branch_labels = None
depends_on = None


def upgrade():
    """Add `recycling_sessions.notes` (Text, nullable)."""
    with op.batch_alter_table('recycling_sessions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))


def downgrade():
    """Drop `recycling_sessions.notes`."""
    with op.batch_alter_table('recycling_sessions', schema=None) as batch_op:
        batch_op.drop_column('notes')
