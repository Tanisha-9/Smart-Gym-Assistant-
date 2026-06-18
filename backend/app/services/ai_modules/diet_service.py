"""
Diet Service - NLP-powered meal planning using HuggingFace Inference API.
Computes BMR/TDEE, generates personalized meal plans, tracks intake.

Migration: OpenAI replaced with HuggingFace (Zephyr-7B-Beta for chat/planning).
JSON extraction is handled robustly since open-source models sometimes add preamble.
"""
import httpx
import json
import re
from app.schemas.models import DietPlan, Meal
from app.core.config import settings
from datetime import datetime

HF_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
HF_HEADERS = {"Authorization": f"Bearer {settings.HUGGINGFACE_TOKEN}"}


async def _hf_generate(prompt: str, max_new_tokens: int = 800) -> str:
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": 0.6,
            "return_full_text": False,
            "do_sample": True,
        }
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(HF_API_URL, headers=HF_HEADERS, json=payload)
        r.raise_for_status()
        return r.json()[0]["generated_text"].strip()


def _extract_json(text: str) -> dict:
    """
    Extract JSON from model output even if the model adds surrounding prose.
    Tries: direct parse → extract first {...} block → fallback.
    """
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Extract first JSON object via regex
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Could not extract JSON from model output: {text[:300]}")


class DietService:

    def _calculate_bmr(self, user: dict) -> float:
        """Mifflin-St Jeor BMR formula."""
        w, h, a = user["weight_kg"], user["height_cm"], user["age"]
        return 10 * w + 6.25 * h - 5 * a + 5

    def _calculate_tdee(self, user: dict) -> int:
        return int(self._calculate_bmr(user) * 1.55)

    def _adjust_calories(self, tdee: int, goal: str) -> int:
        adjustments = {
            "weight_loss": -500,
            "muscle_gain": +300,
            "endurance": +200,
            "maintenance": 0,
            "flexibility": 0
        }
        return tdee + adjustments.get(goal, 0)

    async def generate_plan(self, user: dict) -> DietPlan:
        """Use HuggingFace LLM to generate a personalized daily meal plan."""
        tdee = self._calculate_tdee(user)
        target_calories = self._adjust_calories(tdee, user["fitness_goal"])
        diet_pref = user.get("diet_preference", "none")

        prompt = (
            "<|system|>\n"
            "You are a professional dietician AI. You only output valid JSON — no extra text, "
            "no markdown, no preamble. Output must start with { and end with }.\n</s>\n"
            "<|user|>\n"
            f"Generate a full day meal plan in JSON format.\n"
            f"User profile:\n"
            f"- Weight: {user['weight_kg']}kg, Height: {user['height_cm']}cm\n"
            f"- Goal: {user['fitness_goal']}\n"
            f"- Diet preference: {diet_pref}\n"
            f"- Target calories: {target_calories} kcal/day\n\n"
            "Return ONLY valid JSON with this exact structure:\n"
            '{"meals": [{"name": "Breakfast: ...", "calories": 350, "protein_g": 12, '
            '"carbs_g": 55, "fats_g": 8, "ingredients": ["item1", "item2"]}], '
            '"grocery_list": ["item1", "item2"]}\n'
            "Generate 4 meals: Breakfast, Lunch, Snack, Dinner.\n</s>\n"
            "<|assistant|>\n"
        )

        raw = await _hf_generate(prompt, max_new_tokens=900)
        data = _extract_json(raw)

        meals = [Meal(**m) for m in data["meals"]]
        return DietPlan(
            user_id=str(user["_id"]),
            daily_calories=target_calories,
            meals=meals,
            grocery_list=data["grocery_list"],
            created_at=datetime.utcnow()
        )

    async def chat(self, message: str, user: dict) -> str:
        """HuggingFace-powered diet chatbot with user context."""
        system = (
            "You are a friendly AI dietician. Give concise, personalized, actionable advice. "
            f"User profile: weight={user['weight_kg']}kg, goal={user['fitness_goal']}, "
            f"diet={user.get('diet_preference', 'none')}."
        )
        prompt = (
            f"<|system|>\n{system}</s>\n"
            f"<|user|>\n{message}</s>\n"
            "<|assistant|>\n"
        )
        return await _hf_generate(prompt, max_new_tokens=350)

    async def get_daily_summary(self, user_id: str, db) -> dict:
        from datetime import date
        today = datetime.combine(date.today(), datetime.min.time())
        logs = await db.meal_logs.find({
            "user_id": user_id,
            "logged_at": {"$gte": today}
        }).to_list(None)
        total = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0}
        for log in logs:
            meal = log["meal"]
            for key in total:
                total[key] += meal.get(key, 0)
        return total

    async def get_weekly_summary(self, user_id: str, db) -> dict:
        from datetime import date, timedelta
        days = []
        for i in range(7):
            d = date.today() - timedelta(days=i)
            start = datetime.combine(d, datetime.min.time())
            end = datetime.combine(d, datetime.max.time())
            logs = await db.meal_logs.find({
                "user_id": user_id,
                "logged_at": {"$gte": start, "$lte": end}
            }).to_list(None)
            calories = sum(l["meal"].get("calories", 0) for l in logs)
            days.append({"date": str(d), "calories": calories})
        return {"weekly": days[::-1]}
