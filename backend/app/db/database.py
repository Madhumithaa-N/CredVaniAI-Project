import pyodbc
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool

from app.core.config import get_settings

settings = get_settings()

Base = declarative_base()


def ensure_database_exists() -> None:
    """
    Connect to SQL Server 'master' database via pyodbc and create CredVaniAI_DB if missing.
    Uses validated identifier because CREATE DATABASE does not accept bind parameters in T-SQL.
    """
    db_name = settings.validated_database_name
    master_conn_str = settings.build_odbc_string(database="master")
    with pyodbc.connect(master_conn_str, autocommit=True) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT database_id FROM sys.databases WHERE name = ?",
            (db_name,),
        )
        row = cursor.fetchone()
        if not row:
            cursor.execute(f"CREATE DATABASE [{db_name}];")


engine = create_engine(
    settings.sqlalchemy_database_url,
    poolclass=QueuePool,
    pool_size=settings.MSSQL_POOL_SIZE,
    max_overflow=settings.MSSQL_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=1800,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
