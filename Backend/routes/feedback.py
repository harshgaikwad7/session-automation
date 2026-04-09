from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# ── Pydantic Models ───────────────────────────────────────────────────────────

class SubmitFeedbackBody(BaseModel):
    session_id:      str
    email:           str
    overall_rating:  int          # 1–5
    speaker_rating:  int          # 1–5
    content_rating:  int          # 1–5
    venue_rating:    int          # 1–5
    tags:            List[str] = []
    comment:         Optional[str] = None
    recommend:       Optional[bool] = None
    anonymous:       bool = False


# ── GET /api/feedback/pending?email=... ───────────────────────────────────────
# Sessions the user attended but hasn't submitted feedback for yet
@router.get("/pending")
def get_pending_feedback(email: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            s.id, s.title, s.start_time, s.venue, s.mode,
            STRING_AGG(sp.name, ', ') AS speakers,
            CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_feedback
        FROM registrations r
        JOIN profiles p   ON p.id = r.participant_id
        JOIN sessions s   ON s.id = r.session_id
        LEFT JOIN session_speakers ss ON ss.session_id = s.id
        LEFT JOIN speakers sp         ON sp.id = ss.speaker_id
        LEFT JOIN feedback f
            ON f.session_id = s.id AND f.participant_id = r.participant_id
        WHERE p.email = :email
          AND r.attended = TRUE
          AND s.status = 'completed'
        GROUP BY s.id, f.id
        ORDER BY s.start_time DESC
    """), {"email": email}).fetchall()

    return {
        "sessions": [
            {
                "id":           str(r.id),
                "title":        r.title,
                "date":         str(r.start_time)[:10],
                "mode":         r.mode,
                "speaker":      r.speakers or "Renovatio Foundation",
                "has_feedback": r.has_feedback,
            }
            for r in rows
        ]
    }


# ── POST /api/feedback/submit ─────────────────────────────────────────────────
@router.post("/submit")
def submit_feedback(body: SubmitFeedbackBody, db: Session = Depends(get_db)):
    # Validate ratings
    for field in [body.overall_rating, body.speaker_rating, body.content_rating, body.venue_rating]:
        if not (1 <= field <= 5):
            raise HTTPException(status_code=400, detail="All ratings must be between 1 and 5")

    # Get participant
    participant = db.execute(text(
        "SELECT id FROM profiles WHERE email = :email"
    ), {"email": body.email}).fetchone()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found. Please register first.")

    # Check already submitted
    existing = db.execute(text("""
        SELECT id FROM feedback
        WHERE session_id = :sid AND participant_id = :pid
    """), {"sid": body.session_id, "pid": participant.id}).fetchone()

    if existing:
        raise HTTPException(status_code=409, detail="Feedback already submitted for this session")

    # Check attendance
    attended = db.execute(text("""
        SELECT id FROM registrations
        WHERE session_id = :sid AND participant_id = :pid AND attended = TRUE
    """), {"sid": body.session_id, "pid": participant.id}).fetchone()

    if not attended:
        raise HTTPException(status_code=403, detail="You must attend a session before submitting feedback")

    # Insert feedback
    db.execute(text("""
        INSERT INTO feedback
            (session_id, participant_id, overall_rating, speaker_rating,
             content_rating, venue_rating, tags, comment, recommend, anonymous)
        VALUES
            (:sid, :pid, :overall, :speaker,
             :content, :venue, :tags::text[], :comment, :recommend, :anon)
    """), {
        "sid":      body.session_id,
        "pid":      participant.id,
        "overall":  body.overall_rating,
        "speaker":  body.speaker_rating,
        "content":  body.content_rating,
        "venue":    body.venue_rating,
        "tags":     "{" + ",".join(body.tags) + "}" if body.tags else "{}",
        "comment":  body.comment,
        "recommend":body.recommend,
        "anon":     body.anonymous,
    })
    db.commit()

    # Calculate avg for response
    avg = round((body.overall_rating + body.speaker_rating + body.content_rating + body.venue_rating) / 4, 1)

    return {
        "success":        True,
        "average_rating": avg,
        "message":        "Feedback submitted successfully! Thank you 🙏",
    }


# ── GET /api/feedback/analytics/{session_id} ─────────────────────────────────
@router.get("/analytics/{session_id}")
def get_session_analytics(session_id: str, db: Session = Depends(get_db)):
    # Aggregate ratings
    agg = db.execute(text("""
        SELECT
            COUNT(*)                         AS total_responses,
            ROUND(AVG(overall_rating), 1)    AS avg_overall,
            ROUND(AVG(speaker_rating), 1)    AS avg_speaker,
            ROUND(AVG(content_rating), 1)    AS avg_content,
            ROUND(AVG(venue_rating), 1)      AS avg_venue,
            COUNT(*) FILTER (WHERE recommend = TRUE)  AS recommended,
            COUNT(*) FILTER (WHERE recommend = FALSE) AS not_recommended
        FROM feedback
        WHERE session_id = :sid
    """), {"sid": session_id}).fetchone()

    if not agg or not agg.total_responses:
        return {"analytics": None, "message": "No feedback yet for this session"}

    # Rating distribution (1–5 for overall)
    dist = db.execute(text("""
        SELECT overall_rating AS stars, COUNT(*) AS count
        FROM feedback
        WHERE session_id = :sid
        GROUP BY overall_rating
        ORDER BY overall_rating DESC
    """), {"sid": session_id}).fetchall()

    total = agg.total_responses
    distribution = []
    star_map = {r.stars: r.count for r in dist}
    for stars in [5, 4, 3, 2, 1]:
        cnt = star_map.get(stars, 0)
        distribution.append({
            "label": f"{stars} ⭐",
            "count": cnt,
            "pct":   round((cnt / total) * 100) if total else 0,
        })

    # Top tags
    tag_rows = db.execute(text("""
        SELECT unnest(tags) AS tag, COUNT(*) AS cnt
        FROM feedback
        WHERE session_id = :sid
        GROUP BY tag
        ORDER BY cnt DESC
        LIMIT 10
    """), {"sid": session_id}).fetchall()

    # NPS calculation
    promoters  = db.execute(text("SELECT COUNT(*) FROM feedback WHERE session_id=:sid AND overall_rating=5"), {"sid": session_id}).scalar() or 0
    detractors = db.execute(text("SELECT COUNT(*) FROM feedback WHERE session_id=:sid AND overall_rating<=2"), {"sid": session_id}).scalar() or 0
    nps = round(((promoters - detractors) / total) * 100) if total else 0

    # Recent non-anonymous comments
    comments = db.execute(text("""
        SELECT comment, overall_rating
        FROM feedback
        WHERE session_id = :sid
          AND anonymous = FALSE
          AND comment IS NOT NULL
          AND comment != ''
        ORDER BY created_at DESC
        LIMIT 6
    """), {"sid": session_id}).fetchall()

    return {
        "analytics": {
            "total_responses":   total,
            "avg_overall":       float(agg.avg_overall or 0),
            "avg_speaker":       float(agg.avg_speaker or 0),
            "avg_content":       float(agg.avg_content or 0),
            "avg_venue":         float(agg.avg_venue or 0),
            "recommended_pct":   round((agg.recommended / total) * 100) if total else 0,
            "nps":               nps,
            "distribution":      distribution,
            "top_tags": [
                {"label": r.tag, "count": r.cnt}
                for r in tag_rows
            ],
            "comments": [
                {"text": c.comment, "rating": c.overall_rating}
                for c in comments
            ],
        }
    }


# ── GET /api/feedback/platform-analytics ─────────────────────────────────────
# Admin: aggregated analytics across ALL sessions (shown on Analytics tab)
@router.get("/platform-analytics")
def get_platform_analytics(db: Session = Depends(get_db)):
    agg = db.execute(text("""
        SELECT
            COUNT(*)                           AS total_responses,
            ROUND(AVG(overall_rating), 1)      AS avg_rating,
            COUNT(*) FILTER (WHERE recommend=TRUE)  AS recommended,
            COUNT(*) FILTER (WHERE overall_rating=5) AS promoters,
            COUNT(*) FILTER (WHERE overall_rating<=2) AS detractors
        FROM feedback
    """)).fetchone()

    total = agg.total_responses or 0
    nps   = round(((agg.promoters - agg.detractors) / total) * 100) if total else 0

    # Attendance-based response rate
    att_count = db.execute(text(
        "SELECT COUNT(*) FROM registrations WHERE attended = TRUE"
    )).scalar() or 1
    response_rate = round((total / att_count) * 100)

    # Rating distribution
    dist = db.execute(text("""
        SELECT overall_rating AS stars, COUNT(*) AS count
        FROM feedback GROUP BY overall_rating ORDER BY overall_rating DESC
    """)).fetchall()
    star_map = {r.stars: r.count for r in dist}
    distribution = [
        {"label": f"{s} ⭐", "count": star_map.get(s, 0), "pct": round((star_map.get(s, 0) / total) * 100) if total else 0}
        for s in [5, 4, 3, 2, 1]
    ]

    # Top tags platform-wide
    tag_rows = db.execute(text("""
        SELECT unnest(tags) AS tag, COUNT(*) AS cnt
        FROM feedback
        GROUP BY tag ORDER BY cnt DESC LIMIT 8
    """)).fetchall()

    # Recent non-anon quotes
    quotes = db.execute(text("""
        SELECT comment, overall_rating
        FROM feedback
        WHERE anonymous=FALSE AND comment IS NOT NULL AND comment != ''
        ORDER BY created_at DESC LIMIT 6
    """)).fetchall()

    return {
        "stats": {
            "total_responses": total,
            "avg_rating":      float(agg.avg_rating or 0),
            "response_rate":   response_rate,
            "nps":             nps,
        },
        "distribution": distribution,
        "top_tags": [{"label": r.tag, "count": r.cnt} for r in tag_rows],
        "quotes":   [{"text": q.comment, "rating": q.overall_rating} for q in quotes],
    }
