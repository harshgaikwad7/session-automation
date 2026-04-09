from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# ── Models ─────────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    full_name: str = None
    phone: str = None


class SaveReminderRequest(BaseModel):
    email: EmailStr
    session_id: str
    minutes_before: int
    reminder_type: str  # 'email' or 'whatsapp'


# ── ENDPOINTS ──────────────────────────────────────────────────────────────

# GET /api/dashboard/profile?email=...
@router.get("/profile")
def get_profile(email: str, db: Session = Depends(get_db)):
    profile = db.execute(
        text("SELECT id, full_name, email, phone, role, created_at FROM profiles WHERE email = :email"),
        {"email": email}
    ).fetchone()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Stats
    total_registered = db.execute(
        text("SELECT COUNT(*) FROM registrations WHERE participant_id = :pid AND status = 'confirmed'"),
        {"pid": str(profile.id)}
    ).scalar()

    total_attended = db.execute(
        text("SELECT COUNT(*) FROM attendance WHERE participant_id = :pid"),
        {"pid": str(profile.id)}
    ).scalar()

    total_certificates = db.execute(
        text("SELECT COUNT(*) FROM certificates WHERE participant_id = :pid"),
        {"pid": str(profile.id)}
    ).scalar()

    total_quizzes = db.execute(
        text("SELECT COUNT(*) FROM quiz_attempts WHERE participant_id = :pid"),
        {"pid": str(profile.id)}
    ).scalar()

    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "email": profile.email,
        "phone": profile.phone,
        "role": profile.role,
        "joined_on": str(profile.created_at)[:10],
        "stats": {
            "total_registered": total_registered,
            "total_attended": total_attended,
            "total_certificates": total_certificates,
            "total_quizzes": total_quizzes,
        }
    }


# GET /api/dashboard/sessions?email=...
@router.get("/sessions")
def get_my_sessions(email: str, db: Session = Depends(get_db)):
    profile = db.execute(
        text("SELECT id FROM profiles WHERE email = :email"),
        {"email": email}
    ).fetchone()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    sessions = db.execute(
        text("""
            SELECT
                s.id, s.title, s.start_time, s.end_time,
                s.venue, s.mode, s.status, s.meet_link,
                r.participant_uid, r.status as reg_status,
                a.id as attendance_id, a.check_in_method,
                c.certificate_uid,
                qa.score as quiz_score,
                STRING_AGG(sp.name, ', ') as speakers
            FROM registrations r
            JOIN sessions s ON s.id = r.session_id
            LEFT JOIN attendance a ON a.participant_id = r.participant_id AND a.session_id = r.session_id
            LEFT JOIN certificates c ON c.participant_id = r.participant_id AND c.session_id = r.session_id
            LEFT JOIN quizzes qz ON qz.session_id = s.id
            LEFT JOIN quiz_attempts qa ON qa.participant_id = r.participant_id AND qa.quiz_id = qz.id
            LEFT JOIN session_speakers ss ON ss.session_id = s.id
            LEFT JOIN speakers sp ON sp.id = ss.speaker_id
            WHERE r.participant_id = :pid AND r.status = 'confirmed'
            GROUP BY s.id, r.participant_uid, r.status, a.id, c.certificate_uid, qa.score
            ORDER BY s.start_time DESC
        """),
        {"pid": str(profile.id)}
    ).fetchall()

    result = []
    for s in sessions:
        # Determine attendance status
        if s.attendance_id:
            status = "attended"
        elif s.status == "completed":
            status = "missed"
        else:
            status = "upcoming"

        result.append({
            "id": str(s.id),
            "title": s.title,
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "venue": s.venue,
            "mode": s.mode,
            "status": status,
            "session_status": s.status,
            "meet_link": s.meet_link,
            "participant_uid": s.participant_uid,
            "checked_in": bool(s.attendance_id),
            "check_in_method": s.check_in_method,
            "has_certificate": bool(s.certificate_uid),
            "certificate_uid": s.certificate_uid,
            "has_quiz": s.quiz_score is not None,
            "quiz_score": s.quiz_score,
            "speakers": s.speakers or "",
        })

    return {"sessions": result}


# GET /api/dashboard/reminders?email=...
@router.get("/reminders")
def get_reminders(email: str, db: Session = Depends(get_db)):
    profile = db.execute(
        text("SELECT id FROM profiles WHERE email = :email"),
        {"email": email}
    ).fetchone()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    reminders = db.execute(
        text("""
            SELECT rem.id, rem.type, rem.scheduled_at, rem.sent,
                   s.title as session_title, s.start_time, s.venue
            FROM reminders rem
            JOIN sessions s ON s.id = rem.session_id
            WHERE rem.participant_id = :pid AND rem.sent = false
            ORDER BY rem.scheduled_at ASC
        """),
        {"pid": str(profile.id)}
    ).fetchall()

    return {
        "reminders": [
            {
                "id": str(r.id),
                "type": r.type,
                "scheduled_at": str(r.scheduled_at),
                "session_title": r.session_title,
                "session_date": str(r.start_time)[:10],
                "session_time": str(r.start_time)[11:16],
                "venue": r.venue,
                "sent": r.sent,
            }
            for r in reminders
        ]
    }


# POST /api/dashboard/reminders/save
@router.post("/reminders/save")
def save_reminder(data: SaveReminderRequest, db: Session = Depends(get_db)):
    profile = db.execute(
        text("SELECT id FROM profiles WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Get session start time to compute scheduled_at
    session = db.execute(
        text("SELECT start_time FROM sessions WHERE id = :id"),
        {"id": data.session_id}
    ).fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # scheduled_at = session start - minutes_before
    db.execute(
        text("""
            INSERT INTO reminders (session_id, participant_id, type, scheduled_at)
            VALUES (:sid, :pid, :type,
                    :start - INTERVAL '1 minute' * :minutes)
            ON CONFLICT DO NOTHING
        """),
        {
            "sid": data.session_id,
            "pid": str(profile.id),
            "type": data.reminder_type,
            "start": session.start_time,
            "minutes": data.minutes_before,
        }
    )
    db.commit()

    return {
        "success": True,
        "message": f"Reminder set {data.minutes_before} minutes before the session via {data.reminder_type}."
    }


# GET /api/dashboard/overview?email=... — all data in one call
@router.get("/overview")
def get_overview(email: str, db: Session = Depends(get_db)):
    profile_data = get_profile(email, db)
    sessions_data = get_my_sessions(email, db)
    reminders_data = get_reminders(email, db)

    upcoming = [s for s in sessions_data["sessions"] if s["status"] == "upcoming"]
    attended = [s for s in sessions_data["sessions"] if s["status"] == "attended"]

    return {
        "profile": profile_data,
        "upcoming_sessions": upcoming[:3],
        "recent_attended": attended[:3],
        "reminders": reminders_data["reminders"][:5],
        "stats": profile_data["stats"],
    }
