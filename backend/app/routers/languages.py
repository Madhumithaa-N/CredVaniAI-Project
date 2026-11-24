from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import SupportedLanguage

router = APIRouter(prefix="/languages", tags=["Languages"])


@router.get("")
def list_supported_languages(db: Session = Depends(get_db)):
    rows = (
        db.query(SupportedLanguage)
        .filter(SupportedLanguage.is_enabled.is_(True))
        .order_by(SupportedLanguage.display_order.asc())
        .all()
    )
    return [
        {
            "language_id": row.language_id,
            "language_code": row.language_code,
            "language_name": row.language_name,
            "native_name": row.native_name,
            "is_enabled": row.is_enabled,
            "is_rtl": row.is_rtl,
        }
        for row in rows
    ]
