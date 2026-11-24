from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_user, get_optional_user
from app.db.database import get_db
from app.models.models import ChatConversation, ChatMessage, User
from app.schemas.schemas import ChatMessageRequest

router = APIRouter(prefix="/chat", tags=["Multilingual AI Advisor"])
settings = get_settings()

LANGUAGE_NAME_MAP = {
    "en": "English",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ta": "Tamil (தமிழ்)",
    "hi": "Hindi (हिन्दी)",
    "te": "Telugu (తెలుగు)",
    "ml": "Malayalam (മലയാളം)",
    "mr": "Marathi (मराठी)",
    "ur": "Urdu (اردو)",
    "bn": "Bengali (বাংলা)",
    "gu": "Gujarati (ગુજરાતી)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "as": "Assamese (অসমীয়া)",
    "kok": "Konkani (कोंकणी)",
}


@router.post("/message")
def send_chat_message(
    payload: ChatMessageRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={"code": "GEMINI_API_KEY_MISSING", "message": "GEMINI_API_KEY is not configured on the server."},
        )

    conv: Optional[ChatConversation] = None
    if payload.conversation_id:
        conv = db.query(ChatConversation).filter_by(conversation_id=payload.conversation_id).first()
        if conv and conv.user_id and (not current_user or conv.user_id != current_user.user_id):
            raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Access denied."})

    if not conv:
        conv = ChatConversation(
            user_id=current_user.user_id if current_user else None,
            language=payload.language,
        )
        db.add(conv)
        db.flush()

    user_msg = ChatMessage(
        conversation_id=conv.conversation_id,
        sender="user",
        message=payload.message,
        language=payload.language,
    )
    db.add(user_msg)
    db.flush()

    target_lang = LANGUAGE_NAME_MAP.get(payload.language, "English")
    system_prompt = (
        f"You are CredVani AI, a trusted Indian multilingual financial and loan advisor. "
        f"Respond EXCLUSIVELY in {target_lang}. "
        f"Do NOT mix unnecessary English sentences or add English translations underneath. "
        f"Only keep unavoidable official bank names (SBI, HDFC, ICICI, Axis, NABARD), URLs, and standard identifiers (EMI, CIBIL, KCC, MSME, FOIR, APR). "
        f"Explain interest rates, eligibility criteria, processing fees, repayment tenure, and relevant Indian government schemes (PMAY, MUDRA, CGTMSE, Stand-Up India, KCC, NHFDC Divyangjan) in simple, friendly everyday regional language."
    )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        ai_resp = client.models.generate_content(
            model="gemini-4-hydrogen",
            contents=payload.message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )
        reply_text = (ai_resp.text or "").strip()
        if not reply_text:
            raise RuntimeError("Empty model response.")
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail={"code": "AI_UPSTREAM_ERROR", "message": str(exc)})

    ai_msg = ChatMessage(
        conversation_id=conv.conversation_id,
        sender="ai",
        message=reply_text,
        language=payload.language,
    )
    db.add(ai_msg)
    db.commit()

    return {
        "conversation_id": conv.conversation_id,
        "language": payload.language,
        "reply": reply_text,
        "timestamp": ai_msg.timestamp,
    }


@router.get("/conversations")
def list_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(ChatConversation)
        .filter_by(user_id=current_user.user_id)
        .order_by(ChatConversation.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "conversation_id": c.conversation_id,
            "language": c.language,
            "created_at": c.created_at,
            "messages": [
                {
                    "message_id": m.message_id,
                    "sender": m.sender,
                    "message": m.message,
                    "language": m.language,
                    "timestamp": m.timestamp,
                }
                for m in c.messages
            ],
        }
        for c in convs
    ]
