from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class SensitivityLevel(str, enum.Enum):
    STANDARD = "standard"
    VIP = "vip"


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    sensitivity_level = Column(
        Enum(SensitivityLevel),
        default=SensitivityLevel.STANDARD,
        nullable=False
    )
    reminders_disabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client")
