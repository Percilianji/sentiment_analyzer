"""add topic to posts

Revision ID: 8f4f7a2c1b66
Revises: edbf4b84d570
Create Date: 2026-06-11 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8f4f7a2c1b66'
down_revision = 'edbf4b84d570'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('topic', sa.String(length=100), nullable=True))


def downgrade():
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_column('topic')
