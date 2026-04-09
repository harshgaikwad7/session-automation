import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()

RESEND_API_KEY   = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM       = os.getenv("EMAIL_FROM", "noreply@renovatiofoundation.org")
FRONTEND_URL     = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ── Pydantic Models ───────────────────────────────────────────────────────────

class SaveReminderBody(BaseModel):
    session_id:      str
    email:           str
    minutes_before:  int = 60          # 5 | 15 | 30 | 60 | 120
    channels:        List[str] = ["email"]   # ["email"] | ["whatsapp"] | ["email","whatsapp"]

class DeleteReminderBody(BaseModel):
    reminder_id: str

class TriggerReminderBody(BaseModel):
    session_id: str                    # Admin: manually fire reminders for a session


# ── GET /api/reminders/my?email=... ──────────────────────────────────────────
@router.get("/my")
def get_my_reminders(email: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            r.id,
            r.minutes_before,
            r.channels,
            r.sent,
            r.created_at,
            s.id         AS session_id,
            s.title      AS session_title,
            s.start_time AS session_date,
            s.venue,
            s.mode,
            STRING_AGG(sp.name, ', ') AS speakers
        FROM reminders r
        JOIN profiles p   ON p.id = r.participant_id
        JOIN sessions s   ON s.id = r.session_id
        LEFT JOIN session_speakers ss ON ss.session_id = s.id
        LEFT JOIN speakers sp         ON sp.id = ss.speaker_id
        WHERE p.email = :email
          AND s.start_time > now()
        GROUP BY r.id, s.id
        ORDER BY s.start_time ASC
    """), {"email": email}).fetchall()

    return {
        "reminders": [
            {
                "id":             str(r.id),
                "session_id":     str(r.session_id),
                "session_title":  r.session_title,
                "date":           str(r.session_date)[:10],
                "time":           str(r.session_date)[11:16],
                "venue":          r.venue,
                "mode":           r.mode,
                "speaker":        r.speakers or "Renovatio Foundation",
                "minutes_before": r.minutes_before,
                "channels":       r.channels or ["email"],
                "sent":           r.sent,
            }
            for r in rows
        ]
    }


# ── POST /api/reminders/save ──────────────────────────────────────────────────
@router.post("/save")
def save_reminder(body: SaveReminderBody, db: Session = Depends(get_db)):
    # Validate channels
    valid_channels = {"email", "whatsapp"}
    for ch in body.channels:
        if ch not in valid_channels:
            raise HTTPException(status_code=400, detail=f"Channel must be one of {valid_channels}")

    # Validate minutes
    allowed_minutes = {5, 10, 15, 30, 60, 90, 120}
    if body.minutes_before not in allowed_minutes:
        raise HTTPException(status_code=400, detail=f"minutes_before must be one of {sorted(allowed_minutes)}")

    # Get participant
    participant = db.execute(text(
        "SELECT id FROM profiles WHERE email = :email"
    ), {"email": body.email}).fetchone()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    # Check session exists and is upcoming
    session = db.execute(text("""
        SELECT id, title, start_time FROM sessions
        WHERE id = :sid AND start_time > now()
    """), {"sid": body.session_id}).fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    # Upsert — one reminder per participant per session
    db.execute(text("""
        INSERT INTO reminders (session_id, participant_id, minutes_before, channels, sent)
        VALUES (:sid, :pid, :min, :channels::text[], FALSE)
        ON CONFLICT (session_id, participant_id)
        DO UPDATE SET
            minutes_before = EXCLUDED.minutes_before,
            channels       = EXCLUDED.channels,
            sent           = FALSE
    """), {
        "sid":      body.session_id,
        "pid":      participant.id,
        "min":      body.minutes_before,
        "channels": "{" + ",".join(body.channels) + "}",
    })
    db.commit()

    return {
        "success": True,
        "message": f"Reminder set {body.minutes_before} minutes before '{session.title}'",
        "session_title":  session.title,
        "minutes_before": body.minutes_before,
        "channels":       body.channels,
    }


# ── DELETE /api/reminders/{reminder_id} ──────────────────────────────────────
@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db)):
    existing = db.execute(text(
        "SELECT id FROM reminders WHERE id = :id"
    ), {"id": reminder_id}).fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.execute(text("DELETE FROM reminders WHERE id = :id"), {"id": reminder_id})
    db.commit()
    return {"success": True, "message": "Reminder deleted"}


# ── POST /api/reminders/trigger ───────────────────────────────────────────────
# Called by a cron job (or manually by admin) to fire due reminders
@router.post("/trigger")
def trigger_due_reminders(db: Session = Depends(get_db)):
    """
    Finds all reminders where:
      - session starts within `minutes_before` minutes from now
      - reminder has NOT been sent yet
    Then sends email (via Resend) and marks as sent.
    """
    due = db.execute(text("""
        SELECT
            r.id         AS reminder_id,
            r.channels,
            r.minutes_before,
            p.full_name,
            p.email,
            p.phone,
            s.title      AS session_title,
            s.start_time,
            s.venue,
            s.mode,
            reg.participant_uid
        FROM reminders r
        JOIN profiles p  ON p.id = r.participant_id
        JOIN sessions s  ON s.id = r.session_id
        JOIN registrations reg
            ON reg.session_id    = s.id
            AND reg.participant_id = r.participant_id
        WHERE r.sent = FALSE
          AND s.start_time > now()
          AND s.start_time <= now() + (r.minutes_before || ' minutes')::interval
    """)).fetchall()

    sent_count = 0
    errors     = []

    for row in due:
        try:
            if "email" in (row.channels or []):
                _send_email_reminder(
                    to_email=row.email,
                    name=row.full_name,
                    session_title=row.session_title,
                    start_time=str(row.start_time),
                    venue=row.venue,
                    mode=row.mode,
                    participant_uid=row.participant_uid,
                    minutes_before=row.minutes_before,
                )

            # Mark as sent
            db.execute(text(
                "UPDATE reminders SET sent = TRUE WHERE id = :id"
            ), {"id": row.reminder_id})
            db.commit()
            sent_count += 1

        except Exception as e:
            errors.append({"reminder_id": str(row.reminder_id), "error": str(e)})

    return {
        "success":    True,
        "sent_count": sent_count,
        "errors":     errors,
        "message":    f"{sent_count} reminder(s) sent successfully",
    }


# ── POST /api/reminders/send-now/{session_id} ────────────────────────────────
# Admin: manually blast all reminders for an upcoming session right now
@router.post("/send-now/{session_id}")
def send_reminders_for_session(session_id: str, db: Session = Depends(get_db)):
    session = db.execute(text("""
        SELECT id, title, start_time, venue, mode
        FROM sessions WHERE id = :sid
    """), {"sid": session_id}).fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all registered participants for this session
    participants = db.execute(text("""
        SELECT p.full_name, p.email, reg.participant_uid
        FROM registrations reg
        JOIN profiles p ON p.id = reg.participant_id
        WHERE reg.session_id = :sid
    """), {"sid": session_id}).fetchall()

    sent_count = 0
    errors     = []

    for p in participants:
        try:
            _send_email_reminder(
                to_email=p.email,
                name=p.full_name,
                session_title=session.title,
                start_time=str(session.start_time),
                venue=session.venue,
                mode=session.mode,
                participant_uid=p.participant_uid,
                minutes_before=60,
            )
            sent_count += 1
        except Exception as e:
            errors.append({"email": p.email, "error": str(e)})

    return {
        "success":    True,
        "sent_count": sent_count,
        "total":      len(participants),
        "errors":     errors,
        "message":    f"Reminder sent to {sent_count}/{len(participants)} participants",
    }


# ── GET /api/reminders/admin/upcoming ────────────────────────────────────────
# Admin: see all unsent reminders sorted by when they fire next
@router.get("/admin/upcoming")
def get_upcoming_reminders(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            r.id, r.minutes_before, r.channels, r.sent,
            p.full_name, p.email,
            s.title AS session_title,
            s.start_time,
            (s.start_time - (r.minutes_before || ' minutes')::interval) AS fires_at
        FROM reminders r
        JOIN profiles p ON p.id = r.participant_id
        JOIN sessions s ON s.id = r.session_id
        WHERE r.sent = FALSE
          AND s.start_time > now()
        ORDER BY fires_at ASC
        LIMIT 50
    """)).fetchall()

    return {
        "reminders": [
            {
                "id":             str(r.id),
                "participant":    r.full_name,
                "email":          r.email,
                "session_title":  r.session_title,
                "session_time":   str(r.start_time),
                "fires_at":       str(r.fires_at),
                "minutes_before": r.minutes_before,
                "channels":       r.channels,
            }
            for r in rows
        ]
    }


# ── Email Helper (Resend) ─────────────────────────────────────────────────────
def _send_email_reminder(
    to_email:       str,
    name:           str,
    session_title:  str,
    start_time:     str,
    venue:          str,
    mode:           str,
    participant_uid:str,
    minutes_before: int,
):
    if not RESEND_API_KEY:
        # Dev mode — just print instead of crashing
        print(f"[DEV] Would email {to_email}: Reminder for '{session_title}' in {minutes_before}min")
        return

    import httpx

    label = f"{minutes_before} minute" if minutes_before < 60 else f"{minutes_before // 60} hour"
    venue_line = f"📍 {venue}" if mode != "online" else "🌐 Online — check your email for the link"

    html_body = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d1a;color:#e2e2ff;padding:32px;border-radius:16px">
      <div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:32px">⏰</div>
        <div style="font-size:18px;font-weight:800;color:#fff;margin-top:8px">Session Starting in {label}!</div>
      </div>
      <p style="color:#c4b5fd;font-size:15px">Hi {name},</p>
      <p style="color:#94a3b8">Your session is starting soon. Don't miss it!</p>
      <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;margin:20px 0">
        <div style="font-size:16px;font-weight:700;color:#e2e2ff;margin-bottom:12px">{session_title}</div>
        <div style="font-size:13px;color:#94a3b8;line-height:2">
          🕐 {start_time[:16].replace("T", " ")}<br>
          {venue_line}<br>
          🎫 Your ID: <span style="font-family:monospace;color:#a78bfa;font-weight:700">{participant_uid}</span>
        </div>
      </div>
      <a href="{FRONTEND_URL}/attendance" style="display:block;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;text-decoration:none;padding:14px;border-radius:10px;text-align:center;font-weight:700;font-size:15px">
        Check In Now →
      </a>
      <p style="color:#4b5563;font-size:12px;text-align:center;margin-top:20px">
        Renovatio Foundation · SessionFlow<br>
        <a href="{FRONTEND_URL}/dashboard" style="color:#6b7280">Manage reminders</a>
      </p>
    </div>
    """

    httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        json={
            "from":    EMAIL_FROM,
            "to":      [to_email],
            "subject": f"⏰ Reminder: '{session_title}' starts in {label}!",
            "html":    html_body,
        },
        timeout=10.0,
    )
