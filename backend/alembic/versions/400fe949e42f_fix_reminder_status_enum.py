"""fix_reminder_status_enum

Revision ID: 400fe949e42f
Revises: f31d4790bd51
Create Date: 2026-01-16 19:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '400fe949e42f'
down_revision = 'f31d4790bd51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert column to text first
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN status TYPE text USING status::text")

    # Update existing data to lowercase
    op.execute("UPDATE reminder_drafts SET status = 'pending' WHERE status = 'PENDING'")
    op.execute("UPDATE reminder_drafts SET status = 'approved' WHERE status = 'APPROVED'")
    op.execute("UPDATE reminder_drafts SET status = 'scheduled' WHERE status = 'SCHEDULED'")
    op.execute("UPDATE reminder_drafts SET status = 'sent' WHERE status = 'SENT'")
    op.execute("UPDATE reminder_drafts SET status = 'failed' WHERE status = 'FAILED'")

    # Drop old enum and create new one
    op.execute("DROP TYPE IF EXISTS reminderstatus")
    op.execute("CREATE TYPE reminderstatus AS ENUM ('pending', 'approved', 'scheduled', 'sent', 'failed')")

    # Convert column back to enum
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN status TYPE reminderstatus USING status::reminderstatus")


def downgrade() -> None:
    # Recreate old enum
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN status TYPE text USING status::text")
    op.execute("DROP TYPE IF EXISTS reminderstatus")
    op.execute("CREATE TYPE reminderstatus AS ENUM ('PENDING', 'APPROVED', 'SCHEDULED', 'SENT', 'FAILED')")
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN status TYPE reminderstatus USING status::reminderstatus")
