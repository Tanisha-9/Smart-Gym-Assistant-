import cv2, numpy as np
from fastapi import APIRouter, UploadFile, File, WebSocket, Depends
from fastapi.responses import JSONResponse
from app.schemas.models import PoseFeedback, WorkoutPlan
from app.services.ai_modules.pose_service import PoseAnalysisService
from app.core.database import get_db
from app.core.config import DEMO_MODE

router = APIRouter()
pose_service = PoseAnalysisService()

@router.post("/generate-plan/{user_id}", response_model=WorkoutPlan)
async def generate_workout_plan(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return WorkoutPlan(
            user_id=user_id,
            title="Demo Power Routine",
            difficulty="intermediate",
            estimated_duration_mins=45,
            exercises=[
                {"name": "Squats", "sets": 3, "reps": 12, "rest_secs": 60},
                {"name": "Push Ups", "sets": 3, "reps": 15, "rest_secs": 45},
                {"name": "Plank", "sets": 3, "reps": 1, "duration_secs": 60, "rest_secs": 30},
                {"name": "Bicep Curls", "sets": 3, "reps": 12, "rest_secs": 60},
            ]
        )
    
    user = await db.users.find_one({"_id": user_id})
    if not user:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    plan = await pose_service.generate_plan(user)
    await db.workout_plans.insert_one(plan.dict())
    return plan

@router.post("/analyze-frame", response_model=PoseFeedback)
async def analyze_pose_frame(exercise: str, frame: UploadFile = File(...)):
    contents = await frame.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return await pose_service.analyze(img, exercise)

@router.websocket("/ws/live-session/{user_id}/{exercise}")
async def live_workout_session(websocket: WebSocket, user_id: str, exercise: str):
    await websocket.accept()
    session = pose_service.new_session(exercise)
    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            feedback = await pose_service.analyze_frame(img, session)
            await websocket.send_json(feedback.dict())
    except Exception:
        await websocket.close()

@router.get("/history/{user_id}")
async def get_workout_history(user_id: str, limit: int = 10, db=Depends(get_db)):
    if DEMO_MODE:
        from datetime import datetime, timedelta
        now = datetime.now()
        return {
            "sessions": [
                {
                    "exercise": "Squats",
                    "reps": 45,
                    "accuracy": 0.88,
                    "duration_secs": 600,
                    "created_at": (now - timedelta(days=1)).isoformat()
                },
                {
                    "exercise": "Push Ups",
                    "reps": 30,
                    "accuracy": 0.92,
                    "duration_secs": 450,
                    "created_at": (now - timedelta(days=2)).isoformat()
                }
            ]
        }
    sessions = await db.workout_sessions.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"sessions": sessions}
