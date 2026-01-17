"""
Draft Generation Service - Automatically creates reminder drafts for overdue invoices
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date, timedelta
from typing import List, Optional
from decimal import Decimal

from app.models.invoice import Invoice, InvoiceStatus
from app.models.reminder import ReminderDraft, ReminderTone, ReminderStatus
from app.models.settings import ReminderSettings
from app.models.client import Client
from app.services.ai_service import get_ai_service


class DraftGenerationService:
    """Service for automatically generating payment reminder drafts"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = get_ai_service()

    def generate_drafts_for_overdue_invoices(
        self,
        business_id: str,
        max_drafts: int = 50,
        manual_trigger: bool = False
    ) -> List[ReminderDraft]:
        """
        Generate reminder drafts for all overdue invoices

        Args:
            business_id: Business to generate drafts for
            max_drafts: Maximum number of drafts to generate in one run
            manual_trigger: If True, bypass auto_send_enabled check (manual generation)

        Returns:
            List of created ReminderDraft objects
        """
        # Get or create business reminder settings
        settings = self.db.query(ReminderSettings).filter(
            ReminderSettings.business_id == business_id
        ).first()

        if not settings:
            # Create default settings if they don't exist
            settings = ReminderSettings(
                business_id=business_id,
                auto_send_enabled=False,
                auto_approve_stage_1=False,
                stage_1_days=7,
                stage_2_days=14,
                stage_3_days=30,
                stage_4_days=60
            )
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)

        # For automatic scheduled runs, check if auto_send is enabled
        # For manual triggers (button click), always proceed
        if not manual_trigger and not settings.auto_send_enabled:
            return []

        # Find overdue invoices that need reminders
        overdue_invoices = self._find_overdue_invoices_needing_reminders(
            business_id,
            max_drafts
        )

        created_drafts = []
        for invoice in overdue_invoices:
            try:
                draft = self._create_draft_for_invoice(invoice, settings)
                if draft:
                    created_drafts.append(draft)
            except Exception as e:
                # Log error but continue processing other invoices
                print(f"Error creating draft for invoice {invoice.id}: {e}")
                continue

        self.db.commit()
        return created_drafts

    def _find_overdue_invoices_needing_reminders(
        self,
        business_id: str,
        limit: int
    ) -> List[Invoice]:
        """Find invoices that are overdue and need reminder drafts"""

        today = datetime.utcnow().date()

        # Query for overdue, unpaid invoices
        query = self.db.query(Invoice).join(Client).filter(
            and_(
                Client.business_id == business_id,
                Invoice.status == InvoiceStatus.UNPAID,
                Invoice.due_date < today,
                Client.reminders_disabled == False
            )
        )

        # Exclude invoices that already have pending/scheduled drafts
        # (we only want to create new drafts for invoices without active reminders)
        query = query.filter(
            ~Invoice.reminder_drafts.any(
                ReminderDraft.status.in_([
                    ReminderStatus.PENDING,
                    ReminderStatus.APPROVED,
                    ReminderStatus.SCHEDULED
                ])
            )
        )

        return query.limit(limit).all()

    def _create_draft_for_invoice(
        self,
        invoice: Invoice,
        settings: ReminderSettings
    ) -> Optional[ReminderDraft]:
        """Create a reminder draft for a specific invoice"""

        # Calculate days overdue
        days_overdue = (datetime.utcnow().date() - invoice.due_date).days

        # Determine escalation level based on days overdue
        escalation_level = self._calculate_escalation_level(
            days_overdue,
            settings
        )

        # Determine appropriate tone
        tone = self._determine_tone(escalation_level, settings)

        # Count previous reminders sent
        previous_reminders = self.db.query(ReminderDraft).filter(
            and_(
                ReminderDraft.invoice_id == invoice.id,
                ReminderDraft.status == ReminderStatus.SENT
            )
        ).count()

        # Get business info from invoice
        business = invoice.client.business

        # Generate email content using AI
        try:
            email_content = self.ai_service.generate_reminder_email(
                client_name=invoice.client.name,
                client_email=invoice.client.email,
                invoice_amount=invoice.amount,
                due_date=invoice.due_date,
                days_overdue=days_overdue,
                tone=tone,
                escalation_level=escalation_level,
                business_name=business.name,
                industry_type=business.industry_type,
                relationship_notes=invoice.client.relationship_notes,
                previous_reminders_sent=previous_reminders
            )
        except Exception as e:
            print(f"AI service error: {e}")
            # Fall back to template if AI fails
            email_content = self._generate_fallback_email(
                invoice,
                days_overdue,
                escalation_level
            )

        # Create draft
        draft = ReminderDraft(
            invoice_id=invoice.id,
            tone=tone,
            escalation_level=escalation_level,
            subject=email_content["subject"],
            body_text=email_content["body"],
            status=ReminderStatus.PENDING,
            approved=False
        )

        # If auto-send is enabled and auto-approve is enabled, schedule it
        if settings.auto_send_enabled and settings.auto_approve_stage_1 and escalation_level == 1:
            draft.status = ReminderStatus.SCHEDULED
            draft.approved = True
            # Schedule for next day at 9am
            draft.auto_send_at = datetime.utcnow() + timedelta(days=1)

        self.db.add(draft)
        return draft

    def _calculate_escalation_level(
        self,
        days_overdue: int,
        settings: ReminderSettings
    ) -> int:
        """Calculate escalation level (1-4) based on days overdue"""

        if days_overdue >= settings.stage_4_days:
            return 4
        elif days_overdue >= settings.stage_3_days:
            return 3
        elif days_overdue >= settings.stage_2_days:
            return 2
        else:
            return 1

    def _determine_tone(
        self,
        escalation_level: int,
        settings: ReminderSettings
    ) -> ReminderTone:
        """Determine appropriate tone based on escalation level and settings"""

        # Map escalation levels to tones
        # Can be customized based on business settings
        tone_map = {
            1: ReminderTone.FRIENDLY,
            2: ReminderTone.PROFESSIONAL,
            3: ReminderTone.FIRM,
            4: ReminderTone.FORMAL
        }

        return tone_map.get(escalation_level, ReminderTone.PROFESSIONAL)

    def _generate_fallback_email(
        self,
        invoice: Invoice,
        days_overdue: int,
        escalation_level: int
    ) -> dict:
        """Generate a simple template email if AI service fails"""

        client_name = invoice.client.name
        amount = f"£{invoice.amount:,.2f}"
        due_date = invoice.due_date.strftime("%d %B %Y")

        if escalation_level == 1:
            subject = f"Friendly Reminder: Invoice Payment Due"
            body = f"""Dear {client_name},

I hope this email finds you well.

This is a friendly reminder that invoice #{invoice.invoice_number} for {amount} was due on {due_date} ({days_overdue} days ago).

If you've already sent payment, please disregard this message. Otherwise, I'd appreciate it if you could process payment at your earliest convenience.

Please let me know if you have any questions.

Best regards"""

        elif escalation_level == 2:
            subject = f"Payment Reminder: Invoice #{invoice.invoice_number}"
            body = f"""Dear {client_name},

I'm writing to follow up on invoice #{invoice.invoice_number} for {amount}, which was due on {due_date}.

The payment is now {days_overdue} days overdue. Please arrange payment as soon as possible.

If there are any issues preventing payment, please contact me so we can discuss.

Best regards"""

        elif escalation_level == 3:
            subject = f"Urgent: Overdue Payment Required"
            body = f"""Dear {client_name},

Invoice #{invoice.invoice_number} for {amount} is now {days_overdue} days overdue (due date: {due_date}).

Please arrange immediate payment to avoid any service interruption or late fees.

If you need to discuss payment arrangements, please contact me urgently.

Best regards"""

        else:  # Level 4
            subject = f"Final Notice: Payment Required"
            body = f"""Dear {client_name},

This is a final notice regarding invoice #{invoice.invoice_number} for {amount}, which is now {days_overdue} days overdue.

Payment must be received immediately to avoid escalation to collections.

Please contact me within 48 hours to resolve this matter.

Best regards"""

        return {
            "subject": subject,
            "body": body
        }


# Singleton instance
_draft_service = None


def get_draft_generation_service(db: Session) -> DraftGenerationService:
    """Get draft generation service instance"""
    return DraftGenerationService(db)
