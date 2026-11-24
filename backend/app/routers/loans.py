from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import LoanCategory, LoanProduct

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.get("/categories")
def get_loan_categories(db: Session = Depends(get_db)):
    cats = db.query(LoanCategory).filter_by(status="active").order_by(LoanCategory.category_id.asc()).all()
    return [
        {
            "category_id": c.category_id,
            "category_slug": c.category_slug,
            "category_name": c.category_name,
            "description": c.description,
            "icon": c.icon,
            "status": c.status,
        }
        for c in cats
    ]


@router.get("")
def list_loan_products(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(LoanProduct).join(LoanCategory)
    if category:
        query = query.filter(LoanCategory.category_slug == category)
    rows = query.order_by(LoanProduct.interest_rate.asc()).all()
    return [
        {
            "loan_id": p.loan_id,
            "category_id": p.category_id,
            "category_slug": p.category.category_slug,
            "lender_name": p.lender_name,
            "loan_name": p.loan_name,
            "interest_rate": p.interest_rate,
            "minimum_amount": float(p.minimum_amount),
            "maximum_amount": float(p.maximum_amount),
            "maximum_tenure": p.maximum_tenure,
            "eligibility_criteria": p.eligibility_criteria,
            "processing_fee": p.processing_fee,
            "official_source_url": p.official_source_url,
            "last_verified_at": p.last_verified_at,
        }
        for p in rows
    ]


@router.get("/{loan_id}")
def get_loan_product(loan_id: int, db: Session = Depends(get_db)):
    p = db.query(LoanProduct).filter_by(loan_id=loan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail={"code": "LOAN_NOT_FOUND", "message": "Loan product not found."})
    return {
        "loan_id": p.loan_id,
        "category_id": p.category_id,
        "category_slug": p.category.category_slug,
        "lender_name": p.lender_name,
        "loan_name": p.loan_name,
        "interest_rate": p.interest_rate,
        "minimum_amount": float(p.minimum_amount),
        "maximum_amount": float(p.maximum_amount),
        "maximum_tenure": p.maximum_tenure,
        "eligibility_criteria": p.eligibility_criteria,
        "processing_fee": p.processing_fee,
        "official_source_url": p.official_source_url,
        "last_verified_at": p.last_verified_at,
    }
