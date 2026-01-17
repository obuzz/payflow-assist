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
from app.schemas.invoice import InvoiceResponse, InvoiceUploadResponse, InvoiceManualCreate, InvoiceUpdate
from app.services.audit_service import AuditService

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_invoices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload invoices via CSV or Excel file"""
    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and Excel files (.csv, .xlsx, .xls) are accepted"
        )

    audit_service = AuditService(db)
    success_count = 0
    failed_count = 0
    errors = []

    # Read file contents
    contents = await file.read()

    # Convert Excel to CSV-like dict reader if needed
    if file_extension in ['xlsx', 'xls']:
        try:
            from openpyxl import load_workbook
            import tempfile

            # Save to temp file (openpyxl needs a file path)
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            # Load workbook and get active sheet
            wb = load_workbook(tmp_path, read_only=True)
            ws = wb.active

            # Convert to list of dicts (like CSV DictReader)
            rows = list(ws.values)
            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Excel file is empty"
                )

            headers = [str(h).lower().strip() for h in rows[0]]
            reader = [dict(zip(headers, row)) for row in rows[1:]]

            # Clean up temp file
            import os
            os.unlink(tmp_path)

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read Excel file: {str(e)}"
            )
    else:
        # CSV file
        csv_file = io.StringIO(contents.decode('utf-8'))
        csv_reader = csv.DictReader(csv_file)
        headers = csv_reader.fieldnames or []
        reader = list(csv_reader)

    # Validate required fields
    required_fields = {'client_name', 'client_email', 'amount', 'due_date'}
    if file_extension in ['xlsx', 'xls']:
        available_fields = set(headers) if 'headers' in locals() else set()
    else:
        available_fields = set(headers)

    if not required_fields.issubset(available_fields):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File must contain columns: {', '.join(required_fields)}"
        )

    try:

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

                # Get optional invoice_number if provided
                invoice_number = row.get('invoice_number', '').strip() if row.get('invoice_number') else None

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
        import traceback
        error_detail = f"Failed to process CSV: {str(e)}"
        print(f"ERROR in upload_invoices: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
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


@router.post("/manual", status_code=status.HTTP_201_CREATED)
async def add_invoice_manually(
    invoice_data: InvoiceManualCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually add a single invoice"""
    audit_service = AuditService(db)

    try:
        # Parse amount
        amount = Decimal(invoice_data.amount.replace('£', '').replace(',', '').strip())
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be greater than 0"
            )
    except (InvalidOperation, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount format"
        )

    # Parse due date
    try:
        due_date = datetime.strptime(invoice_data.due_date.strip(), '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Find or create client
    client = db.query(Client).filter(
        Client.business_id == current_user.business_id,
        Client.email == invoice_data.client_email.lower()
    ).first()

    if not client:
        client = Client(
            business_id=current_user.business_id,
            name=invoice_data.client_name.strip(),
            email=invoice_data.client_email.lower()
        )
        db.add(client)
        db.flush()

    # Create invoice
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
    db.commit()
    db.refresh(invoice)

    # Log the action
    audit_service.log_action(
        action="invoice_created_manually",
        actor_id=current_user.id,
        payload={
            "invoice_id": str(invoice.id),
            "client_name": invoice_data.client_name,
            "amount": str(amount)
        }
    )

    return {
        "message": "Invoice created successfully",
        "invoice_id": str(invoice.id)
    }


@router.patch("/{invoice_id}/mark-paid", status_code=status.HTTP_200_OK)
async def mark_invoice_paid(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an invoice as paid"""
    from uuid import UUID
    
    try:
        invoice_uuid = UUID(invoice_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invoice ID format"
        )
    
    # Get invoice and verify ownership
    invoice = db.query(Invoice).join(Client).filter(
        Invoice.id == invoice_uuid,
        Client.business_id == current_user.business_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    invoice.status = InvoiceStatus.PAID
    invoice.days_overdue = 0
    db.commit()
    
    # Log the action
    audit_service = AuditService(db)
    audit_service.log_action(
        action="invoice_marked_paid",
        actor_id=current_user.id,
        payload={"invoice_id": str(invoice.id)}
    )
    
    return {"message": "Invoice marked as paid"}


@router.patch("/{invoice_id}", status_code=status.HTTP_200_OK)
async def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update invoice details"""
    from uuid import UUID

    try:
        invoice_uuid = UUID(invoice_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invoice ID format"
        )

    # Get invoice and verify ownership
    invoice = db.query(Invoice).join(Client).filter(
        Invoice.id == invoice_uuid,
        Client.business_id == current_user.business_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Get the associated client
    client = db.query(Client).filter(Client.id == invoice.client_id).first()

    # Update client details if provided
    if invoice_data.client_name is not None:
        client.name = invoice_data.client_name.strip()

    if invoice_data.client_email is not None:
        # Check if another client with this email exists
        existing_client = db.query(Client).filter(
            Client.business_id == current_user.business_id,
            Client.email == invoice_data.client_email.lower(),
            Client.id != client.id
        ).first()

        if existing_client:
            # Move invoice to existing client
            invoice.client_id = existing_client.id
        else:
            # Update current client's email
            client.email = invoice_data.client_email.lower()

    # Update invoice amount
    if invoice_data.amount is not None:
        try:
            amount = Decimal(invoice_data.amount.replace('£', '').replace(',', '').strip())
            if amount <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Amount must be greater than 0"
                )
            invoice.amount = amount
        except (InvalidOperation, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid amount format"
            )

    # Update due date
    if invoice_data.due_date is not None:
        try:
            due_date = datetime.strptime(invoice_data.due_date.strip(), '%Y-%m-%d').date()
            invoice.due_date = due_date
            # Recalculate days overdue
            invoice.days_overdue = invoice.calculate_days_overdue()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )

    db.commit()

    # Log the action
    audit_service = AuditService(db)
    audit_service.log_action(
        action="invoice_updated",
        actor_id=current_user.id,
        payload={"invoice_id": str(invoice.id)}
    )

    return {"message": "Invoice updated successfully"}


@router.delete("/{invoice_id}", status_code=status.HTTP_200_OK)
async def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an invoice"""
    from uuid import UUID
    
    try:
        invoice_uuid = UUID(invoice_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invoice ID format"
        )
    
    # Get invoice and verify ownership
    invoice = db.query(Invoice).join(Client).filter(
        Invoice.id == invoice_uuid,
        Client.business_id == current_user.business_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Delete related reminder drafts first
    from app.models.reminder_draft import ReminderDraft
    db.query(ReminderDraft).filter(ReminderDraft.invoice_id == invoice_uuid).delete()
    
    # Log before deletion
    audit_service = AuditService(db)
    audit_service.log_action(
        action="invoice_deleted",
        actor_id=current_user.id,
        payload={"invoice_id": str(invoice.id)}
    )
    
    db.delete(invoice)
    db.commit()
    
    return {"message": "Invoice deleted successfully"}
