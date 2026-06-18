from datetime import datetime
import hashlib, secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from app.core.database import get_db
from app.core.config import DEMO_MODE

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    age: int = 25
    weight_kg: float = 70
    height_cm: float = 175
    fitness_goal: str = "maintenance"
    diet_preference: str = "none"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def _hash(pw): return hashlib.sha256(pw.encode()).hexdigest()
def _token(): return "gym_" + secrets.token_hex(24)
def _safe(doc): return {k: v for k, v in doc.items() if k not in ("password_hash",)}

@router.post("/register")
async def register(body: RegisterRequest, db=Depends(get_db)):
    if DEMO_MODE:
        user_id = "demo_user_" + secrets.token_hex(4)
        doc = {**body.model_dump(), "_id": user_id, "created_at": datetime.utcnow().isoformat()}
        doc.pop("password")
        return {"user": doc, "token": "demo_token_" + secrets.token_hex(16)}

    if await db["users"].find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered.")
    
    doc = {**body.model_dump(), "password_hash": _hash(body.password), "created_at": datetime.utcnow().isoformat()}
    doc.pop("password")
    result = await db["users"].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    token = _token()
    await db["sessions"].insert_one({"token": token, "user_id": doc["_id"]})
    return {"user": _safe(doc), "token": token}

@router.post("/login")
async def login(body: LoginRequest, db=Depends(get_db)):
    if DEMO_MODE:
        return {
            "user": {
                "_id": "demo_user_123",
                "name": "Demo Athlete",
                "email": body.email,
                "age": 28,
                "weight_kg": 75,
                "height_cm": 178,
                "fitness_goal": "muscle_gain",
                "diet_preference": "none"
            },
            "token": "demo_token_" + secrets.token_hex(16)
        }

    user = await db["users"].find_one({"email": body.email})
    if not user: raise HTTPException(401, "No account found. Please register first.")
    if user["password_hash"] != _hash(body.password): raise HTTPException(401, "Incorrect password.")
    user["_id"] = str(user["_id"])
    token = _token()
    await db["sessions"].insert_one({"token": token, "user_id": user["_id"]})
    return {"user": _safe(user), "token": token}