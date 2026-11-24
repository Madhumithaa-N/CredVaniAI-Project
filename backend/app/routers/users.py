from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.models import SupportedLanguage, User, UserLoanPreference, UserProfile
from app.routers.auth import _serialize_user
from app.schemas.schemas import (
    LanguagePreferenceUpdate,
    LoanPreferenceCreate,
    UserOut,
    UserProfileUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)

    if payload.age is not None:
        profile.age = payload.age
    if payload.occupation is not None:
        profile.occupation = payload.occupation
    if payload.monthly_income is not None:
        profile.monthly_income = payload.monthly_income
    if payload.employment_type is not None:
        profile.employment_type = payload.employment_type
    if payload.location is not None:
        profile.location = payload.location
    if payload.user_category is not None:
        profile.user_category = payload.user_category

    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


@router.put("/me/language", response_model=UserOut)
def update_my_language(
    payload: LanguagePreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lang_exists = (
        db.query(SupportedLanguage)
        .filter_by(language_code=payload.preferred_language, is_enabled=True)
        .first()
    )
    if not lang_exists:
        raise HTTPException(status_code=400, detail={"code": "UNSUPPORTED_LANGUAGE", "message": "Language not enabled."})

    current_user.preferred_language = payload.preferred_language
    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


@router.get("/me/preferences")
def list_loan_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserLoanPreference)
        .filter_by(user_id=current_user.user_id)
        .order_by(UserLoanPreference.created_at.desc())
        .all()
    )
    return [
        {
            "preference_id": r.preference_id,
            "loan_category": r.loan_category,
            "requested_amount": float(r.requested_amount),
            "loan_purpose": r.loan_purpose,
            "preferred_tenure": r.preferred_tenure,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.post("/me/preferences")
def save_loan_preference(
    payload: LoanPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = UserLoanPreference(
        user_id=current_user.user_id,
        loan_category=payload.loan_category,
        requested_amount=payload.requested_amount,
        loan_purpose=payload.loan_purpose,
        preferred_tenure=payload.preferred_tenure,
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return {
        "preference_id": pref.preference_id,
        "loan_category": pref.loan_category,
        "requested_amount": float(pref.requested_amount),
        "loan_purpose": pref.loan_purpose,
        "preferred_tenure": pref.preferred_tenure,
        "created_at": pref.created_at,
    }
