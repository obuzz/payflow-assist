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


class InvoiceManualCreate(BaseModel):
    client_name: str = Field(..., min_length=1)
    client_email: EmailStr
    amount: str  # Accepts as string from frontend
    due_date: str  # Accepts as string from frontend (YYYY-MM-DD)
    invoice_number: Optional[str] = None


class InvoiceUpdate(BaseModel):
    client_name: Optional[str] = Field(None, min_length=1)
    client_email: Optional[EmailStr] = None
    amount: Optional[str] = None  # Accepts as string from frontend
    due_date: Optional[str] = None  # Accepts as string from frontend (YYYY-MM-DD)
