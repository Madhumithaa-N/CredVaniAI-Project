"""Initial CredVaniAI Microsoft SQL Server schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "SupportedLanguages",
        sa.Column("language_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("language_code", sa.String(length=16), nullable=False),
        sa.Column("language_name", sa.Unicode(length=64), nullable=False),
        sa.Column("native_name", sa.Unicode(length=64), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_rtl", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default=sa.text("100")),
        sa.PrimaryKeyConstraint("language_id"),
        sa.UniqueConstraint("language_code"),
    )
    op.create_index("ix_SupportedLanguages_language_code", "SupportedLanguages", ["language_code"])

    op.create_table(
        "Users",
        sa.Column("user_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("full_name", sa.Unicode(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("mobile_number", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("preferred_language", sa.String(length=16), nullable=False, server_default="kn"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("mobile_number"),
    )
    op.create_index("ix_Users_email", "Users", ["email"])
    op.create_index("ix_Users_mobile_number", "Users", ["mobile_number"])

    op.create_table(
        "UserProfiles",
        sa.Column("profile_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("occupation", sa.Unicode(length=120), nullable=True),
        sa.Column("monthly_income", sa.Numeric(14, 2), nullable=True),
        sa.Column("employment_type", sa.String(length=64), nullable=True),
        sa.Column("location", sa.Unicode(length=120), nullable=True),
        sa.Column("user_category", sa.String(length=64), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["Users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("profile_id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "LoanCategories",
        sa.Column("category_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("category_slug", sa.String(length=64), nullable=False),
        sa.Column("category_name", sa.Unicode(length=120), nullable=False),
        sa.Column("description", sa.UnicodeText(), nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("category_id"),
        sa.UniqueConstraint("category_slug"),
    )

    op.create_table(
        "LoanProducts",
        sa.Column("loan_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("lender_name", sa.Unicode(length=150), nullable=False),
        sa.Column("loan_name", sa.Unicode(length=180), nullable=False),
        sa.Column("interest_rate", sa.Float(), nullable=False),
        sa.Column("minimum_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("maximum_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("maximum_tenure", sa.Integer(), nullable=False),
        sa.Column("eligibility_criteria", sa.UnicodeText(), nullable=False),
        sa.Column("processing_fee", sa.Unicode(length=120), nullable=False),
        sa.Column("official_source_url", sa.String(length=500), nullable=False),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["LoanCategories.category_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("loan_id"),
    )
    op.create_index("ix_loan_products_category_rate", "LoanProducts", ["category_id", "interest_rate"])

    op.create_table(
        "UserLoanPreferences",
        sa.Column("preference_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("loan_category", sa.String(length=64), nullable=False),
        sa.Column("requested_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("loan_purpose", sa.Unicode(length=255), nullable=True),
        sa.Column("preferred_tenure", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["Users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("preference_id"),
    )

    op.create_table(
        "ChatConversations",
        sa.Column("conversation_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["Users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("conversation_id"),
    )

    op.create_table(
        "ChatMessages",
        sa.Column("message_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("conversation_id", sa.Integer(), nullable=False),
        sa.Column("sender", sa.String(length=20), nullable=False),
        sa.Column("message", sa.UnicodeText(), nullable=False),
        sa.Column("language", sa.String(length=16), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["ChatConversations.conversation_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("message_id"),
    )
    op.create_index("ix_chat_messages_conv_time", "ChatMessages", ["conversation_id", "timestamp"])

    op.create_table(
        "RefreshTokens",
        sa.Column("token_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["Users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token_id"),
        sa.UniqueConstraint("token_hash"),
    )

    op.create_table(
        "OtpVerificationTokens",
        sa.Column("otp_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("channel", sa.String(length=16), nullable=False),
        sa.Column("target", sa.String(length=255), nullable=False),
        sa.Column("otp_hash", sa.String(length=128), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["Users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("otp_id"),
    )

    op.create_table(
        "PasswordResetTokens",
        sa.Column("reset_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["Users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("reset_id"),
        sa.UniqueConstraint("token_hash"),
    )


def downgrade() -> None:
    for table in [
        "PasswordResetTokens",
        "OtpVerificationTokens",
        "RefreshTokens",
        "ChatMessages",
        "ChatConversations",
        "UserLoanPreferences",
        "LoanProducts",
        "LoanCategories",
        "UserProfiles",
        "Users",
        "SupportedLanguages",
    ]:
        op.drop_table(table)
