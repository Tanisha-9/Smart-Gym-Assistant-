from fastapi import APIRouter, Depends
from app.schemas.models import HabitLog, SkipPrediction
from app.services.ai_modules.habit_service import HabitService
from app.core.database import get_db
from app.core.config import DEMO_MODE

router = APIRouter()
habit_service = HabitService()

@router.post("/log/{user_id}")
async def log_habit(user_id: str, log: HabitLog, db=Depends(get_db)):

    if DEMO_MODE:
        return {"streak": 5, "consistency": "Good"}
    
    await db.habit_logs.insert_one(log.dict())
    await habit_service.update_model(user_id, db)
    return {"logged": True}

@router.get("/predict-skip/{user_id}", response_model=SkipPrediction)
async def predict_skip(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return SkipPrediction(
            user_id=user_id,
            skip_probability=0.15,
            recommended_nudge="Don't break your streak! A quick 15-min session is better than nothing.",
            best_time_to_workout="6:00 PM"
        )
    history = await db.habit_logs.find({"user_id": user_id}).sort("date", -1).limit(30).to_list(30)
    return await habit_service.predict_skip(user_id, history)

@router.get("/streak/{user_id}")
async def get_streak(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"streak": 12, "total_workouts": 45, "badges": ["Consistency King", "Early Bird"]}
    return await habit_service.calculate_streak(user_id, db)

@router.put("/adjust-schedule/{user_id}")
async def adjust_schedule(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"updated_schedule": "Evening sessions recommended based on your energy levels."}
    history = await db.habit_logs.find({"user_id": user_id}).to_list(None)
    new_schedule = await habit_service.optimize_schedule(user_id, history)
    await db.schedules.update_one({"user_id": user_id}, {"$set": {"schedule": new_schedule}}, upsert=True)
    return {"updated_schedule": new_schedule}

@router.get("/analytics/{user_id}")
async def get_habit_analytics(user_id: str, days: int = 30, db=Depends(get_db)):
    if DEMO_MODE:
        return {
            "dates": [
                "2024-04-01", "2024-04-02", "2024-04-03", "2024-04-04", "2024-04-05",
                "2024-04-06", "2024-04-07", "2024-04-08", "2024-04-09", "2024-04-10",
                "2024-04-11", "2024-04-12", "2024-04-13", "2024-04-14"
            ],
            "mood": [3, 4, 4, 5, 4, 3, 4, 5, 5, 4, 5, 4, 3, 5],
            "energy": [4, 3, 5, 4, 4, 3, 5, 4, 5, 5, 4, 4, 5, 5],
            "completed": [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
            "completion_rate": 0.78
        }
    return await habit_service.get_analytics(user_id, days, db)
