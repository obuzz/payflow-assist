import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.models.user import User


class EmailService:
    """Service for sending payment reminder emails"""

    def send_reminder(self, to_email: str, from_user: User, body: str):
        """
        Send a payment reminder email

        Args:
            to_email: Recipient email address
            from_user: User sending the email
            body: Email body text (approved reminder draft)

        Raises:
            Exception: If email sending fails
        """
        # Create message
        message = MIMEMultipart()
        message['From'] = from_user.email
        message['To'] = to_email
        message['Subject'] = "Invoice reminder"

        # Add body
        message.attach(MIMEText(body, 'plain'))

        try:
            # Use SMTP fallback (Gmail SMTP)
            # For production, implement Gmail OAuth flow
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                self._send_via_smtp(message, to_email)
            else:
                raise ValueError("Email credentials not configured")

        except Exception as e:
            raise Exception(f"Failed to send email: {str(e)}")

    def _send_via_smtp(self, message: MIMEMultipart, to_email: str):
        """Send email via SMTP"""
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)

    def _send_via_gmail_oauth(self, message: MIMEMultipart, to_email: str):
        """
        Send email via Gmail OAuth (not implemented in MVP)

        For production implementation:
        1. Use google-auth-oauthlib for OAuth flow
        2. Store refresh tokens per user
        3. Use gmail API to send messages
        """
        # TODO: Implement Gmail OAuth flow
        # from googleapiclient.discovery import build
        # from google.oauth2.credentials import Credentials
        pass
