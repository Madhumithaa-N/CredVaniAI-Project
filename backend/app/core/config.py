import os
import re
import secrets
from functools import lru_cache
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

_RUNTIME_ACCESS_FALLBACK = secrets.token_urlsafe(48)
_RUNTIME_REFRESH_FALLBACK = secrets.token_urlsafe(48)


class Settings:
    APP_NAME: str = "CredVaniAI API"
    API_PREFIX: str = ""

    # Microsoft SQL Server Settings
    MSSQL_SERVER: str = os.getenv("MSSQL_SERVER", "localhost")
    MSSQL_PORT: int = int(os.getenv("MSSQL_PORT", "1433"))
    MSSQL_DATABASE: str = os.getenv("MSSQL_DATABASE", "CredVaniAI_DB")
    MSSQL_AUTH_MODE: str = os.getenv("MSSQL_AUTH_MODE", "sql").lower()  # "sql" | "windows"
    MSSQL_USER: str = os.getenv("MSSQL_USER", "")
    MSSQL_PASSWORD: str = os.getenv("MSSQL_PASSWORD", "")
    MSSQL_DRIVER: str = os.getenv("MSSQL_DRIVER", "ODBC Driver 18 for SQL Server")
    MSSQL_TRUST_SERVER_CERTIFICATE: str = os.getenv("MSSQL_TRUST_SERVER_CERTIFICATE", "yes")
    MSSQL_POOL_SIZE: int = int(os.getenv("MSSQL_POOL_SIZE", "10"))
    MSSQL_MAX_OVERFLOW: int = int(os.getenv("MSSQL_MAX_OVERFLOW", "20"))

    # JWT Settings (never hardcoded secrets)
    JWT_ACCESS_SECRET: str = os.getenv("JWT_ACCESS_SECRET") or _RUNTIME_ACCESS_FALLBACK
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET") or _RUNTIME_REFRESH_FALLBACK
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "14"))

    # Verification Provider ("console" | "smtp" | "twilio")
    OTP_PROVIDER_MODE: str = os.getenv("OTP_PROVIDER_MODE", "console")

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]

    @property
    def validated_database_name(self) -> str:
        if not re.fullmatch(r"[A-Za-z0-9_]{1,64}", self.MSSQL_DATABASE):
            raise ValueError("Invalid MSSQL_DATABASE identifier.")
        return self.MSSQL_DATABASE

    def build_odbc_string(self, database: str | None = None) -> str:
        db_name = database or self.validated_database_name
        parts = [
            f"DRIVER={{{self.MSSQL_DRIVER}}}",
            f"SERVER={self.MSSQL_SERVER},{self.MSSQL_PORT}",
            f"DATABASE={db_name}",
            "Encrypt=yes",
            f"TrustServerCertificate={self.MSSQL_TRUST_SERVER_CERTIFICATE}",
        ]
        if self.MSSQL_AUTH_MODE == "windows":
            parts.append("Trusted_Connection=yes")
        else:
            if not self.MSSQL_USER or not self.MSSQL_PASSWORD:
                raise RuntimeError(
                    "MSSQL_USER and MSSQL_PASSWORD must be configured when MSSQL_AUTH_MODE=sql."
                )
            parts.append(f"UID={self.MSSQL_USER}")
            parts.append(f"PWD={self.MSSQL_PASSWORD}")
        return ";".join(parts)

    @property
    def sqlalchemy_database_url(self) -> str:
        override = os.getenv("DATABASE_URL")
        if override:
            return override
        odbc_str = self.build_odbc_string(self.validated_database_name)
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(odbc_str)}"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
