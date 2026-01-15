from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


async def require_active_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Verify user has an active subscription"""
    from app.models.business import Business, SubscriptionStatus

    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business or business.subscription_status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active subscription required to send reminders"
        )

    return current_user
