"""erd field relocation

Move educational_level from users to community_groups.
Drop group_type from community_groups.
Keep year_level on users.

Revision ID: d15021ae149c
Revises: 28f573608da0
Create Date: 2026-06-18 18:47:44.902757
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd15021ae149c'
down_revision = '28f573608da0'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add educational_level to community_groups
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.add_column(sa.Column('educational_level', sa.String(length=30), nullable=True))

    # 2. Best-effort data preservation: copy each user's educational_level
    #    onto their community group (last writer wins; groups are cohorts).
    op.execute("""
        UPDATE community_groups
        SET educational_level = sub.educational_level
        FROM (
            SELECT community_group_id, MAX(educational_level) AS educational_level
            FROM users
            WHERE educational_level IS NOT NULL
            GROUP BY community_group_id
        ) sub
        WHERE community_groups.id = sub.community_group_id
    """)

    # 3. Drop group_type from community_groups
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.drop_column('group_type')

    # 4. Fix qr_token index style (unique constraint -> unique index) and
    #    drop educational_level from users (year_level stays)
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('users_qr_token_key'), type_='unique')
        batch_op.create_index(batch_op.f('ix_users_qr_token'), ['qr_token'], unique=True)
        batch_op.drop_column('educational_level')


def downgrade():
    # Restore educational_level on users
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_qr_token'))
        batch_op.create_unique_constraint(batch_op.f('users_qr_token_key'), ['qr_token'])
        batch_op.add_column(sa.Column('educational_level', sa.String(length=30), nullable=True))

    # Best-effort reverse: copy group educational_level back to members
    op.execute("""
        UPDATE users
        SET educational_level = cg.educational_level
        FROM community_groups cg
        WHERE users.community_group_id = cg.id AND cg.educational_level IS NOT NULL
    """)

    # Restore group_type and drop educational_level from community_groups
    with op.batch_alter_table('community_groups', schema=None) as batch_op:
        batch_op.add_column(sa.Column('group_type', sa.String(length=50), nullable=True))
        batch_op.drop_column('educational_level')
