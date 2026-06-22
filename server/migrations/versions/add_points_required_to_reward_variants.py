"""add points_required to reward_variants

Revision ID: a1b2c3d4e5f6
Revises: 28f573608da0
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'd15021ae149c'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('reward_variants', sa.Column('points_required', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('reward_variants', 'points_required')
