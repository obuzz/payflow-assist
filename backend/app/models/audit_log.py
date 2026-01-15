from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String, nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    payload_snapshot = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Note: Audit logs are immutable - no updates or deletes allowed
