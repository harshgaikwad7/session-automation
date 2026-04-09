import os
import uuid
import hashlib
import secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()

# ── Models ─────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str = ""
    password: str
    role: str = "participant"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ── Helpers ────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Simple SHA-256 hash with salt."""
    salt = "sessionflow_renovation_2025"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(32)

# ── ENDPOINTS ──────────────────────────────────────────────────────────────

# POST /api/auth/register
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Validate role
    if data.role not in ("participant", "conductor", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    # Validate password
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Check email already exists
    existing = db.execute(
        text("SELECT id FROM profiles WHERE email = :email"),
        {"email": data.email}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please sign in.")

    # Create profile with hashed password
    user_id = str(uuid.uuid4())
    hashed = hash_password(data.password)

    db.execute(
        text("""
            INSERT INTO profiles (id, full_name, email, phone, role, password_hash)
            VALUES (:id, :full_name, :email, :phone, :role, :password_hash)
        """),
        {
            "id": user_id,
            "full_name": data.full_name,
            "email": data.email,
            "phone": data.phone,
            "role": data.role,
            "password_hash": hashed,
        }
    )
    db.commit()

    return {
        "success": True,
        "message": f"Account created successfully! Welcome, {data.full_name}."
    }


# POST /api/auth/login
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    hashed = hash_password(data.password)

    user = db.execute(
        text("""
            SELECT id, full_name, email, phone, role
            FROM profiles
            WHERE email = :email AND password_hash = :hash
        """),
        {"email": data.email, "hash": hashed}
    ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate a simple session token
    token = generate_token()

    # Store token in DB (sessions table repurposed as tokens — or just return it)
    # For simplicity, store in a tokens column if it exists, else just return token
    try:
        db.execute(
            text("UPDATE profiles SET auth_token = :token WHERE id = :id"),
            {"token": token, "id": str(user.id)}
        )
        db.commit()
    except Exception:
        db.rollback()
        # auth_token column might not exist — that's ok for now

    return {
        "success": True,
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "token": token,
        "message": f"Welcome back, {user.full_name}!"
    }


# GET /api/auth/me?email=...
@router.get("/me")
def get_me(email: str, db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT id, full_name, email, phone, role, created_at FROM profiles WHERE email = :email"),
        {"email": email}
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "joined_on": str(user.created_at)[:10],
    }
