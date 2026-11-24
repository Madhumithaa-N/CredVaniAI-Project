import re
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

SUPPORTED_LANGUAGE_CODES = (
    "en", "kn", "ta", "hi", "te", "ml", "mr", "ur", "bn", "gu", "pa", "or", "as", "kok"
)

LanguageCode = Literal[
    "en", "kn", "ta", "hi", "te", "ml", "mr", "ur", "bn", "gu", "pa", "or", "as", "kok"
]


def normalize_indian_mobile(value: str) -> str:
    digits = re.sub(r"\D", "", value.strip())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise ValueError("Mobile number must be a valid 10-digit Indian mobile number.")
    return digits


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=16)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    preferred_language: LanguageCode = "kn"
    consent_accepted: bool

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return cleaned

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_indian_mobile(v)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must include at least one letter and one number.")
        return v

    @field_validator("consent_accepted")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Terms and privacy consent must be accepted.")
        return v


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)
    remember_me: bool = False


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=255)


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=6, max_length=255)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_pw(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must include at least one letter and one number.")
        return v


class VerifyOtpRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=255)
    otp_code: str = Field(..., min_length=6, max_length=6)


class UserProfileOut(BaseModel):
    age: Optional[int] = None
    occupation: Optional[str] = None
    monthly_income: Optional[float] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    user_category: Optional[str] = "general"


class UserOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    mobile_number: str
    preferred_language: str
    is_verified: bool
    created_at: datetime
    profile: Optional[UserProfileOut] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut
    verification_notice: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    age: Optional[int] = Field(None, ge=18, le=100)
    occupation: Optional[str] = Field(None, max_length=120)
    monthly_income: Optional[float] = Field(None, ge=0, le=100000000)
    employment_type: Optional[str] = Field(None, max_length=64)
    location: Optional[str] = Field(None, max_length=120)
    user_category: Optional[str] = Field(None, max_length=64)


class LanguagePreferenceUpdate(BaseModel):
    preferred_language: LanguageCode


class LoanPreferenceCreate(BaseModel):
    loan_category: str = Field(..., min_length=2, max_length=64)
    requested_amount: float = Field(..., gt=0)
    loan_purpose: Optional[str] = Field(None, max_length=255)
    preferred_tenure: int = Field(..., ge=3, le=360)


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    language: LanguageCode = "kn"
    conversation_id: Optional[int] = None
