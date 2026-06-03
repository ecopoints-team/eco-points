"""Phase 4A — RPI Authentication columns.

Revision ID: rpi_auth
Revises: phase4c_force_logout
Create Date: 2026-05-27

Adds:
  - ``rvms.api_key_hash``           (String(255), nullable)
  - ``organizations.qr_hmac_secret_enc``  (LargeBinary, nullable)

Requirements: 4A.1, 4A.4, 7.8, 7.11
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'rpi_auth'
down_revision = 'phase4c_force_logout'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('rvms', sa.Column('api_key_hash', sa.String(length=255), nullable=True))
    op.add_column('organizations', sa.Column('qr_hmac_secret_enc', sa.LargeBinary(), nullable=True))


def downgrade():
    op.drop_column('organizations', 'qr_hmac_secret_enc')
    op.drop_column('rvms', 'api_key_hash')
