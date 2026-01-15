from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class ReminderTone(str, enum.Enum):
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"
    FIRM = "firm"
    FORMAL = "formal"


class ReminderStatus(str, enum.Enum):
    PENDING = "pending"  # Draft created, not yet approved
    APPROVED = "approved"  # User approved, ready to send
    SCHEDULED = "scheduled"  # Scheduled to auto-send
    SENT = "sent"  # Successfully sent
    FAILED = "failed"  # Send failed


class ReminderDraft(Base):
    __tablename__ = "reminder_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    tone = Column(Enum(ReminderTone), default=ReminderTone.FRIENDLY, nullable=False)
    escalation_level = Column(Integer, default=1, nullable=False)  # 1, 2, 3, 4 for stages
    subject = Column(String(255), nullable=False)  # Email subject line
    body_text = Column(Text, nullable=False)
    status = Column(Enum(ReminderStatus), default=ReminderStatus.PENDING, nullable=False)
    approved = Column(Boolean, default=False, nullable=False)  # Legacy field, kept for compatibility
    auto_send_at = Column(DateTime, nullable=True)  # When to auto-send (if scheduled)
    sent_at = Column(DateTime, nullable=True)
    delivery_status = Column(String(50), nullable=True)  # 'delivered', 'failed', etc.
    snoozed_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="reminder_drafts")
