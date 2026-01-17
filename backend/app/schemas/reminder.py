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
    escalation_level: int  # Stage 1-4
    body_text: str
    status: str  # pending, approved, scheduled, sent, failed
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


class ReminderSettingsResponse(BaseModel):
    id: UUID
    business_id: UUID
    auto_send_enabled: bool
    auto_approve_stage_1: bool
    stage_1_days: int
    stage_2_days: int
    stage_3_days: int
    stage_4_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateReminderSettingsRequest(BaseModel):
    auto_send_enabled: bool = Field(default=False)
    auto_approve_stage_1: bool = Field(default=False)
    stage_1_days: int = Field(default=7, ge=1, le=365)
    stage_2_days: int = Field(default=14, ge=1, le=365)
    stage_3_days: int = Field(default=30, ge=1, le=365)
    stage_4_days: int = Field(default=60, ge=1, le=365)
