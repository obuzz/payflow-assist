from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class ReminderTone(str, enum.Enum):
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"
    FIRM = "firm"


class ReminderDraft(Base):
    __tablename__ = "reminder_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    tone = Column(Enum(ReminderTone), default=ReminderTone.FRIENDLY, nullable=False)
    body_text = Column(Text, nullable=False)
    approved = Column(Boolean, default=False, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    snoozed_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="reminder_drafts")
