import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# ── GET /api/content/all ──────────────────────────────────────────────────────
# Returns all content items grouped by session
@router.get("/all")
def get_all_content(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            c.id,
            c.title,
            c.content_type,
            c.file_size,
            c.duration_minutes,
            c.page_count,
            c.download_count,
            c.view_count,
            c.is_locked,
            c.uploaded_at,
            s.id        AS session_id,
            s.title     AS session_title,
            s.start_time,
            STRING_AGG(DISTINCT sp.name, ', ') AS speakers,
            ARRAY_AGG(DISTINCT t.name)         AS tags
        FROM content c
        JOIN sessions s ON s.id = c.session_id
        LEFT JOIN session_speakers ss ON ss.session_id = s.id
        LEFT JOIN speakers sp         ON sp.id = ss.speaker_id
        LEFT JOIN content_tags ct     ON ct.content_id = c.id
        LEFT JOIN tags t              ON t.id = ct.tag_id
        GROUP BY c.id, s.id
        ORDER BY c.uploaded_at DESC
    """)).fetchall()

    return {
        "content": [
            {
                "id":            str(r.id),
                "title":         r.title,
                "type":          r.content_type,          # ppt | notes | recording | resource
                "session":       r.session_title,
                "session_id":    str(r.session_id),
                "speaker":       r.speakers or "Renovatio Foundation",
                "date":          str(r.start_time)[:10],
                "size":          r.file_size or "—",
                "duration":      f"{r.duration_minutes}m" if r.duration_minutes else None,
                "pages":         r.page_count,
                "downloads":     r.download_count or 0,
                "views":         r.view_count or 0,
                "tags":          [t for t in (r.tags or []) if t],
                "locked":        r.is_locked,
                "isNew":         _is_new(str(r.uploaded_at)),
            }
            for r in rows
        ]
    }


# ── GET /api/content/session/{session_id} ─────────────────────────────────────
@router.get("/session/{session_id}")
def get_content_by_session(session_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT c.id, c.title, c.content_type, c.file_size,
               c.duration_minutes, c.page_count,
               c.download_count, c.view_count, c.is_locked, c.uploaded_at
        FROM content c
        WHERE c.session_id = :sid
        ORDER BY c.content_type, c.uploaded_at DESC
    """), {"sid": session_id}).fetchall()

    if not rows:
        return {"content": [], "message": "No content yet for this session"}

    return {
        "content": [
            {
                "id":       str(r.id),
                "title":    r.title,
                "type":     r.content_type,
                "size":     r.file_size or "—",
                "duration": f"{r.duration_minutes}m" if r.duration_minutes else None,
                "pages":    r.page_count,
                "downloads":r.download_count or 0,
                "views":    r.view_count or 0,
                "locked":   r.is_locked,
            }
            for r in rows
        ]
    }


# ── POST /api/content/view/{content_id} ───────────────────────────────────────
# Increments view count when a participant opens a file
@router.post("/view/{content_id}")
def record_view(content_id: str, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE content SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :id"),
        {"id": content_id}
    )
    db.commit()
    return {"success": True}


# ── POST /api/content/download/{content_id} ───────────────────────────────────
# Increments download count and returns the file URL
@router.post("/download/{content_id}")
def record_download(content_id: str, db: Session = Depends(get_db)):
    row = db.execute(
        text("SELECT id, title, file_url, is_locked FROM content WHERE id = :id"),
        {"id": content_id}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Content not found")
    if row.is_locked:
        raise HTTPException(status_code=403, detail="Register for this session to access content")

    db.execute(
        text("UPDATE content SET download_count = COALESCE(download_count, 0) + 1 WHERE id = :id"),
        {"id": content_id}
    )
    db.commit()

    return {
        "success":  True,
        "title":    row.title,
        "file_url": row.file_url or f"/files/{content_id}",
    }


# ── POST /api/content/upload ──────────────────────────────────────────────────
# Admin: upload new content for a session
@router.post("/upload")
def upload_content(
    session_id:    str,
    title:         str,
    content_type:  str,
    file_url:      str,
    file_size:     str = None,
    duration_min:  int = None,
    page_count:    int = None,
    is_locked:     bool = False,
    db: Session = Depends(get_db),
):
    allowed_types = {"ppt", "notes", "recording", "resource"}
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"content_type must be one of {allowed_types}")

    result = db.execute(text("""
        INSERT INTO content
            (session_id, title, content_type, file_url, file_size,
             duration_minutes, page_count, is_locked,
             download_count, view_count)
        VALUES
            (:sid, :title, :ctype, :url, :size,
             :dur, :pages, :locked, 0, 0)
        RETURNING id
    """), {
        "sid":    session_id,
        "title":  title,
        "ctype":  content_type,
        "url":    file_url,
        "size":   file_size,
        "dur":    duration_min,
        "pages":  page_count,
        "locked": is_locked,
    })
    db.commit()
    new_id = result.fetchone()[0]
    return {"success": True, "content_id": str(new_id), "message": "Content uploaded successfully"}


# ── DELETE /api/content/{content_id} ─────────────────────────────────────────
@router.delete("/{content_id}")
def delete_content(content_id: str, db: Session = Depends(get_db)):
    existing = db.execute(
        text("SELECT id FROM content WHERE id = :id"),
        {"id": content_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Content not found")

    db.execute(text("DELETE FROM content WHERE id = :id"), {"id": content_id})
    db.commit()
    return {"success": True, "message": "Content deleted"}


# ── Helper ────────────────────────────────────────────────────────────────────
def _is_new(uploaded_at: str) -> bool:
    """Returns True if uploaded within the last 7 days."""
    from datetime import datetime, timezone
    try:
        dt = datetime.fromisoformat(uploaded_at.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - dt
        return delta.days <= 7
    except Exception:
        return False
