from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base
from app.models.reminder import ReminderTone


class ReminderSettings(Base):
    __tablename__ = "reminder_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, unique=True)

    # Escalation Schedule - stores array of stages
    # Each stage: {level: 1, days_after_due: 3, tone: "friendly", requires_approval: false}
    escalation_schedule = Column(JSON, nullable=False, default=[
        {"level": 1, "days_after_due": 3, "tone": "friendly", "requires_approval": False},
        {"level": 2, "days_after_due": 10, "tone": "professional", "requires_approval": False},
        {"level": 3, "days_after_due": 21, "tone": "firm", "requires_approval": True},
        {"level": 4, "days_after_due": 45, "tone": "formal", "requires_approval": True}
    ])

    # Auto-send grace period in hours (time to review before auto-send)
    auto_send_grace_period_hours = Column(Integer, default=2, nullable=False)

    # Email signature
    email_signature = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="reminder_settings")
