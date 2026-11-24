from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.database import Base, SessionLocal, engine, ensure_database_exists
from app.routers import auth, chat, languages, loans, users
from app.services.seed import seed_initial_data

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_database_exists()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(languages.router)
app.include_router(loans.router)
app.include_router(chat.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "database": settings.MSSQL_DATABASE}
