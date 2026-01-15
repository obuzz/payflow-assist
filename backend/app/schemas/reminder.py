from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional
from decimal import Decimal


class ReminderDraftResponse(BaseModel):
    id: UUID
    invoice_id: UUID
    client_name: str
    client_email: str
    amount: Decimal
    days_overdue: int
    tone: str
    body_text: str
    approved: bool
    sent_at: Optional[datetime]
    snoozed_until: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class EditReminderRequest(BaseModel):
    body_text: str = Field(..., max_length=500)


class SnoozeReminderRequest(BaseModel):
    days: int = Field(..., ge=1, le=30)
