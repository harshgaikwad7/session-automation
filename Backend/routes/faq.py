import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx

router = APIRouter()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# ── Pydantic Models ───────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str       # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]


# ── Static FAQ Data ───────────────────────────────────────────────────────────
# Matches exactly what the frontend FAQ_CATEGORIES expects

FAQ_DATA = [
    {
        "id": "registration",
        "icon": "📋",
        "label": "Registration",
        "color": "#8b5cf6",
        "faqs": [
            {
                "q": "How do I register for a session?",
                "a": "Go to the Register page, browse available sessions, click 'Register Now', confirm your details, and receive your unique Participant ID instantly."
            },
            {
                "q": "Can I register for multiple sessions?",
                "a": "Yes! You can register for as many sessions as you like. Each registration gives you a unique Participant ID. Your dashboard shows all your registrations in one place."
            },
            {
                "q": "What is a Participant ID?",
                "a": "A Participant ID (format: RF-XXXXXX) is your unique identifier for a session. It's used for attendance check-in, certificate generation, and tracking your participation history."
            },
            {
                "q": "Can I cancel my registration?",
                "a": "Yes, you can cancel up to 24 hours before the session starts. Go to My Dashboard → Your Sessions → Cancel. Your spot will be released for others."
            },
        ],
    },
    {
        "id": "attendance",
        "icon": "✅",
        "label": "Attendance",
        "color": "#22d3ee",
        "faqs": [
            {
                "q": "How does QR code check-in work?",
                "a": "When you register, a QR code is generated for your session. On the day, show this QR code to the conductor or scan it at the entrance kiosk. Your attendance is marked instantly."
            },
            {
                "q": "What if my QR code doesn't scan?",
                "a": "Use the OTP fallback — a 6-digit OTP is sent to your registered contact. Enter it on the Attendance page to check in manually. Contact a conductor if issues persist."
            },
            {
                "q": "Is RFID check-in available?",
                "a": "RFID check-in is available at select physical venues. Your RFID card (issued at the venue desk) links to your Participant ID for seamless entry."
            },
            {
                "q": "Can I mark attendance after the session ends?",
                "a": "No, attendance can only be marked during the active session window (typically ± 30 minutes of start time). Late check-ins require conductor approval."
            },
        ],
    },
    {
        "id": "certificates",
        "icon": "🏆",
        "label": "Certificates",
        "color": "#fb923c",
        "faqs": [
            {
                "q": "When do I receive my certificate?",
                "a": "Certificates are auto-generated within 30 minutes after session completion, provided your attendance was marked."
            },
            {
                "q": "How do I verify a certificate's authenticity?",
                "a": "Every certificate has a unique QR code. Scan it to be redirected to our verification portal which confirms name, session, date, and issuing organisation in real-time."
            },
            {
                "q": "Can I download my certificate as a PDF?",
                "a": "Yes! Go to Certificates page → select the session → click Download PDF. Certificates are A4 landscape format, print-ready at 300 DPI."
            },
            {
                "q": "What if my name is wrong on the certificate?",
                "a": "Contact the event admin within 7 days of issue. Go to My Dashboard → Certificates → Report Issue. Corrections are processed within 48 hours."
            },
        ],
    },
    {
        "id": "sessions",
        "icon": "📅",
        "label": "Sessions",
        "color": "#4ade80",
        "faqs": [
            {
                "q": "What is the difference between Online, Offline, and Hybrid sessions?",
                "a": "Online: fully virtual (Zoom/Teams link sent post-registration). Offline: in-person at listed venue. Hybrid: both options — choose at registration."
            },
            {
                "q": "How do I access session materials?",
                "a": "Go to the Content page after the session. PPTs, notes, and recordings are uploaded within 24 hours. Access is restricted to registered participants."
            },
            {
                "q": "Will sessions be recorded?",
                "a": "Most online and hybrid sessions are recorded (subject to speaker consent). Recordings are available on the Content page for 90 days post-session."
            },
            {
                "q": "How do I get reminders for upcoming sessions?",
                "a": "Reminders are automatically sent 24 hours and 1 hour before your registered sessions via email and/or WhatsApp based on your notification preferences."
            },
        ],
    },
]

SYSTEM_PROMPT = """You are the SessionFlow AI assistant — a helpful, concise support bot for a session management platform used by NGOs and civic organisations in India (Renovatio Foundation).

SessionFlow features:
- Session registration (online/offline/hybrid) with instant Participant IDs (format: RF-XXXXXX)
- QR code, OTP, and RFID attendance check-in
- Auto-generated, QR-verified PDF certificates (issued within 30 min of session end)
- Post-session quizzes with instant results and pass/fail scoring
- Feedback system with star ratings, tags, and analytics
- Content library (PPTs, notes, recordings) — restricted to registered participants
- Three roles: Participant, NGO Conductor, Admin
- Email & WhatsApp reminders (24h and 1h before sessions)
- AI-powered FAQ chatbot (that's you!)

Always answer in a friendly, helpful, concise tone. Use bullet points for multi-step answers. Keep responses under 120 words. If something is outside SessionFlow's scope, politely say so and suggest contacting the event admin at admin@renovatiofoundation.org."""


# ── GET /api/faq/categories ───────────────────────────────────────────────────
@router.get("/categories")
def get_faq_categories():
    """Returns all FAQ categories and their questions."""
    return {"categories": FAQ_DATA}


# ── GET /api/faq/search?q=... ─────────────────────────────────────────────────
@router.get("/search")
def search_faqs(q: str):
    """Search across all FAQ questions and answers."""
    if not q or len(q.strip()) < 2:
        return {"results": []}

    q_lower = q.lower()
    results = []

    for cat in FAQ_DATA:
        for faq in cat["faqs"]:
            if q_lower in faq["q"].lower() or q_lower in faq["a"].lower():
                results.append({
                    "q":              faq["q"],
                    "a":              faq["a"],
                    "category_id":    cat["id"],
                    "category_label": cat["label"],
                    "category_icon":  cat["icon"],
                    "category_color": cat["color"],
                })

    return {"results": results[:8]}


# ── POST /api/faq/chat ────────────────────────────────────────────────────────
# Proxies the conversation to Claude API (keeps API key server-side)
@router.post("/chat")
async def chat_with_ai(body: ChatRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI assistant not configured. Set ANTHROPIC_API_KEY in .env"
        )

    if not body.messages:
        raise HTTPException(status_code=400, detail="messages array is required")

    # Build message list for Anthropic
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key":         ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
            json={
                "model":      "claude-sonnet-4-20250514",
                "max_tokens": 400,
                "system":     SYSTEM_PROMPT,
                "messages":   messages,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {response.text[:200]}"
        )

    data = response.json()
    reply = "".join(
        block.get("text", "")
        for block in data.get("content", [])
        if block.get("type") == "text"
    )

    return {
        "reply":        reply,
        "input_tokens": data.get("usage", {}).get("input_tokens", 0),
        "output_tokens":data.get("usage", {}).get("output_tokens", 0),
    }
