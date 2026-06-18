from fastapi import APIRouter, Depends, UploadFile, File
from typing import List
from app.services.ai_modules.performance_service import PerformanceService
from app.core.database import get_db
from app.core.config import DEMO_MODE   

router = APIRouter()
perf_service = PerformanceService()

@router.post("/score-session/{user_id}")
async def score_workout_session(user_id: str, exercise: str, frames: List[UploadFile] = File(...), db=Depends(get_db)):

    if DEMO_MODE:
     return {"report": "Posture improving, keep it up!"}

    scores = []
    for frame_file in frames:
        contents = await frame_file.read()
        score = await perf_service.score_frame(contents, exercise)
        scores.append(score)
    result = perf_service.aggregate_session(scores, exercise)
    await db.performance_logs.insert_one({"user_id": user_id, "exercise": exercise, **result})
    return result

@router.get("/weekly-report/{user_id}")
async def weekly_report(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {
            "avg_score": 88,
            "total_sessions": 5,
            "best_exercise": "Squats",
            "improvement": "+12%"
        }
    logs = await db.performance_logs.find({"user_id": user_id}).sort("created_at", -1).limit(50).to_list(50)
    return await perf_service.generate_report(user_id, logs)

@router.get("/improvement-tips/{user_id}/{exercise}")
async def get_improvement_tips(user_id: str, exercise: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"tips": ["Keep your chest up during squats", "Control the weight on the way down"]}
    recent = await db.performance_logs.find({"user_id": user_id, "exercise": exercise}).sort("created_at", -1).limit(5).to_list(5)
    tips = await perf_service.generate_tips(recent)
    return {"tips": tips}
