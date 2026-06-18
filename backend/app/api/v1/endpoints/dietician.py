from fastapi import APIRouter, Depends
from app.schemas.models import DietPlan
from app.services.ai_modules.diet_service import DietService
from app.core.database import get_db
from app.core.config import DEMO_MODE

router = APIRouter()
diet_service = DietService()


@router.post("/generate-plan/{user_id}", response_model=DietPlan)
async def generate_diet_plan(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return DietPlan(
            user_id=user_id,
            daily_calories=2400,
            meals=[
                {"name": "Oatmeal with Blueberries & Flax", "calories": 400, "protein_g": 15, "carbs_g": 60, "fats_g": 12, "ingredients": ["Oats", "Blueberries", "Flax seeds", "Almond milk"]},
                {"name": "Grilled Chicken with Quinoa", "calories": 650, "protein_g": 50, "carbs_g": 45, "fats_g": 18, "ingredients": ["Chicken breast", "Quinoa", "Spinach", "Lemon"]},
                {"name": "Whey Protein Shake & Apple", "calories": 250, "protein_g": 30, "carbs_g": 25, "fats_g": 3, "ingredients": ["Protein powder", "Water", "Apple"]},
                {"name": "Baked Salmon & Sweet Potato", "calories": 700, "protein_g": 45, "carbs_g": 50, "fats_g": 28, "ingredients": ["Salmon", "Sweet potato", "Asparagus", "Olive oil"]},
                {"name": "Greek Yogurt & Walnuts", "calories": 400, "protein_g": 25, "carbs_g": 15, "fats_g": 25, "ingredients": ["Greek yogurt", "Walnuts", "Honey"]}
            ],
            grocery_list=["Chicken breast", "Salmon", "Oats", "Quinoa", "Sweet potato", "Greek yogurt", "Walnuts", "Blueberries", "Spinach", "Asparagus"]
        )

    user = await db.users.find_one({"_id": user_id})
    plan = await diet_service.generate_plan(user)
    await db.diet_plans.insert_one(plan.dict())
    return plan

@router.post("/log-meal/{user_id}")
async def log_meal(user_id: str, meal: dict, db=Depends(get_db)):
    if DEMO_MODE:
        return {"status": "success", "calories_added": meal.get("calories", 0)}
    await db.meal_logs.insert_one({**meal, "user_id": user_id})
    return {"status": "success"}

@router.get("/grocery-list/{user_id}")
async def get_grocery_list(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"grocery_list": ["Chicken breast", "Broccoli", "Brown rice", "Avocado", "Greek yogurt"]}
    plan = await db.diet_plans.find_one({"user_id": user_id})
    return {"grocery_list": plan.get("grocery_list", []) if plan else []}

@router.post("/chat")
async def diet_chat(user_id: str, message: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {"reply": f"Diet Suggestion: Focus on high-protein meals for recovery. You said: {message}"}
    user = await db.users.find_one({"_id": user_id})
    reply = await diet_service.chat(message, user)
    return {"reply": reply}

@router.get("/nutrition-summary/{user_id}")
async def nutrition_summary(user_id: str, db=Depends(get_db)):
    if DEMO_MODE:
        return {
            "calories": 1850,
            "protein": 120,
            "carbs": 180,
            "fats": 65,
            "status": "On track"
        }
    return await diet_service.get_daily_summary(user_id, db)