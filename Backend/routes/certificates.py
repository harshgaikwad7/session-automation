import os
import uuid
import qrcode
import io
import base64
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from db import get_db

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ── Helpers ────────────────────────────────────────────────────────────────

def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#6C63FF", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def generate_certificate_pdf(
    participant_name: str,
    session_title: str,
    session_date: str,
    speaker_name: str,
    certificate_uid: str,
    verify_url: str,
) -> io.BytesIO:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=40)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', parent=styles['Title'],
                                  fontSize=28, textColor=colors.HexColor('#6C63FF'),
                                  alignment=TA_CENTER, spaceAfter=6)
    sub_style = ParagraphStyle('sub', parent=styles['Normal'],
                                fontSize=12, textColor=colors.HexColor('#666'),
                                alignment=TA_CENTER, spaceAfter=4)
    name_style = ParagraphStyle('name', parent=styles['Normal'],
                                 fontSize=24, fontName='Helvetica-Bold',
                                 textColor=colors.HexColor('#1a1a2e'),
                                 alignment=TA_CENTER, spaceBefore=12, spaceAfter=12)
    body_style = ParagraphStyle('body', parent=styles['Normal'],
                                 fontSize=13, textColor=colors.HexColor('#444'),
                                 alignment=TA_CENTER, spaceAfter=6)
    uid_style = ParagraphStyle('uid', parent=styles['Normal'],
                                fontSize=10, textColor=colors.HexColor('#999'),
                                alignment=TA_CENTER)

    story = [
        Spacer(1, 0.3 * inch),
        Paragraph("🏅 Certificate of Participation", title_style),
        Paragraph("Renovation Foundation — SessionFlow", sub_style),
        Spacer(1, 0.2 * inch),
        Paragraph("This certifies that", body_style),
        Paragraph(participant_name, name_style),
        Paragraph("successfully participated in", body_style),
        Paragraph(f"<b>{session_title}</b>", body_style),
        Spacer(1, 0.1 * inch),
        Paragraph(f"Conducted by <b>{speaker_name}</b> on <b>{session_date}</b>", body_style),
        Spacer(1, 0.3 * inch),
        Paragraph(f"Certificate ID: <b>{certificate_uid}</b>", uid_style),
        Paragraph(f"Verify at: {verify_url}", uid_style),
    ]

    doc.build(story)
    buf.seek(0)
    return buf


# ── ENDPOINTS ──────────────────────────────────────────────────────────────

# POST /api/certificates/generate  — generate cert after session ends
@router.post("/generate")
def generate_certificate(session_id: str, participant_id: str, db: Session = Depends(get_db)):
    # Check attendance
    attended = db.execute(
        text("SELECT id FROM attendance WHERE session_id = :sid AND participant_id = :pid"),
        {"sid": session_id, "pid": participant_id}
    ).fetchone()

    if not attended:
        raise HTTPException(status_code=400, detail="Participant did not attend this session")

    # Check already issued
    existing = db.execute(
        text("SELECT id, certificate_uid FROM certificates WHERE session_id = :sid AND participant_id = :pid"),
        {"sid": session_id, "pid": participant_id}
    ).fetchone()

    if existing:
        return {
            "success": True,
            "already_exists": True,
            "certificate_uid": existing.certificate_uid,
        }

    certificate_uid = f"CERT-RF-{str(uuid.uuid4())[:10].upper()}"
    verify_url = f"{FRONTEND_URL}/verify/{certificate_uid}"

    db.execute(
        text("""
            INSERT INTO certificates (session_id, participant_id, certificate_uid, qr_verify_url)
            VALUES (:sid, :pid, :uid, :url)
        """),
        {"sid": session_id, "pid": participant_id, "uid": certificate_uid, "url": verify_url}
    )
    db.commit()

    return {
        "success": True,
        "certificate_uid": certificate_uid,
        "verify_url": verify_url,
        "message": "Certificate generated successfully!"
    }


# GET /api/certificates/my?email=...
@router.get("/my")
def get_my_certificates(email: str, db: Session = Depends(get_db)):
    certs = db.execute(
        text("""
            SELECT
                c.id, c.certificate_uid, c.qr_verify_url, c.issued_at,
                s.title as session_title, s.start_time, s.venue, s.mode,
                r.participant_uid,
                STRING_AGG(sp.name, ', ') as speakers
            FROM certificates c
            JOIN profiles p ON p.id = c.participant_id
            JOIN sessions s ON s.id = c.session_id
            JOIN registrations r ON r.participant_id = c.participant_id AND r.session_id = c.session_id
            LEFT JOIN session_speakers ss ON ss.session_id = s.id
            LEFT JOIN speakers sp ON sp.id = ss.speaker_id
            WHERE p.email = :email
            GROUP BY c.id, s.id, r.participant_uid
            ORDER BY c.issued_at DESC
        """),
        {"email": email}
    ).fetchall()

    return {
        "certificates": [
            {
                "id": str(c.id),
                "certificate_uid": c.certificate_uid,
                "verify_url": c.qr_verify_url,
                "issued_at": str(c.issued_at),
                "session_title": c.session_title,
                "session_date": str(c.start_time)[:10],
                "venue": c.venue,
                "mode": c.mode,
                "participant_uid": c.participant_uid,
                "speakers": c.speakers or "Renovation Foundation",
                "status": "issued",
            }
            for c in certs
        ]
    }


# GET /api/certificates/verify/:uid — public verification
@router.get("/verify/{certificate_uid}")
def verify_certificate(certificate_uid: str, db: Session = Depends(get_db)):
    cert = db.execute(
        text("""
            SELECT
                c.certificate_uid, c.issued_at,
                p.full_name as participant_name,
                s.title as session_title, s.start_time, s.venue,
                r.participant_uid
            FROM certificates c
            JOIN profiles p ON p.id = c.participant_id
            JOIN sessions s ON s.id = c.session_id
            JOIN registrations r ON r.participant_id = c.participant_id AND r.session_id = c.session_id
            WHERE c.certificate_uid = :uid
        """),
        {"uid": certificate_uid}
    ).fetchone()

    if not cert:
        return {"valid": False, "message": "Certificate not found or invalid"}

    return {
        "valid": True,
        "certificate_uid": cert.certificate_uid,
        "participant_name": cert.participant_name,
        "participant_uid": cert.participant_uid,
        "session_title": cert.session_title,
        "session_date": str(cert.start_time)[:10],
        "venue": cert.venue,
        "issued_at": str(cert.issued_at),
    }


# GET /api/certificates/download/:uid — download PDF
@router.get("/download/{certificate_uid}")
def download_certificate(certificate_uid: str, db: Session = Depends(get_db)):
    cert = db.execute(
        text("""
            SELECT
                c.certificate_uid, c.qr_verify_url,
                p.full_name as participant_name,
                s.title as session_title, s.start_time,
                r.participant_uid,
                STRING_AGG(sp.name, ', ') as speakers
            FROM certificates c
            JOIN profiles p ON p.id = c.participant_id
            JOIN sessions s ON s.id = c.session_id
            JOIN registrations r ON r.participant_id = c.participant_id AND r.session_id = c.session_id
            LEFT JOIN session_speakers ss ON ss.session_id = s.id
            LEFT JOIN speakers sp ON sp.id = ss.speaker_id
            WHERE c.certificate_uid = :uid
            GROUP BY c.id, p.full_name, s.title, s.start_time, r.participant_uid, c.qr_verify_url
        """),
        {"uid": certificate_uid}
    ).fetchone()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    pdf_buf = generate_certificate_pdf(
        participant_name=cert.participant_name,
        session_title=cert.session_title,
        session_date=str(cert.start_time)[:10],
        speaker_name=cert.speakers or "Renovation Foundation",
        certificate_uid=cert.certificate_uid,
        verify_url=cert.qr_verify_url or "",
    )

    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificate-{certificate_uid}.pdf"}
    )
