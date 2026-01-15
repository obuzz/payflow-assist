from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus, ExternalSource
from app.schemas.invoice import InvoiceResponse, InvoiceUploadResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_invoices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload invoices via CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted"
        )

    audit_service = AuditService(db)
    success_count = 0
    failed_count = 0
    errors = []

    try:
        contents = await file.read()
        csv_file = io.StringIO(contents.decode('utf-8'))
        reader = csv.DictReader(csv_file)

        required_fields = {'client_name', 'client_email', 'amount', 'due_date'}
        if not required_fields.issubset(set(reader.fieldnames or [])):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV must contain fields: {', '.join(required_fields)}"
            )

        for row_num, row in enumerate(reader, start=2):
            try:
                # Parse amount
                try:
                    amount = Decimal(row['amount'].replace('£', '').replace(',', '').strip())
                except (InvalidOperation, ValueError):
                    errors.append(f"Row {row_num}: Invalid amount format")
                    failed_count += 1
                    continue

                # Parse due_date
                try:
                    due_date = datetime.strptime(row['due_date'].strip(), '%Y-%m-%d').date()
                except ValueError:
                    try:
                        due_date = datetime.strptime(row['due_date'].strip(), '%d/%m/%Y').date()
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid date format (use YYYY-MM-DD or DD/MM/YYYY)")
                        failed_count += 1
                        continue

                client_name = row['client_name'].strip()
                client_email = row['client_email'].strip().lower()

                if not client_name or not client_email:
                    errors.append(f"Row {row_num}: Client name and email are required")
                    failed_count += 1
                    continue

                # Find or create client
                client = db.query(Client).filter(
                    Client.business_id == current_user.business_id,
                    Client.email == client_email
                ).first()

                if not client:
                    client = Client(
                        business_id=current_user.business_id,
                        name=client_name,
                        email=client_email
                    )
                    db.add(client)
                    db.flush()

                # Create invoice
                invoice = Invoice(
                    client_id=client.id,
                    amount=amount,
                    due_date=due_date,
                    external_source=ExternalSource.MANUAL,
                    status=InvoiceStatus.UNPAID
                )
                invoice.days_overdue = invoice.calculate_days_overdue()
                db.add(invoice)

                success_count += 1

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                failed_count += 1
                continue

        db.commit()

        # Log the upload
        audit_service.log_action(
            action="invoices_uploaded",
            actor_id=current_user.id,
            payload={
                "success": success_count,
                "failed": failed_count,
                "filename": file.filename
            }
        )

        return InvoiceUploadResponse(
            success=success_count,
            failed=failed_count,
            errors=errors[:10]  # Limit errors to first 10
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process CSV: {str(e)}"
        )


@router.get("/", response_model=List[InvoiceResponse])
async def get_invoices(
    status_filter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all invoices for the current user's business"""
    query = db.query(
        Invoice,
        Client.name.label('client_name'),
        Client.email.label('client_email')
    ).join(Client).filter(
        Client.business_id == current_user.business_id
    )

    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    invoices = query.order_by(Invoice.due_date.desc()).all()

    return [
        InvoiceResponse(
            id=inv.Invoice.id,
            client_id=inv.Invoice.client_id,
            client_name=inv.client_name,
            client_email=inv.client_email,
            amount=inv.Invoice.amount,
            due_date=inv.Invoice.due_date,
            status=inv.Invoice.status.value,
            days_overdue=inv.Invoice.days_overdue,
            created_at=inv.Invoice.created_at
        )
        for inv in invoices
    ]
