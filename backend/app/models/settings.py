"""
Reminder Settings Model
"""
import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class ReminderSettings(Base):
    """Settings for payment reminder escalation"""
    __tablename__ = "reminder_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, unique=True)

    # Automation settings
    auto_send_enabled = Column(Boolean, default=False, nullable=False)
    auto_approve_stage_1 = Column(Boolean, default=False, nullable=False)

    # Escalation thresholds (days overdue)
    stage_1_days = Column(Integer, default=7, nullable=False)  # Friendly
    stage_2_days = Column(Integer, default=14, nullable=False)  # Professional
    stage_3_days = Column(Integer, default=30, nullable=False)  # Firm
    stage_4_days = Column(Integer, default=60, nullable=False)  # Final

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="reminder_settings")
