import json
from fastapi import APIRouter, Depends
from app.schemas.models import IoTReading
from app.services.ai_modules.iot_service import IoTService
from app.core.database import get_db

router = APIRouter()
iot_service = IoTService()

@router.post("/reading")
async def receive_iot_reading(reading: IoTReading, db=Depends(get_db)):
    await db.iot_readings.insert_one(reading.dict())
    recommendation = await iot_service.get_recommendation(reading)
    return {"reading_saved": True, "recommendation": recommendation}

@router.get("/equipment-status/{gym_id}")
async def get_equipment_status(gym_id: str, db=Depends(get_db)):
    readings = await db.iot_readings.find({"gym_id": gym_id}).sort("timestamp", -1).limit(50).to_list(50)
    return {"equipment": readings}

@router.get("/recommend-rest/{user_id}")
async def recommend_rest(user_id: str, db=Depends(get_db)):
    recent = await db.iot_readings.find({"user_id": user_id}).sort("timestamp", -1).limit(20).to_list(20)
    return await iot_service.recommend_rest(recent)
