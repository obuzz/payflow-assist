from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Numeric, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class ExternalSource(str, enum.Enum):
    MANUAL = "manual"
    STRIPE = "stripe"
    XERO = "xero"


class InvoiceStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    external_source = Column(
        Enum(ExternalSource),
        default=ExternalSource.MANUAL,
        nullable=False
    )
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(
        Enum(InvoiceStatus),
        default=InvoiceStatus.UNPAID,
        nullable=False
    )
    days_overdue = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    client = relationship("Client", back_populates="invoices")
    reminder_drafts = relationship("ReminderDraft", back_populates="invoice")

    def calculate_days_overdue(self) -> int:
        """Calculate days overdue based on current date"""
        if self.status == InvoiceStatus.PAID:
            return 0

        today = date.today()
        if today > self.due_date:
            return (today - self.due_date).days
        return 0
