"""add user password setup fields

Revision ID: f91b2c77a8d4
Revises: d2aac9069407
Create Date: 2026-06-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f91b2c77a8d4'
down_revision = 'd2aac9069407'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=True)
        batch_op.add_column(sa.Column('password_setup_token_hash', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('password_setup_expires_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('password_set_at', sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('password_set_at')
        batch_op.drop_column('password_setup_expires_at')
        batch_op.drop_column('password_setup_token_hash')
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=False)
