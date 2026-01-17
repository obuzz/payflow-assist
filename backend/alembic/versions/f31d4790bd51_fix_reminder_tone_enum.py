"""fix_reminder_tone_enum

Revision ID: f31d4790bd51
Revises: 191112f95d1c
Create Date: 2026-01-16 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f31d4790bd51'
down_revision = '191112f95d1c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert column to text first
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN tone TYPE text USING tone::text")

    # Update existing data to lowercase
    op.execute("UPDATE reminder_drafts SET tone = 'friendly' WHERE tone = 'FRIENDLY'")
    op.execute("UPDATE reminder_drafts SET tone = 'professional' WHERE tone = 'NEUTRAL' OR tone = 'professional'")
    op.execute("UPDATE reminder_drafts SET tone = 'firm' WHERE tone = 'FIRM'")
    op.execute("UPDATE reminder_drafts SET tone = 'formal' WHERE tone = 'formal'")

    # Drop old enum and create new one
    op.execute("DROP TYPE IF EXISTS remindertone")
    op.execute("CREATE TYPE remindertone AS ENUM ('friendly', 'professional', 'firm', 'formal')")

    # Convert column back to enum
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN tone TYPE remindertone USING tone::remindertone")


def downgrade() -> None:
    # Recreate old enum
    op.execute("ALTER TYPE remindertone RENAME TO remindertone_new")
    op.execute("CREATE TYPE remindertone AS ENUM ('FRIENDLY', 'NEUTRAL', 'FIRM', 'professional', 'formal')")
    op.execute("ALTER TABLE reminder_drafts ALTER COLUMN tone TYPE remindertone USING tone::text::remindertone")
    op.execute("DROP TYPE remindertone_new")
