from fastapi import APIRouter, Depends
from app.services.ai_modules.recommender_service import RecommenderService
from app.core.database import get_db
from app.core.config import DEMO_MODE

router = APIRouter()
rec_service = RecommenderService()

@router.get("/gyms")
async def recommend_gyms(lat: float, lng: float, user_id: str, radius_km: float = 5.0, db=Depends(get_db)):
    if DEMO_MODE:
        return {"gyms": [
            {"name": "Elite Fitness", "lat": lat + 0.01, "lng": lng + 0.01, "distance": "0.5 km"},
            {"name": "Power Gym", "lat": lat - 0.01, "lng": lng - 0.01, "distance": "0.8 km"}
        ]}
    user = await db.users.find_one({"_id": user_id})
    return {"gyms": await rec_service.recommend_gyms(lat, lng, radius_km, user)}

@router.get("/programs/{user_id}")
async def recommend_programs(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"programs": ["Gold Gym", "Cult Fit", "Anytime Fitness"]}
    user = await db.users.find_one({"_id": user_id})
    history = await db.workout_sessions.find({"user_id": user_id}).to_list(None)
    return {"programs": await rec_service.recommend_programs(user, history, db)}

@router.get("/challenges/{user_id}")
async def recommend_challenges(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"challenges": ["30 Day Plank Challenge", "100 Pushup Challenge", "Morning Yoga Streak"]}
    user = await db.users.find_one({"_id": user_id})
    return {"challenges": await rec_service.get_challenges(user)}

@router.post("/join-challenge/{user_id}/{challenge_id}")
async def join_challenge(user_id: str, challenge_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"enrolled": True, "enrollment_id": "demo_enroll"}
    result = await db.challenge_enrollments.insert_one({"user_id": user_id, "challenge_id": challenge_id, "day": 1, "completed_days": []})
    return {"enrolled": True, "enrollment_id": str(result.inserted_id)}
