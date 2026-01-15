from sqlalchemy.orm import Session
from uuid import UUID
from app.models.audit_log import AuditLog


class AuditService:
    """Service for creating immutable audit logs"""

    def __init__(self, db: Session):
        self.db = db

    def log_action(self, action: str, actor_id: UUID, payload: dict) -> AuditLog:
        """
        Create an immutable audit log entry

        Args:
            action: The action being logged (e.g., 'draft_generated', 'draft_sent')
            actor_id: UUID of the user performing the action
            payload: Snapshot of relevant data at time of action
        """
        audit_log = AuditLog(
            action=action,
            actor_id=actor_id,
            payload_snapshot=payload
        )
        self.db.add(audit_log)
        self.db.commit()
        return audit_log
