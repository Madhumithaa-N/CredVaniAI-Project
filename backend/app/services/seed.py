from sqlalchemy.orm import Session

from app.models.models import LoanCategory, LoanProduct, SupportedLanguage

SUPPORTED_LANGUAGES_SEED = [
    {"language_code": "en", "language_name": "English", "native_name": "English", "is_enabled": True, "is_rtl": False, "display_order": 1},
    {"language_code": "kn", "language_name": "Kannada", "native_name": "ಕನ್ನಡ", "is_enabled": True, "is_rtl": False, "display_order": 2},
    {"language_code": "ta", "language_name": "Tamil", "native_name": "தமிழ்", "is_enabled": True, "is_rtl": False, "display_order": 3},
    {"language_code": "hi", "language_name": "Hindi", "native_name": "हिन्दी", "is_enabled": True, "is_rtl": False, "display_order": 4},
    {"language_code": "te", "language_name": "Telugu", "native_name": "తెలుగు", "is_enabled": True, "is_rtl": False, "display_order": 5},
    {"language_code": "ml", "language_name": "Malayalam", "native_name": "മലയാളം", "is_enabled": True, "is_rtl": False, "display_order": 6},
    {"language_code": "mr", "language_name": "Marathi", "native_name": "मराठी", "is_enabled": True, "is_rtl": False, "display_order": 7},
    {"language_code": "ur", "language_name": "Urdu", "native_name": "اردو", "is_enabled": True, "is_rtl": True, "display_order": 8},
    {"language_code": "bn", "language_name": "Bengali", "native_name": "বাংলা", "is_enabled": True, "is_rtl": False, "display_order": 9},
    {"language_code": "gu", "language_name": "Gujarati", "native_name": "ગુજરાતી", "is_enabled": True, "is_rtl": False, "display_order": 10},
    {"language_code": "pa", "language_name": "Punjabi", "native_name": "ਪੰਜਾਬੀ", "is_enabled": True, "is_rtl": False, "display_order": 11},
    {"language_code": "or", "language_name": "Odia", "native_name": "ଓଡ଼ିଆ", "is_enabled": True, "is_rtl": False, "display_order": 12},
    {"language_code": "as", "language_name": "Assamese", "native_name": "অসমীয়া", "is_enabled": True, "is_rtl": False, "display_order": 13},
    {"language_code": "kok", "language_name": "Konkani", "native_name": "कोंकणी", "is_enabled": True, "is_rtl": False, "display_order": 14},
]

LOAN_CATEGORIES_SEED = [
    {"category_slug": "personal", "category_name": "Personal Loans", "description": "Unsecured credit for medical, wedding, travel, and immediate household requirements.", "icon": "UserCheck"},
    {"category_slug": "home", "category_name": "Home Loans", "description": "Repo-linked long-term housing finance for purchase, construction, and balance transfer.", "icon": "Home"},
    {"category_slug": "education", "category_name": "Education Loans", "description": "Domestic and overseas higher-study financing with course moratorium and Sec 80E benefits.", "icon": "GraduationCap"},
    {"category_slug": "vehicle", "category_name": "Vehicle Loans", "description": "Auto financing for electric vehicles, cars, and two-wheelers with green concessions.", "icon": "Car"},
    {"category_slug": "business", "category_name": "Business / MSME Loans", "description": "MUDRA, CGTMSE collateral-free expansion capital, and GST-linked working credit.", "icon": "Briefcase"},
    {"category_slug": "gold", "category_name": "Gold Loans", "description": "Instant liquidity against household gold jewellery with zero income proof barrier.", "icon": "Coins"},
    {"category_slug": "lap", "category_name": "Loan Against Property", "description": "Unlock capital against residential or commercial property at lower spreads.", "icon": "Building2"},
    {"category_slug": "credit_line", "category_name": "Credit Cards / Credit Lines", "description": "Revolving UPI-linked credit lines and low-APR hybrid overdraft facilities.", "icon": "CreditCard"},
    {"category_slug": "women", "category_name": "Women-Focused Loans", "description": "Mahila Samman, Stand-Up India, and Mudra concessions with lower spreads for women borrowers.", "icon": "HeartHandshake"},
    {"category_slug": "disability", "category_name": "Loans for Persons with Disabilities", "description": "NHFDC Divyangjan Swavalamban & assistive-device concessional schemes at 4%–6% p.a.", "icon": "Accessibility"},
]

LOAN_PRODUCTS_SEED = [
    ("home", "State Bank of India (SBI)", "SBI Regular Repo-Linked Home Loan", 8.40, 300000, 50000000, 360, "CIBIL 700+, age 18–70, salaried or 2yr ITR", "0.35% (Max ₹10,000)", "https://homeloans.sbi/"),
    ("home", "Bank of Baroda", "Baroda Home Loan Advantage", 8.35, 300000, 50000000, 360, "CIBIL 701+, savings account linked offset", "Nil – ₹7,500", "https://www.bankofbaroda.in/"),
    ("personal", "HDFC Bank", "HDFC Xpress Personal Loan", 10.65, 50000, 4000000, 72, "CIBIL 720+, minimum ₹25,000 monthly income", "Up to ₹4,999", "https://www.hdfcbank.com/"),
    ("education", "State Bank of India (SBI)", "SBI Global Ed-Vantage Scheme", 8.50, 750000, 15000000, 180, "Confirmed admission to premier domestic/overseas university", "₹10,000 refundable", "https://sbi.co.in/"),
    ("vehicle", "ICICI Bank", "ICICI Green EV & Auto Loan", 8.75, 100000, 15000000, 84, "CIBIL 710+, salaried or self-employed ITR", "0.50% of loan", "https://www.icicibank.com/"),
    ("business", "SIDBI / Public Banks", "CGTMSE & Pradhan Mantri Mudra Tarun", 9.25, 50000, 20000000, 84, "Udyam registered MSME with 12m GST / banking trail", "0.50% – 1.00%", "https://www.udyamimitra.in/"),
    ("gold", "Muthoot / SBI Gold", "Instant Agri & Household Gold Loan", 8.70, 20000, 5000000, 36, "22-carat gold jewellery KYC, zero income proof", "0.25% – ₹500", "https://sbi.co.in/"),
    ("lap", "Axis Bank", "Axis Property Power LAP", 9.10, 500000, 50000000, 180, "Clear residential/commercial title & CIBIL 720+", "Up to 1.00%", "https://www.axisbank.com/"),
    ("credit_line", "Bajaj Finserv / HDFC", "Flexi Hybrid Credit Line", 11.20, 50000, 2500000, 60, "Pay interest only on utilized amount, CIBIL 700+", "1.00% annual", "https://www.bajajfinserv.in/"),
    ("women", "Stand-Up India / SBI", "Stand-Up India & Stree Shakti Loan", 8.25, 1000000, 10000000, 84, "Greenfield enterprise with ≥51% women shareholding", "Nil under priority", "https://www.standupmitra.in/"),
    ("disability", "NDFDC (Divyangjan)", "Divyangjan Swavalamban Yojana", 5.00, 50000, 5000000, 120, "40%+ UDID disability certificate, 1% women rebate", "Nil (Zero fee)", "https://www.nhfdc.nic.in/"),
]


def seed_initial_data(db: Session) -> None:
    for lang in SUPPORTED_LANGUAGES_SEED:
        existing = db.query(SupportedLanguage).filter_by(language_code=lang["language_code"]).first()
        if not existing:
            db.add(SupportedLanguage(**lang))

    category_map: dict[str, LoanCategory] = {}
    for cat in LOAN_CATEGORIES_SEED:
        existing = db.query(LoanCategory).filter_by(category_slug=cat["category_slug"]).first()
        if not existing:
            existing = LoanCategory(**cat, status="active")
            db.add(existing)
            db.flush()
        category_map[cat["category_slug"]] = existing

    for (slug, lender, name, rate, min_amt, max_amt, tenure, elig, fee, url) in LOAN_PRODUCTS_SEED:
        cat_obj = category_map.get(slug)
        if not cat_obj:
            continue
        exists = db.query(LoanProduct).filter_by(loan_name=name).first()
        if not exists:
            db.add(
                LoanProduct(
                    category_id=cat_obj.category_id,
                    lender_name=lender,
                    loan_name=name,
                    interest_rate=rate,
                    minimum_amount=min_amt,
                    maximum_amount=max_amt,
                    maximum_tenure=tenure,
                    eligibility_criteria=elig,
                    processing_fee=fee,
                    official_source_url=url,
                )
            )

    db.commit()
