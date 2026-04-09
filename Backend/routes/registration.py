import os, uuid, hashlib, secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()

# ── Models ────────────────────────────────────────────────────

class SignupBody(BaseModel):
    full_name: str
    email:     EmailStr
    password:  str
    phone:     str = ""
    role:      str = "participant"  # participant | conductor | admin

class LoginBody(BaseModel):
    email:    EmailStr
    password: str

class RegisterSessionBody(BaseModel):
    session_id: str
    email:      str
    full_name:  str = ""

# ── Helpers ───────────────────────────────────────────────────

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def gen_uid() -> str:
    return "RF-" + secrets.token_hex(3).upper()

# ── POST /api/registration/signup ────────────────────────────

@router.post("/signup")
def signup(body: SignupBody, db: Session = Depends(get_db)):
    existing = db.execute(
        text("SELECT id FROM profiles WHERE email = :e"), {"e": body.email}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    allowed_roles = {"participant", "conductor", "admin"}
    if body.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"role must be one of {allowed_roles}")

    pw_hash = hash_password(body.password)
    result = db.execute(text("""
        INSERT INTO profiles (full_name, email, password_hash, phone, role)
        VALUES (:name, :email, :pw, :phone, :role)
        RETURNING id, full_name, email, phone, role, created_at
    """), {"name": body.full_name, "email": body.email, "pw": pw_hash, "phone": body.phone, "role": body.role})
    db.commit()
    row = result.fetchone()

    return {
        "success": True,
        "user": {
            "id":       str(row.id),
            "name":     row.full_name,
            "email":    row.email,
            "phone":    row.phone,
            "role":     row.role,
            "joinedOn": str(row.created_at)[:10],
        }
    }

# ── POST /api/registration/login ─────────────────────────────

@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    pw_hash = hash_password(body.password)
    row = db.execute(text("""
        SELECT id, full_name, email, phone, role, created_at
        FROM profiles
        WHERE email = :e AND password_hash = :pw
    """), {"e": body.email, "pw": pw_hash}).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "success": True,
        "user": {
            "id":       str(row.id),
            "name":     row.full_name,
            "email":    row.email,
            "phone":    row.phone or "",
            "role":     row.role,
            "joinedOn": str(row.created_at)[:10],
        }
    }

# ── POST /api/registration/register ──────────────────────────
# Called when participant clicks "Register Now" on a session

@router.post("/register")
def register_for_session(body: RegisterSessionBody, db: Session = Depends(get_db)):
    # Get or auto-create participant profile
    participant = db.execute(
        text("SELECT id FROM profiles WHERE email = :e"), {"e": body.email}
    ).fetchone()

    if not participant:
        # Auto-create a basic profile for demo users
        result = db.execute(text("""
            INSERT INTO profiles (full_name, email, role)
            VALUES (:name, :email, 'participant')
            RETURNING id
        """), {"name": body.full_name or body.email.split("@")[0], "email": body.email})
        db.commit()
        pid = result.fetchone()[0]
    else:
        pid = participant.id

    # Check session exists
    session = db.execute(
        text("SELECT id, title, capacity FROM sessions WHERE id = :sid"), {"sid": body.session_id}
    ).fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check capacity
    reg_count = db.execute(
        text("SELECT COUNT(*) FROM registrations WHERE session_id = :sid"), {"sid": body.session_id}
    ).scalar()
    if reg_count >= session.capacity:
        raise HTTPException(status_code=400, detail="Session is full")

    # Check already registered
    existing = db.execute(text("""
        SELECT participant_uid FROM registrations
        WHERE session_id = :sid AND participant_id = :pid
    """), {"sid": body.session_id, "pid": pid}).fetchone()

    if existing:
        return {"success": True, "already_registered": True, "participant_uid": existing.participant_uid}

    # Register
    uid = gen_uid()
    db.execute(text("""
        INSERT INTO registrations (session_id, participant_id, participant_uid, status)
        VALUES (:sid, :pid, :uid, 'confirmed')
    """), {"sid": body.session_id, "pid": pid, "uid": uid})
    db.commit()

    return {
        "success":         True,
        "participant_uid": uid,
        "session_title":   session.title,
        "message":         f"Successfully registered! Your ID is {uid}",
    }

# ── GET /api/registration/check?email=&session_id= ───────────
# Frontend can check if a user is already registered for a session

@router.get("/check")
def check_registration(email: str, session_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT r.participant_uid
        FROM registrations r
        JOIN profiles p ON p.id = r.participant_id
        WHERE p.email = :e AND r.session_id = :sid
    """), {"e": email, "sid": session_id}).fetchone()

    return {"registered": bool(row), "participant_uid": row.participant_uid if row else None}
