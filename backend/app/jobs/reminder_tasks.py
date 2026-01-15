from celery import shared_task
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.core.database import SessionLocal
from app.models.invoice import Invoice, InvoiceStatus
from app.models.client import Client, SensitivityLevel
from app.models.reminder import ReminderDraft, ReminderTone
from app.services.ai_service import AIService
from app.services.audit_service import AuditService


@shared_task(name='app.jobs.reminder_tasks.update_days_overdue')
def update_days_overdue():
    """Update days_overdue for all unpaid invoices (runs daily)"""
    db: Session = SessionLocal()
    try:
        unpaid_invoices = db.query(Invoice).filter(
            Invoice.status == InvoiceStatus.UNPAID
        ).all()

        for invoice in unpaid_invoices:
            invoice.days_overdue = invoice.calculate_days_overdue()

        db.commit()
        return {"updated": len(unpaid_invoices)}
    finally:
        db.close()


@shared_task(name='app.jobs.reminder_tasks.generate_reminder_drafts')
def generate_reminder_drafts():
    """
    Generate reminder drafts for eligible invoices (runs daily)

    Eligibility criteria:
    - Invoice is unpaid
    - Days overdue >= 7
    - Client is not VIP
    - Client has reminders enabled
    - No pending draft already exists
    """
    db: Session = SessionLocal()
    ai_service = AIService()

    try:
        # Find eligible invoices
        eligible_invoices = db.query(Invoice).join(Client).filter(
            Invoice.status == InvoiceStatus.UNPAID,
            Invoice.days_overdue >= 7,
            Client.sensitivity_level != SensitivityLevel.VIP,
            Client.reminders_disabled == False
        ).all()

        generated_count = 0

        for invoice in eligible_invoices:
            # Check if already has a pending draft
            existing_draft = db.query(ReminderDraft).filter(
                ReminderDraft.invoice_id == invoice.id,
                ReminderDraft.approved == False,
                ReminderDraft.sent_at.is_(None)
            ).first()

            if existing_draft:
                continue

            # Count previous reminders
            previous_reminders = db.query(ReminderDraft).filter(
                ReminderDraft.invoice_id == invoice.id,
                ReminderDraft.sent_at.isnot(None)
            ).count()

            # Determine tone based on days overdue
            if invoice.days_overdue >= 30:
                tone = ReminderTone.FIRM
            elif invoice.days_overdue >= 14:
                tone = ReminderTone.NEUTRAL
            else:
                tone = ReminderTone.FRIENDLY

            try:
                # Generate reminder text
                reminder_text = ai_service.generate_reminder(
                    amount=invoice.amount,
                    days_overdue=invoice.days_overdue,
                    tone=tone.value,
                    previous_reminders=previous_reminders
                )

                # Create draft
                draft = ReminderDraft(
                    invoice_id=invoice.id,
                    tone=tone,
                    body_text=reminder_text
                )
                db.add(draft)
                generated_count += 1

            except Exception as e:
                print(f"Failed to generate reminder for invoice {invoice.id}: {e}")
                continue

        db.commit()
        return {
            "eligible": len(eligible_invoices),
            "generated": generated_count
        }

    finally:
        db.close()
