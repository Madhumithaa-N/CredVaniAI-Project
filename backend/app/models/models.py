from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Unicode,
    UnicodeText,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SupportedLanguage(Base):
    __tablename__ = "SupportedLanguages"

    language_id = Column(Integer, primary_key=True, autoincrement=True)
    language_code = Column(String(16), unique=True, nullable=False, index=True)
    language_name = Column(Unicode(64), nullable=False)
    native_name = Column(Unicode(64), nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True)
    is_rtl = Column(Boolean, nullable=False, default=False)
    display_order = Column(Integer, nullable=False, default=100)


class User(Base):
    __tablename__ = "Users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(Unicode(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile_number = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(512), nullable=False)
    preferred_language = Column(String(16), nullable=False, default="kn")
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    loan_preferences = relationship("UserLoanPreference", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "UserProfiles"

    profile_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    age = Column(Integer, nullable=True)
    occupation = Column(Unicode(120), nullable=True)
    monthly_income = Column(Numeric(14, 2), nullable=True)
    employment_type = Column(String(64), nullable=True)
    location = Column(Unicode(120), nullable=True)
    user_category = Column(String(64), nullable=True, default="general")
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="profile")


class LoanCategory(Base):
    __tablename__ = "LoanCategories"

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_slug = Column(String(64), unique=True, nullable=False, index=True)
    category_name = Column(Unicode(120), nullable=False)
    description = Column(UnicodeText, nullable=False)
    icon = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="active")

    products = relationship("LoanProduct", back_populates="category", cascade="all, delete-orphan")


class LoanProduct(Base):
    __tablename__ = "LoanProducts"

    loan_id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("LoanCategories.category_id", ondelete="CASCADE"), nullable=False, index=True)
    lender_name = Column(Unicode(150), nullable=False)
    loan_name = Column(Unicode(180), nullable=False)
    interest_rate = Column(Float, nullable=False)
    minimum_amount = Column(Numeric(14, 2), nullable=False)
    maximum_amount = Column(Numeric(14, 2), nullable=False)
    maximum_tenure = Column(Integer, nullable=False)  # in months
    eligibility_criteria = Column(UnicodeText, nullable=False)
    processing_fee = Column(Unicode(120), nullable=False)
    official_source_url = Column(String(500), nullable=False)
    last_verified_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    category = relationship("LoanCategory", back_populates="products")


class UserLoanPreference(Base):
    __tablename__ = "UserLoanPreferences"

    preference_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    loan_category = Column(String(64), nullable=False)
    requested_amount = Column(Numeric(14, 2), nullable=False)
    loan_purpose = Column(Unicode(255), nullable=True)
    preferred_tenure = Column(Integer, nullable=False)  # in months
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    user = relationship("User", back_populates="loan_preferences")


class ChatConversation(Base):
    __tablename__ = "ChatConversations"

    conversation_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=True, index=True)
    language = Column(String(16), nullable=False, default="kn")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "ChatMessages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("ChatConversations.conversation_id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # 'user' | 'ai'
    message = Column(UnicodeText, nullable=False)
    language = Column(String(16), nullable=False, default="kn")
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    conversation = relationship("ChatConversation", back_populates="messages")


class RefreshToken(Base):
    __tablename__ = "RefreshTokens"

    token_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    user = relationship("User", back_populates="refresh_tokens")


class OtpVerificationToken(Base):
    __tablename__ = "OtpVerificationTokens"

    otp_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(16), nullable=False)  # 'email' | 'mobile'
    target = Column(String(255), nullable=False)
    otp_hash = Column(String(128), nullable=False)
    purpose = Column(String(32), nullable=False, default="verify_account")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class PasswordResetToken(Base):
    __tablename__ = "PasswordResetTokens"

    reset_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


Index("ix_loan_products_category_rate", LoanProduct.category_id, LoanProduct.interest_rate)
Index("ix_chat_messages_conv_time", ChatMessage.conversation_id, ChatMessage.timestamp)
