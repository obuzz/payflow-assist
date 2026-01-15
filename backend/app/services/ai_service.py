from openai import OpenAI
from decimal import Decimal
from app.core.config import settings


class AIService:
    """Service for AI-powered reminder generation"""

    # Prohibited phrases that indicate threatening or legal language
    PROHIBITED_PHRASES = [
        "legal",
        "court",
        "breach",
        "default",
        "final notice",
        "penalty",
        "interest",
        "action will be taken",
        "lawsuit",
        "attorney",
        "lawyer",
        "consequences",
        "must pay",
        "required to pay",
        "demand",
        "collections"
    ]

    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def generate_reminder(
        self,
        amount: Decimal,
        days_overdue: int,
        tone: str,
        previous_reminders: int = 0
    ) -> str:
        """
        Generate a polite payment reminder using AI

        Args:
            amount: Invoice amount
            days_overdue: Number of days overdue
            tone: One of 'friendly', 'neutral', 'firm'
            previous_reminders: Number of previous reminders sent

        Returns:
            Generated reminder text (max 100 words)

        Raises:
            ValueError: If generated text contains prohibited language
        """
        system_prompt = """You are drafting a polite payment reminder for a small business.

STRICT RULES:
- You must NOT imply legal action, penalties, deadlines, or threats
- Tone must be professional, calm, and neutral
- Maximum 100 words
- Plain text only, no formatting
- Do NOT include specific dates
- Do NOT mention consequences
- Do NOT use modal verbs like "must" or "required"
- Focus on gentle reminder and maintaining good relationship"""

        user_message = f"""Draft a {tone} payment reminder with these details:
- Amount: £{amount}
- Days overdue: {days_overdue}
- Previous reminders sent: {previous_reminders}

Remember: Keep it polite, professional, and non-threatening."""

        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=150,
                    temperature=0.7
                )

                generated_text = response.choices[0].message.content.strip()

                # Check for prohibited language
                if self._contains_prohibited_language(generated_text):
                    if attempt < max_attempts - 1:
                        continue  # Regenerate
                    else:
                        raise ValueError("Generated text contains prohibited language after multiple attempts")

                # Validate length
                word_count = len(generated_text.split())
                if word_count > 100:
                    generated_text = ' '.join(generated_text.split()[:100]) + '...'

                return generated_text

            except Exception as e:
                if attempt == max_attempts - 1:
                    raise
                continue

        raise ValueError("Failed to generate acceptable reminder after maximum attempts")

    def _contains_prohibited_language(self, text: str) -> bool:
        """Check if text contains any prohibited phrases"""
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in self.PROHIBITED_PHRASES)
