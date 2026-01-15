from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID


class InvoiceUploadRow(BaseModel):
    client_name: str
    client_email: EmailStr
    amount: Decimal = Field(..., gt=0)
    due_date: date


class InvoiceResponse(BaseModel):
    id: UUID
    client_id: UUID
    client_name: str
    client_email: str
    amount: Decimal
    due_date: date
    status: str
    days_overdue: int
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceUploadResponse(BaseModel):
    success: int
    failed: int
    errors: list[str]
