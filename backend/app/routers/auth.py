from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    digest_token,
    generate_otp_code,
    generate_reset_token,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.models.models import (
    OtpVerificationToken,
    PasswordResetToken,
    RefreshToken,
    User,
    UserProfile,
)
from app.schemas.schemas import (
    AuthTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserOut,
    UserProfileOut,
    VerifyOtpRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


def _serialize_user(user: User) -> UserOut:
    prof = user.profile
    return UserOut(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        mobile_number=user.mobile_number,
        preferred_language=user.preferred_language,
        is_verified=user.is_verified,
        created_at=user.created_at,
        profile=UserProfileOut(
            age=prof.age if prof else None,
            occupation=prof.occupation if prof else None,
            monthly_income=float(prof.monthly_income) if prof and prof.monthly_income is not None else None,
            employment_type=prof.employment_type if prof else None,
            location=prof.location if prof else None,
            user_category=prof.user_category if prof else "general",
        ),
    )


def _issue_session_tokens(db: Session, user: User, response: Response, remember_me: bool) -> tuple[str, str]:
    access_token = create_access_token(user.user_id, user.preferred_language)
    refresh_token, expires_at = create_refresh_token(user.user_id)
    db.add(
        RefreshToken(
            user_id=user.user_id,
            token_hash=digest_token(refresh_token),
            expires_at=expires_at,
        )
    )
    db.commit()

    max_age = settings.JWT_REFRESH_EXPIRE_DAYS * 86400 if remember_me else None
    response.set_cookie(
        key="credvani_refresh",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=max_age,
        path="/",
    )
    return access_token, refresh_token


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "PASSWORD_MISMATCH", "message": "Passwords do not match."},
        )

    normalized_email = payload.email.strip().lower()
    existing = (
        db.query(User)
        .filter(or_(User.email == normalized_email, User.mobile_number == payload.mobile_number))
        .first()
    )
    if existing:
        if existing.email == normalized_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DUPLICATE_EMAIL", "message": "Email address is already registered."},
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_MOBILE", "message": "Mobile number is already registered."},
        )

    user = User(
        full_name=payload.full_name,
        email=normalized_email,
        mobile_number=payload.mobile_number,
        password_hash=hash_password(payload.password),
        preferred_language=payload.preferred_language,
        is_verified=False,
    )
    db.add(user)
    db.flush()

    db.add(UserProfile(user_id=user.user_id, user_category="general"))

    otp_code = generate_otp_code()
    db.add(
        OtpVerificationToken(
            user_id=user.user_id,
            channel="email",
            target=normalized_email,
            otp_hash=digest_token(otp_code),
            purpose="verify_account",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
    )
    db.commit()
    db.refresh(user)

    access_token, refresh_token = _issue_session_tokens(db, user, response, remember_me=True)
    notice = (
        f"Verification OTP dispatched via {settings.OTP_PROVIDER_MODE} provider."
        if settings.OTP_PROVIDER_MODE != "console"
        else f"Console verification mode active (OTP: {otp_code})."
    )
    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_serialize_user(user),
        verification_notice=notice,
    )


@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    user = db.query(User).filter(or_(User.email == ident, User.mobile_number == ident)).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "Account not found."})

    token_row = (
        db.query(OtpVerificationToken)
        .filter(
            OtpVerificationToken.user_id == user.user_id,
            OtpVerificationToken.consumed_at.is_(None),
            OtpVerificationToken.otp_hash == digest_token(payload.otp_code),
        )
        .order_by(OtpVerificationToken.created_at.desc())
        .first()
    )
    if not token_row or token_row.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail={"code": "INVALID_OTP", "message": "Invalid or expired OTP."})

    token_row.consumed_at = datetime.now(timezone.utc)
    user.is_verified = True
    db.commit()
    return {"verified": True, "user": _serialize_user(user)}


@router.post("/login", response_model=AuthTokenResponse)
def login_user(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    user = db.query(User).filter(or_(User.email == ident, User.mobile_number == ident)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email/mobile number or password."},
        )

    access_token, refresh_token = _issue_session_tokens(db, user, response, remember_me=payload.remember_me)
    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_serialize_user(user),
    )


@router.post("/refresh", response_model=AuthTokenResponse)
def refresh_session(payload: RefreshRequest, response: Response, db: Session = Depends(get_db)):
    raw_token = payload.refresh_token
    if not raw_token:
        raise HTTPException(status_code=401, detail={"code": "MISSING_REFRESH_TOKEN", "message": "Refresh token required."})

    decoded = decode_refresh_token(raw_token)
    token_row = db.query(RefreshToken).filter_by(token_hash=digest_token(raw_token)).first()
    if not token_row or token_row.revoked_at is not None:
        raise HTTPException(status_code=401, detail={"code": "REVOKED_REFRESH_TOKEN", "message": "Session expired or revoked."})

    user = db.query(User).filter_by(user_id=int(decoded["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail={"code": "USER_NOT_FOUND", "message": "User not found."})

    token_row.revoked_at = datetime.now(timezone.utc)
    access_token, new_refresh = _issue_session_tokens(db, user, response, remember_me=True)
    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=_serialize_user(user),
    )


@router.post("/logout")
def logout_user(payload: LogoutRequest, response: Response, db: Session = Depends(get_db)):
    if payload.refresh_token:
        token_row = db.query(RefreshToken).filter_by(token_hash=digest_token(payload.refresh_token)).first()
        if token_row and token_row.revoked_at is None:
            token_row.revoked_at = datetime.now(timezone.utc)
            db.commit()

    response.delete_cookie("credvani_refresh", path="/")
    return {"logged_out": True}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    user = db.query(User).filter(or_(User.email == ident, User.mobile_number == ident)).first()
    if not user:
        return {"message": "If an account exists, password reset instructions have been issued."}

    raw_reset = generate_reset_token()
    db.add(
        PasswordResetToken(
            user_id=user.user_id,
            token_hash=digest_token(raw_reset),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
    )
    db.commit()

    result = {"message": "Password reset instructions generated."}
    if settings.OTP_PROVIDER_MODE == "console":
        result["reset_token_preview"] = raw_reset
    return result


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=422,
            detail={"code": "PASSWORD_MISMATCH", "message": "Passwords do not match."},
        )

    token_row = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == digest_token(payload.token.strip()),
            PasswordResetToken.used_at.is_(None),
        )
        .first()
    )
    if not token_row or token_row.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_RESET_TOKEN", "message": "Invalid or expired password reset token."},
        )

    user = db.query(User).filter_by(user_id=token_row.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found."})

    user.password_hash = hash_password(payload.new_password)
    token_row.used_at = datetime.now(timezone.utc)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.user_id, RefreshToken.revoked_at.is_(None)
    ).update({"revoked_at": datetime.now(timezone.utc)})
    db.commit()
    return {"reset": True}
