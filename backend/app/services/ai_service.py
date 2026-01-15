"""
AI Service for generating payment reminder emails using Claude API
"""
import anthropic
from typing import Dict, Optional
from decimal import Decimal
from datetime import date

from app.core.config import settings
from app.models.reminder import ReminderTone


class AIService:
    """Service for AI-powered email generation using Claude"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def generate_reminder_email(
        self,
        client_name: str,
        client_email: str,
        invoice_amount: Decimal,
        due_date: date,
        days_overdue: int,
        tone: ReminderTone,
        escalation_level: int,
        business_name: str,
        industry_type: str,
        relationship_notes: Optional[str] = None,
        previous_reminders_sent: int = 0
    ) -> Dict[str, str]:
        """
        Generate a payment reminder email using Claude API

        Returns:
            Dict with 'subject' and 'body' keys containing the email content
        """

        # Build context for AI
        context_parts = [
            f"You are writing a professional payment reminder email.",
            f"Business: {business_name} ({industry_type} industry)",
            f"Client: {client_name} ({client_email})",
            f"Invoice amount: £{invoice_amount:,.2f}",
            f"Due date: {due_date.strftime('%d %B %Y')}",
            f"Days overdue: {days_overdue}",
            f"Escalation level: {escalation_level} of 4",
            f"Previous reminders sent: {previous_reminders_sent}",
        ]

        if relationship_notes:
            context_parts.append(f"Relationship context: {relationship_notes}")

        context = "\n".join(context_parts)

        # Tone-specific instructions
        tone_instructions = {
            ReminderTone.FRIENDLY: (
                "Use a warm, friendly, and understanding tone. "
                "Assume this is a good client who may have simply forgotten. "
                "Be polite and maintain the relationship. "
                "Keep it conversational but professional."
            ),
            ReminderTone.PROFESSIONAL: (
                "Use a professional business tone. "
                "Be polite but more direct about the outstanding payment. "
                "Maintain professionalism while clearly stating the situation."
            ),
            ReminderTone.FIRM: (
                "Use a firm but respectful tone. "
                "Be direct about the overdue payment and the need for immediate action. "
                "Mention potential consequences (e.g., late fees, service suspension) if appropriate. "
                "Remain professional and avoid aggressive language."
            ),
            ReminderTone.FORMAL: (
                "Use a formal, serious tone appropriate for final notices. "
                "Be clear that this is a final warning before escalation to collections or legal action. "
                "Use formal business language. State next steps clearly."
            )
        }

        # Build the prompt
        prompt = f"""{context}

{tone_instructions[tone]}

Write a payment reminder email with the following requirements:
1. Keep the email concise (150-250 words)
2. Include a clear subject line that's professional and specific
3. Start with an appropriate greeting
4. Clearly state:
   - The invoice amount
   - The due date
   - How many days overdue it is
5. Include a clear call-to-action
6. End with an appropriate sign-off
7. Do NOT include sender's name/signature (will be added automatically)
8. Use British English spelling and currency formatting
9. Be tactful - this is about maintaining business relationships

Format your response as JSON with two keys:
- "subject": The email subject line (max 80 characters)
- "body": The email body text

Do not include any markdown formatting in the email body. Use plain text only."""

        # Call Claude API
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Using Claude 3.5 Sonnet
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse response
        response_text = message.content[0].text

        # Extract JSON from response
        import json
        try:
            # Try to parse as JSON directly
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If response includes markdown code blocks, extract JSON
            import re
            json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(1))
            else:
                # Fallback: try to find JSON object
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(0))
                else:
                    raise ValueError("Could not parse AI response as JSON")

        return {
            "subject": result.get("subject", "Payment Reminder"),
            "body": result.get("body", "")
        }


# Singleton instance
_ai_service = None


def get_ai_service() -> AIService:
    """Get or create AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
