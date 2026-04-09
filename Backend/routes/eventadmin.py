from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# ── Pydantic Models ───────────────────────────────────────────────────────────

class CreateSessionBody(BaseModel):
    title:       str
    date:        str          # YYYY-MM-DD
    time:        str          # e.g. "10:00 AM"
    venue:       str
    mode:        str          # online | offline | hybrid
    speaker:     str
    capacity:    int = 100
    description: str = ""
    tags:        List[str] = []

class UpdateStatusBody(BaseModel):
    status: str               # upcoming | live | completed | cancelled

class IssueCertBody(BaseModel):
    participant_id: str
    issue: bool


# ── OVERVIEW ──────────────────────────────────────────────────────────────────

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    sessions_row = db.execute(text("""
        SELECT
            COUNT(*)                                          AS total,
            COUNT(*) FILTER (WHERE status = 'live')          AS live,
            COUNT(*) FILTER (WHERE status = 'upcoming')      AS upcoming,
            COUNT(*) FILTER (WHERE status = 'completed')     AS completed,
            COUNT(*) FILTER (WHERE status = 'cancelled')     AS cancelled
        FROM sessions
    """)).fetchone()

    reg_row = db.execute(text("""
        SELECT
            COUNT(*)                                          AS total_registered,
            COUNT(*) FILTER (WHERE attended = TRUE)          AS total_attended
        FROM registrations
    """)).fetchone()

    cert_row = db.execute(text(
        "SELECT COUNT(*) AS total FROM certificates"
    )).fetchone()

    speaker_row = db.execute(text(
        "SELECT COUNT(*) AS total FROM speakers"
    )).fetchone()

    total_reg  = reg_row.total_registered or 0
    total_att  = reg_row.total_attended or 0
    avg_rate   = round((total_att / total_reg) * 100) if total_reg else 0

    # Fill rate per session
    fill_rows = db.execute(text("""
        SELECT s.title,
               s.capacity,
               COUNT(r.id) AS registered,
               s.status
        FROM sessions s
        LEFT JOIN registrations r ON r.session_id = s.id
        GROUP BY s.id
        ORDER BY registered DESC
        LIMIT 5
    """)).fetchall()

    # Recent registrations
    recent = db.execute(text("""
        SELECT
            p.full_name,
            p.email,
            r.participant_uid,
            r.created_at,
            s.title AS session_title
        FROM registrations r
        JOIN profiles  p ON p.id = r.participant_id
        JOIN sessions  s ON s.id = r.session_id
        ORDER BY r.created_at DESC
        LIMIT 8
    """)).fetchall()

    return {
        "sessions": {
            "total":     sessions_row.total,
            "live":      sessions_row.live,
            "upcoming":  sessions_row.upcoming,
            "completed": sessions_row.completed,
            "cancelled": sessions_row.cancelled,
        },
        "registrations": {
            "total":          total_reg,
            "attended":       total_att,
            "attendance_rate": avg_rate,
        },
        "certificates": cert_row.total,
        "speakers":     speaker_row.total,
        "fill_rates": [
            {
                "title":      r.title,
                "capacity":   r.capacity,
                "registered": r.registered,
                "pct":        round((r.registered / r.capacity) * 100) if r.capacity else 0,
                "status":     r.status,
            }
            for r in fill_rows
        ],
        "recent_registrations": [
            {
                "name":           r.full_name,
                "email":          r.email,
                "participant_uid":r.participant_uid,
                "registered_at":  str(r.created_at)[:10],
                "session_title":  r.session_title,
            }
            for r in recent
        ],
    }


# ── SESSIONS ──────────────────────────────────────────────────────────────────

@router.get("/sessions")
def get_sessions(status: str = "all", db: Session = Depends(get_db)):
    where = "" if status == "all" else "WHERE s.status = :status"
    params = {} if status == "all" else {"status": status}

    rows = db.execute(text(f"""
        SELECT
            s.id, s.title, s.start_time, s.end_time,
            s.venue, s.mode, s.capacity, s.status,
            s.description,
            COUNT(r.id)                                  AS registered,
            COUNT(r.id) FILTER (WHERE r.attended = TRUE) AS attended,
            STRING_AGG(DISTINCT sp.name, ', ')           AS speakers,
            ARRAY_AGG(DISTINCT t.name)                   AS tags
        FROM sessions s
        LEFT JOIN registrations r    ON r.session_id = s.id
        LEFT JOIN session_speakers ss ON ss.session_id = s.id
        LEFT JOIN speakers sp         ON sp.id = ss.speaker_id
        LEFT JOIN session_tags st     ON st.session_id = s.id
        LEFT JOIN tags t              ON t.id = st.tag_id
        {where}
        GROUP BY s.id
        ORDER BY s.start_time DESC
    """), params).fetchall()

    return {
        "sessions": [
            {
                "id":          str(r.id),
                "title":       r.title,
                "date":        str(r.start_time)[:10],
                "time":        str(r.start_time)[11:16],
                "venue":       r.venue,
                "mode":        r.mode,
                "capacity":    r.capacity,
                "registered":  r.registered,
                "attended":    r.attended,
                "status":      r.status,
                "description": r.description or "",
                "speaker":     r.speakers or "TBD",
                "tags":        [t for t in (r.tags or []) if t],
            }
            for r in rows
        ]
    }


@router.post("/sessions")
def create_session(body: CreateSessionBody, db: Session = Depends(get_db)):
    from datetime import datetime
    try:
        start_dt = datetime.strptime(f"{body.date} {body.time}", "%Y-%m-%d %I:%M %p")
    except ValueError:
        start_dt = datetime.strptime(f"{body.date} 10:00", "%Y-%m-%d %H:%M")

    result = db.execute(text("""
        INSERT INTO sessions (title, start_time, venue, mode, capacity, status, description)
        VALUES (:title, :start, :venue, :mode, :cap, 'upcoming', :desc)
        RETURNING id
    """), {
        "title": body.title,
        "start": start_dt,
        "venue": body.venue,
        "mode":  body.mode,
        "cap":   body.capacity,
        "desc":  body.description,
    })
    db.commit()
    session_id = str(result.fetchone()[0])
    return {"success": True, "session_id": session_id, "message": "Session created!"}


@router.patch("/sessions/{session_id}/status")
def update_session_status(session_id: str, body: UpdateStatusBody, db: Session = Depends(get_db)):
    allowed = {"upcoming", "live", "completed", "cancelled"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"status must be one of {allowed}")

    db.execute(
        text("UPDATE sessions SET status = :status WHERE id = :id"),
        {"status": body.status, "id": session_id}
    )
    db.commit()
    return {"success": True, "message": f"Status updated to {body.status}"}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    existing = db.execute(
        text("SELECT id FROM sessions WHERE id = :id"), {"id": session_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")

    db.execute(text("DELETE FROM registrations WHERE session_id = :id"), {"id": session_id})
    db.execute(text("DELETE FROM sessions WHERE id = :id"), {"id": session_id})
    db.commit()
    return {"success": True, "message": "Session deleted"}


# ── SPEAKERS ──────────────────────────────────────────────────────────────────

@router.get("/speakers")
def get_speakers(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            sp.id, sp.name, sp.role, sp.organisation, sp.email, sp.bio,
            COUNT(DISTINCT ss.session_id) AS session_count,
            ROUND(AVG(f.speaker_rating), 1) AS avg_rating
        FROM speakers sp
        LEFT JOIN session_speakers ss ON ss.speaker_id = sp.id
        LEFT JOIN feedback f          ON f.session_id = ss.session_id
        GROUP BY sp.id
        ORDER BY session_count DESC
    """)).fetchall()

    return {
        "speakers": [
            {
                "id":       str(r.id),
                "name":     r.name,
                "role":     r.role or "",
                "org":      r.organisation or "",
                "email":    r.email or "",
                "bio":      r.bio or "",
                "sessions": r.session_count or 0,
                "rating":   float(r.avg_rating) if r.avg_rating else None,
            }
            for r in rows
        ]
    }


# ── PARTICIPANTS ──────────────────────────────────────────────────────────────

@router.get("/participants")
def get_participants(
    session_id: str = None,
    search:     str = None,
    db: Session = Depends(get_db)
):
    conditions = ["1=1"]
    params: dict = {}

    if session_id and session_id != "all":
        conditions.append("r.session_id = :sid")
        params["sid"] = session_id
    if search:
        conditions.append("(p.full_name ILIKE :search OR p.email ILIKE :search OR r.participant_uid ILIKE :search)")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)

    rows = db.execute(text(f"""
        SELECT
            r.id, r.participant_uid, r.attended, r.created_at,
            p.full_name, p.email,
            s.id   AS session_id,
            s.title AS session_title,
            CASE WHEN c.id IS NOT NULL THEN TRUE ELSE FALSE END AS cert_issued
        FROM registrations r
        JOIN profiles p ON p.id = r.participant_id
        JOIN sessions s ON s.id = r.session_id
        LEFT JOIN certificates c
            ON c.participant_id = r.participant_id
            AND c.session_id   = r.session_id
        WHERE {where}
        ORDER BY r.created_at DESC
    """), params).fetchall()

    return {
        "participants": [
            {
                "id":               str(r.id),
                "participant_uid":  r.participant_uid,
                "name":             r.full_name,
                "email":            r.email,
                "session_id":       str(r.session_id),
                "session_title":    r.session_title,
                "registered":       str(r.created_at)[:10],
                "attended":         r.attended,
                "certificate_issued": r.cert_issued,
            }
            for r in rows
        ],
        "summary": {
            "total":       len(rows),
            "attended":    sum(1 for r in rows if r.attended),
            "absent":      sum(1 for r in rows if not r.attended),
            "certs_issued":sum(1 for r in rows if r.cert_issued),
        }
    }


@router.post("/participants/{registration_id}/certificate")
def toggle_certificate(registration_id: str, body: IssueCertBody, db: Session = Depends(get_db)):
    reg = db.execute(text("""
        SELECT r.participant_id, r.session_id, r.attended
        FROM registrations r WHERE r.id = :id
    """), {"id": registration_id}).fetchone()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    if body.issue:
        import uuid
        uid = f"CERT-RF-{str(uuid.uuid4())[:10].upper()}"
        db.execute(text("""
            INSERT INTO certificates (session_id, participant_id, certificate_uid, qr_verify_url)
            VALUES (:sid, :pid, :uid, :url)
            ON CONFLICT (session_id, participant_id) DO NOTHING
        """), {
            "sid": reg.session_id,
            "pid": reg.participant_id,
            "uid": uid,
            "url": f"/verify/{uid}",
        })
    else:
        db.execute(text("""
            DELETE FROM certificates
            WHERE session_id = :sid AND participant_id = :pid
        """), {"sid": reg.session_id, "pid": reg.participant_id})

    db.commit()
    return {"success": True, "issued": body.issue}


# ── EXPORT ────────────────────────────────────────────────────────────────────

@router.get("/participants/export")
def export_participants_csv(session_id: str = None, db: Session = Depends(get_db)):
    """Returns participant data as CSV text."""
    import csv, io

    where = "WHERE r.session_id = :sid" if session_id and session_id != "all" else ""
    params = {"sid": session_id} if session_id and session_id != "all" else {}

    rows = db.execute(text(f"""
        SELECT p.full_name, p.email, r.participant_uid,
               s.title AS session, r.attended, r.created_at
        FROM registrations r
        JOIN profiles p ON p.id = r.participant_id
        JOIN sessions s ON s.id = r.session_id
        {where}
        ORDER BY r.created_at DESC
    """), params).fetchall()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Name", "Email", "Participant ID", "Session", "Attended", "Registered On"])
    for r in rows:
        writer.writerow([r.full_name, r.email, r.participant_uid, r.session, r.attended, str(r.created_at)[:10]])

    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=participants.csv"}
    )
