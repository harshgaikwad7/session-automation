from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# GET /api/schedule/sessions — get all sessions with speakers
@router.get("/sessions")
def get_sessions(
    status: str = None,
    mode: str = None,
    db: Session = Depends(get_db)
):
    query = """
        SELECT
            s.id, s.title, s.description, s.venue, s.mode,
            s.start_time, s.end_time, s.capacity, s.status,
            s.meet_link, s.thumbnail_url,
            p.full_name as conductor_name,
            COUNT(r.id) as registered_count
        FROM sessions s
        LEFT JOIN profiles p ON p.id = s.conductor_id
        LEFT JOIN registrations r ON r.session_id = s.id AND r.status = 'confirmed'
        WHERE 1=1
    """
    params = {}

    if status and status != "all":
        query += " AND s.status = :status"
        params["status"] = status

    if mode and mode != "all":
        query += " AND s.mode = :mode"
        params["mode"] = mode

    query += " GROUP BY s.id, p.full_name ORDER BY s.start_time ASC"

    sessions = db.execute(text(query), params).fetchall()

    result = []
    for s in sessions:
        # Get speakers for this session
        speakers = db.execute(
            text("""
                SELECT sp.id, sp.name, sp.bio, sp.photo_url, sp.linkedin
                FROM speakers sp
                JOIN session_speakers ss ON ss.speaker_id = sp.id
                WHERE ss.session_id = :sid
            """),
            {"sid": str(s.id)}
        ).fetchall()

        result.append({
            "id": str(s.id),
            "title": s.title,
            "description": s.description,
            "venue": s.venue,
            "mode": s.mode,
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "capacity": s.capacity,
            "status": s.status,
            "meet_link": s.meet_link,
            "thumbnail_url": s.thumbnail_url,
            "conductor_name": s.conductor_name,
            "registered_count": s.registered_count,
            "spots_left": s.capacity - s.registered_count,
            "speakers": [
                {
                    "id": str(sp.id),
                    "name": sp.name,
                    "bio": sp.bio,
                    "photo_url": sp.photo_url,
                    "linkedin": sp.linkedin,
                }
                for sp in speakers
            ],
        })

    return {"sessions": result}


# GET /api/schedule/sessions/:id — single session detail
@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.execute(
        text("""
            SELECT
                s.id, s.title, s.description, s.venue, s.mode,
                s.start_time, s.end_time, s.capacity, s.status, s.meet_link,
                p.full_name as conductor_name,
                COUNT(r.id) as registered_count
            FROM sessions s
            LEFT JOIN profiles p ON p.id = s.conductor_id
            LEFT JOIN registrations r ON r.session_id = s.id AND r.status = 'confirmed'
            WHERE s.id = :id
            GROUP BY s.id, p.full_name
        """),
        {"id": session_id}
    ).fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    speakers = db.execute(
        text("""
            SELECT sp.id, sp.name, sp.bio, sp.photo_url
            FROM speakers sp
            JOIN session_speakers ss ON ss.speaker_id = sp.id
            WHERE ss.session_id = :sid
        """),
        {"sid": session_id}
    ).fetchall()

    return {
        "id": str(session.id),
        "title": session.title,
        "description": session.description,
        "venue": session.venue,
        "mode": session.mode,
        "start_time": str(session.start_time),
        "end_time": str(session.end_time),
        "capacity": session.capacity,
        "status": session.status,
        "meet_link": session.meet_link,
        "conductor_name": session.conductor_name,
        "registered_count": session.registered_count,
        "spots_left": session.capacity - session.registered_count,
        "speakers": [
            {"id": str(sp.id), "name": sp.name, "bio": sp.bio, "photo_url": sp.photo_url}
            for sp in speakers
        ],
    }


# GET /api/schedule/live — only live sessions
@router.get("/live")
def get_live_sessions(db: Session = Depends(get_db)):
    sessions = db.execute(
        text("""
            SELECT s.id, s.title, s.venue, s.mode, s.start_time, s.end_time, s.meet_link,
                   COUNT(r.id) as registered_count
            FROM sessions s
            LEFT JOIN registrations r ON r.session_id = s.id AND r.status = 'confirmed'
            WHERE s.status = 'live'
            GROUP BY s.id
            ORDER BY s.start_time ASC
        """)
    ).fetchall()

    return {
        "count": len(sessions),
        "sessions": [
            {
                "id": str(s.id),
                "title": s.title,
                "venue": s.venue,
                "mode": s.mode,
                "start_time": str(s.start_time),
                "end_time": str(s.end_time),
                "meet_link": s.meet_link,
                "registered_count": s.registered_count,
            }
            for s in sessions
        ]
    }
