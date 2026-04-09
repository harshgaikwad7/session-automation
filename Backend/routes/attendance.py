import random
import string
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# ── Models ─────────────────────────────────────────────────────────────────

class QRCheckInRequest(BaseModel):
    session_id: str
    qr_token: str

class OTPCheckInRequest(BaseModel):
    session_id: str
    participant_uid: str
    otp_code: str

class ManualCheckInRequest(BaseModel):
    session_id: str
    participant_uid: str

class GenerateOTPRequest(BaseModel):
    session_id: str
    participant_uid: str


# ── Helpers ────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def mark_attendance(session_id: str, participant_id: str, method: str, db: Session):
    """Core function — inserts attendance record."""
    # Check already checked in
    existing = db.execute(
        text("SELECT id FROM attendance WHERE session_id = :sid AND participant_id = :pid"),
        {"sid": session_id, "pid": participant_id}
    ).fetchone()

    if existing:
        return {"already_checked_in": True}

    db.execute(
        text("""
            INSERT INTO attendance (session_id, participant_id, check_in_method)
            VALUES (:sid, :pid, :method)
        """),
        {"sid": session_id, "pid": participant_id, "method": method}
    )
    db.commit()
    return {"already_checked_in": False}


# ── ENDPOINTS ──────────────────────────────────────────────────────────────

# POST /api/attendance/checkin/qr
@router.post("/checkin/qr")
def checkin_via_qr(data: QRCheckInRequest, db: Session = Depends(get_db)):
    # Validate QR token
    qr = db.execute(
        text("""
            SELECT qr.id, qr.participant_id, qr.used, qr.expires_at,
                   p.full_name, r.participant_uid
            FROM qr_codes qr
            JOIN profiles p ON p.id = qr.participant_id
            JOIN registrations r ON r.participant_id = qr.participant_id AND r.session_id = qr.session_id
            WHERE qr.qr_token = :token AND qr.session_id = :sid
        """),
        {"token": data.qr_token, "sid": data.session_id}
    ).fetchone()

    if not qr:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    if qr.used:
        raise HTTPException(status_code=400, detail="QR code already used")

    # Mark QR as used
    db.execute(
        text("UPDATE qr_codes SET used = true WHERE id = :id"),
        {"id": str(qr.id)}
    )

    result = mark_attendance(data.session_id, str(qr.participant_id), "qr", db)

    if result["already_checked_in"]:
        raise HTTPException(status_code=400, detail="Already checked in")

    return {
        "success": True,
        "message": f"Check-in successful via QR!",
        "participant_name": qr.full_name,
        "participant_uid": qr.participant_uid,
        "method": "QR"
    }


# POST /api/attendance/checkin/otp
@router.post("/checkin/otp")
def checkin_via_otp(data: OTPCheckInRequest, db: Session = Depends(get_db)):
    # Find participant by uid
    reg = db.execute(
        text("""
            SELECT r.participant_id, p.full_name
            FROM registrations r
            JOIN profiles p ON p.id = r.participant_id
            WHERE r.participant_uid = :uid AND r.session_id = :sid
        """),
        {"uid": data.participant_uid, "sid": data.session_id}
    ).fetchone()

    if not reg:
        raise HTTPException(status_code=404, detail="Participant not registered for this session")

    # Validate OTP
    otp_record = db.execute(
        text("""
            SELECT id, used, expires_at FROM otps
            WHERE participant_id = :pid AND session_id = :sid
              AND otp_code = :code AND used = false
              AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        """),
        {"pid": str(reg.participant_id), "sid": data.session_id, "code": data.otp_code}
    ).fetchone()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Mark OTP as used
    db.execute(
        text("UPDATE otps SET used = true WHERE id = :id"),
        {"id": str(otp_record.id)}
    )

    result = mark_attendance(data.session_id, str(reg.participant_id), "otp", db)

    if result["already_checked_in"]:
        raise HTTPException(status_code=400, detail="Already checked in")

    return {
        "success": True,
        "message": "Check-in successful via OTP!",
        "participant_name": reg.full_name,
        "participant_uid": data.participant_uid,
        "method": "OTP"
    }


# POST /api/attendance/checkin/manual
@router.post("/checkin/manual")
def checkin_manual(data: ManualCheckInRequest, db: Session = Depends(get_db)):
    reg = db.execute(
        text("""
            SELECT r.participant_id, p.full_name
            FROM registrations r
            JOIN profiles p ON p.id = r.participant_id
            WHERE r.participant_uid = :uid AND r.session_id = :sid
        """),
        {"uid": data.participant_uid, "sid": data.session_id}
    ).fetchone()

    if not reg:
        raise HTTPException(status_code=404, detail="Participant ID not found for this session")

    result = mark_attendance(data.session_id, str(reg.participant_id), "manual", db)

    if result["already_checked_in"]:
        raise HTTPException(status_code=400, detail="Already checked in")

    return {
        "success": True,
        "message": "Check-in successful!",
        "participant_name": reg.full_name,
        "participant_uid": data.participant_uid,
        "method": "Manual"
    }


# POST /api/attendance/generate-otp
@router.post("/generate-otp")
def generate_otp_for_participant(data: GenerateOTPRequest, db: Session = Depends(get_db)):
    reg = db.execute(
        text("""
            SELECT r.participant_id FROM registrations r
            WHERE r.participant_uid = :uid AND r.session_id = :sid
        """),
        {"uid": data.participant_uid, "sid": data.session_id}
    ).fetchone()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    otp_code = generate_otp()

    db.execute(
        text("""
            INSERT INTO otps (session_id, participant_id, otp_code)
            VALUES (:sid, :pid, :code)
        """),
        {"sid": data.session_id, "pid": str(reg.participant_id), "code": otp_code}
    )
    db.commit()

    # In production: send OTP via email/WhatsApp here
    return {
        "success": True,
        "otp_code": otp_code,  # Remove this in production — send via SMS/email only
        "message": "OTP generated. Valid for 10 minutes."
    }


# GET /api/attendance/live-stats/:session_id
@router.get("/live-stats/{session_id}")
def get_live_stats(session_id: str, db: Session = Depends(get_db)):
    session = db.execute(
        text("SELECT title, capacity FROM sessions WHERE id = :id"),
        {"id": session_id}
    ).fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    registered = db.execute(
        text("SELECT COUNT(*) FROM registrations WHERE session_id = :sid AND status = 'confirmed'"),
        {"sid": session_id}
    ).scalar()

    checked_in = db.execute(
        text("SELECT COUNT(*) FROM attendance WHERE session_id = :sid"),
        {"sid": session_id}
    ).scalar()

    recent = db.execute(
        text("""
            SELECT p.full_name, a.check_in_method, a.checked_in_at, r.participant_uid
            FROM attendance a
            JOIN profiles p ON p.id = a.participant_id
            JOIN registrations r ON r.participant_id = a.participant_id AND r.session_id = a.session_id
            WHERE a.session_id = :sid
            ORDER BY a.checked_in_at DESC
            LIMIT 10
        """),
        {"sid": session_id}
    ).fetchall()

    return {
        "session_title": session.title,
        "capacity": session.capacity,
        "registered": registered,
        "checked_in": checked_in,
        "attendance_pct": round((checked_in / registered * 100) if registered > 0 else 0, 1),
        "recent_checkins": [
            {
                "name": r.full_name,
                "participant_uid": r.participant_uid,
                "method": r.check_in_method,
                "time": str(r.checked_in_at),
            }
            for r in recent
        ]
    }
