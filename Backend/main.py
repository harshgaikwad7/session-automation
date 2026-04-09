from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import registration, schedule, attendance, certificates, dashboard
from routes import content, eventadmin, faq, quiz, feedback, reminders, auth

app = FastAPI(
    title="SessionFlow API",
    description="Backend for Renovatio Foundation's Session Automation Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth Routes ──────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# ── Phase 3 — Core Routes ─────────────────────────────────────────────────────
app.include_router(registration.router,  prefix="/api/registration",  tags=["Registration"])
app.include_router(schedule.router,      prefix="/api/schedule",      tags=["Schedule"])
app.include_router(attendance.router,    prefix="/api/attendance",    tags=["Attendance"])
app.include_router(certificates.router,  prefix="/api/certificates",  tags=["Certificates"])
app.include_router(dashboard.router,     prefix="/api/dashboard",     tags=["Dashboard"])

# ── Phase 3 — Extended Routes ─────────────────────────────────────────────────
app.include_router(content.router,       prefix="/api/content",       tags=["Content"])
app.include_router(eventadmin.router,   prefix="/api/admin",         tags=["Event Admin"])
app.include_router(faq.router,           prefix="/api/faq",           tags=["FAQ & Chatbot"])
app.include_router(quiz.router,          prefix="/api/quiz",          tags=["Quiz"])
app.include_router(feedback.router,      prefix="/api/feedback",      tags=["Feedback"])
app.include_router(reminders.router,     prefix="/api/reminders",     tags=["Reminders"])


@app.get("/")
def root():
    return {
        "status":  "ok",
        "message": "SessionFlow API is running",
        "version": "1.0.0",
        "docs":    "/docs",
    }
