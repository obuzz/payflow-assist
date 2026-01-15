from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_active_subscription
from app.models.user import User
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.reminder import ReminderDraft
from app.schemas.reminder import ReminderDraftResponse, EditReminderRequest, SnoozeReminderRequest
from app.services.audit_service import AuditService
from app.services.email_service import EmailService

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("/drafts", response_model=List[ReminderDraftResponse])
async def get_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pending reminder drafts for approval"""
    drafts = db.query(
        ReminderDraft,
        Client.name.label('client_name'),
        Client.email.label('client_email'),
        Invoice.amount,
        Invoice.days_overdue
    ).join(Invoice).join(Client).filter(
        Client.business_id == current_user.business_id,
        ReminderDraft.approved == False,
        ReminderDraft.sent_at.is_(None)
    ).order_by(ReminderDraft.created_at.desc()).all()

    return [
        ReminderDraftResponse(
            id=draft.ReminderDraft.id,
            invoice_id=draft.ReminderDraft.invoice_id,
            client_name=draft.client_name,
            client_email=draft.client_email,
            amount=draft.amount,
            days_overdue=draft.days_overdue,
            tone=draft.ReminderDraft.tone.value,
            body_text=draft.ReminderDraft.body_text,
            approved=draft.ReminderDraft.approved,
            sent_at=draft.ReminderDraft.sent_at,
            snoozed_until=draft.ReminderDraft.snoozed_until,
            created_at=draft.ReminderDraft.created_at
        )
        for draft in drafts
    ]


@router.post("/{draft_id}/approve")
async def approve_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a reminder draft (does not send)"""
    draft = db.query(ReminderDraft).join(Invoice).join(Client).filter(
        ReminderDraft.id == draft_id,
        Client.business_id == current_user.business_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    if draft.sent_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft already sent"
        )

    draft.approved = True
    db.commit()

    # Log approval
    audit_service = AuditService(db)
    audit_service.log_action(
        action="draft_approved",
        actor_id=current_user.id,
        payload={
            "draft_id": str(draft.id),
            "invoice_id": str(draft.invoice_id)
        }
    )

    return {"message": "Draft approved"}


@router.post("/{draft_id}/edit")
async def edit_draft(
    draft_id: str,
    edit_data: EditReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Edit a reminder draft"""
    draft = db.query(ReminderDraft).join(Invoice).join(Client).filter(
        ReminderDraft.id == draft_id,
        Client.business_id == current_user.business_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    if draft.sent_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit sent draft"
        )

    original_text = draft.body_text
    draft.body_text = edit_data.body_text
    draft.approved = False  # Require re-approval after edit
    db.commit()

    # Log edit
    audit_service = AuditService(db)
    audit_service.log_action(
        action="draft_edited",
        actor_id=current_user.id,
        payload={
            "draft_id": str(draft.id),
            "original_text": original_text,
            "new_text": edit_data.body_text
        }
    )

    return {"message": "Draft updated"}


@router.post("/{draft_id}/snooze")
async def snooze_draft(
    draft_id: str,
    snooze_data: SnoozeReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Snooze a reminder draft"""
    draft = db.query(ReminderDraft).join(Invoice).join(Client).filter(
        ReminderDraft.id == draft_id,
        Client.business_id == current_user.business_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    draft.snoozed_until = datetime.utcnow() + timedelta(days=snooze_data.days)
    db.commit()

    return {"message": f"Draft snoozed for {snooze_data.days} days"}


@router.post("/{draft_id}/send")
async def send_reminder(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription)
):
    """Send an approved reminder draft"""
    draft = db.query(ReminderDraft).join(Invoice).join(Client).filter(
        ReminderDraft.id == draft_id,
        Client.business_id == current_user.business_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    if not draft.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft must be approved before sending"
        )

    if draft.sent_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft already sent"
        )

    # Get invoice and client details
    invoice = db.query(Invoice).filter(Invoice.id == draft.invoice_id).first()
    client = db.query(Client).filter(Client.id == invoice.client_id).first()

    # Send email
    email_service = EmailService()
    try:
        email_service.send_reminder(
            to_email=client.email,
            from_user=current_user,
            body=draft.body_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

    # Mark as sent
    draft.sent_at = datetime.utcnow()
    db.commit()

    # Log send
    audit_service = AuditService(db)
    audit_service.log_action(
        action="draft_sent",
        actor_id=current_user.id,
        payload={
            "draft_id": str(draft.id),
            "invoice_id": str(invoice.id),
            "client_email": client.email,
            "amount": str(invoice.amount)
        }
    )

    return {"message": "Reminder sent successfully"}


@router.delete("/{draft_id}")
async def delete_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reminder draft"""
    draft = db.query(ReminderDraft).join(Invoice).join(Client).filter(
        ReminderDraft.id == draft_id,
        Client.business_id == current_user.business_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    if draft.sent_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete sent draft"
        )

    db.delete(draft)
    db.commit()

    return {"message": "Draft deleted"}
