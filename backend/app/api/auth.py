from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, UserRole
from app.models.business import Business
from app.schemas.auth import UserRegister, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    response: Response,
    db: Session = Depends(get_db)
):
    """Register a new user and business, then auto-login"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create business
    business = Business(
        name=user_data.business_name,
        industry_type=user_data.industry_type
    )
    db.add(business)
    db.flush()

    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        business_id=business.id,
        role=UserRole.OWNER
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-login: Create tokens and set cookies
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Set httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=1800  # 30 minutes
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=604800  # 7 days
    )

    return {
        "message": "User created successfully",
        "access_token": access_token,
        "refresh_token": refresh_token
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login and receive JWT tokens"""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Set httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=1800  # 30 minutes
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=604800  # 7 days
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Set new cookies
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=1800
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )


@router.post("/logout")
async def logout(response: Response):
    """Logout and clear cookies"""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
