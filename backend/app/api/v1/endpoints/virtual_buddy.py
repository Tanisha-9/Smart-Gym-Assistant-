from fastapi import APIRouter, Depends, WebSocket
from app.services.ai_modules.buddy_service import BuddyService
from app.core.database import get_db
from app.core.config import DEMO_MODE 

router = APIRouter()
buddy_service = BuddyService()


@router.post("/chat/{user_id}")
async def chat_with_buddy(user_id: str, message: str, db=Depends(get_db)):

    if DEMO_MODE:
        import random
        responses = [
            "You're doing great! Keep pushing your limits. 💪",
            "Consistency is key! Every workout counts. 🔥",
            "I'm so proud of your progress today! 🏆",
            "Remember why you started. You've got this! 🌟",
            "Stronger every day! Let's crush those goals. ⚡",
            "Don't forget to stay hydrated! Water is your best friend. 💧",
            "Rest is just as important as the gym. Make sure you're sleeping well! 😴",
            "Visualizing your success is half the battle. You're a champion! 🏅",
            "That's the spirit! Discipline over motivation, always. 👊"
        ]
        return {
            "response": random.choice(responses),
            "sentiment": "positive",
            "emotion": "energized"
        }


    user = await db.users.find_one({"_id": user_id})
    history = await db.chat_history.find({"user_id": user_id}).sort("timestamp", -1).limit(10).to_list(10)

    result = await buddy_service.respond(message, user, history)

    await db.chat_history.insert_one({
        "user_id": user_id,
        "user_message": message,
        "ai_response": result["response"],
        "sentiment": result["sentiment"],
        "emotion": result["emotion"]
    })

    return result


@router.websocket("/ws/{user_id}")
async def buddy_websocket(websocket: WebSocket, user_id: str, db=Depends(get_db)):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()

            if DEMO_MODE:
                import random
                responses = ["Keep it up!", "Amazing work!", "Don't stop now!", "You're a machine!"]
                await websocket.send_json({
                    "response": f"🔥 {random.choice(responses)}",
                    "sentiment": "positive",
                    "emotion": "energized"
                })
                continue

            user = await db.users.find_one({"_id": user_id})
            result = await buddy_service.respond(message, user, [])
            await websocket.send_json(result)

    except Exception:
        await websocket.close()


@router.get("/mood-history/{user_id}")
async def get_mood_history(user_id: str, days: int = 7, db=Depends(get_db)):

    if DEMO_MODE:
        return {"mood": "Happy", "trend": "Improving 📈"}

    logs = await db.chat_history.find({"user_id": user_id}).sort("timestamp", -1).limit(days * 5).to_list(days * 5)
    return await buddy_service.aggregate_mood(logs)


@router.post("/daily-motivation/{user_id}")
async def get_daily_motivation(user_id: str, db=Depends(get_db)):

    if DEMO_MODE:
        return {"motivation": "You're doing amazing! Keep pushing 💪🔥"}

    user = await db.users.find_one({"_id": user_id})
    streak_data = await db.habit_logs.find({"user_id": user_id}).sort("date", -1).limit(7).to_list(7)

    message = await buddy_service.daily_motivation(user, streak_data)
    return {"motivation": message}