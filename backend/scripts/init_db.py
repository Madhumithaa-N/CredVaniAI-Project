from app.db.database import Base, SessionLocal, engine, ensure_database_exists
from app.services.seed import seed_initial_data


def main() -> None:
    print("Ensuring Microsoft SQL Server database CredVaniAI_DB exists...")
    ensure_database_exists()
    print("Creating tables via SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding 14 SupportedLanguages, 10 LoanCategories, and LoanProducts...")
        seed_initial_data(db)
        print("Initialization complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
