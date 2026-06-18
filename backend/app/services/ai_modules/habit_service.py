"""
Habit Tracker Service - Behavioral AI using scikit-learn RandomForest
to predict workout skips and optimize schedules.
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from datetime import datetime, date, timedelta
from typing import List, Dict
from app.schemas.models import SkipPrediction

class HabitService:
    def __init__(self):
        self.models: Dict[str, RandomForestClassifier] = {}  # per-user models
        self.scalers: Dict[str, StandardScaler] = {}

    def _extract_features(self, log: dict) -> List[float]:
        """Extract feature vector from a habit log entry."""
        dt = log["date"]
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt)
        return [
            dt.weekday(),               # 0=Mon, 6=Sun
            dt.hour,                    # Time of day
            log.get("mood", 3),         # 1-5
            log.get("energy_level", 3), # 1-5
            int(log.get("workout_completed", False)),
        ]

    async def update_model(self, user_id: str, db):
        """Re-train skip prediction model with latest user data."""
        logs = await db.habit_logs.find({"user_id": user_id}).to_list(None)
        if len(logs) < 10:
            return  # Not enough data yet

        X = [self._extract_features(l)[:-1] for l in logs]  # Exclude label
        y = [int(not l.get("workout_completed", True)) for l in logs]  # 1=skipped

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = RandomForestClassifier(n_estimators=50, random_state=42)
        model.fit(X_scaled, y)

        self.models[user_id] = model
        self.scalers[user_id] = scaler

    async def predict_skip(self, user_id: str, history: list) -> SkipPrediction:
        """Predict probability of skipping today's workout."""
        now = datetime.now()

        if user_id not in self.models:
            # Fallback: rule-based prediction
            recent_skips = sum(1 for l in history[-5:] if not l.get("workout_completed"))
            prob = recent_skips / 5 if history else 0.3
        else:
            features = [[now.weekday(), now.hour, 3, 3]]
            scaled = self.scalers[user_id].transform(features)
            prob = float(self.models[user_id].predict_proba(scaled)[0][1])

        nudge = self._get_nudge(prob, now)
        best_time = self._suggest_best_time(history)

        return SkipPrediction(
            user_id=user_id,
            skip_probability=round(prob, 2),
            recommended_nudge=nudge,
            best_time_to_workout=best_time
        )

    def _get_nudge(self, probability: float, now: datetime) -> str:
        if probability > 0.75:
            return "🔥 You've been crushing it! Don't break the streak — even 20 minutes counts!"
        elif probability > 0.5:
            return "💪 Your body is built in the gym, your shape in the kitchen. Let's go!"
        elif probability > 0.25:
            return "✅ Great consistency! Keep the momentum going today."
        else:
            return "🏆 You're in the zone — champion mindset!"

    def _suggest_best_time(self, history: list) -> str:
        """Find the hour with highest workout completion rate."""
        hour_completions = {}
        for log in history:
            dt = log.get("date")
            if isinstance(dt, str):
                dt = datetime.fromisoformat(dt)
            h = dt.hour if dt else 8
            completed = log.get("workout_completed", False)
            if h not in hour_completions:
                hour_completions[h] = {"done": 0, "total": 0}
            hour_completions[h]["total"] += 1
            if completed:
                hour_completions[h]["done"] += 1

        if not hour_completions:
            return "7:00 AM"

        best_hour = max(
            hour_completions,
            key=lambda h: hour_completions[h]["done"] / max(hour_completions[h]["total"], 1)
        )
        ampm = "AM" if best_hour < 12 else "PM"
        h12 = best_hour if best_hour <= 12 else best_hour - 12
        return f"{h12}:00 {ampm}"

    async def calculate_streak(self, user_id: str, db) -> dict:
        """Calculate current workout streak."""
        logs = await db.habit_logs.find(
            {"user_id": user_id, "workout_completed": True}
        ).sort("date", -1).to_list(None)

        streak = 0
        check_date = date.today()

        completed_dates = set()
        for l in logs:
            d = l["date"]
            if isinstance(d, datetime):
                d = d.date()
            elif isinstance(d, str):
                d = date.fromisoformat(d[:10])
            completed_dates.add(d)

        while check_date in completed_dates:
            streak += 1
            check_date -= timedelta(days=1)

        badges = []
        if streak >= 7:  badges.append("🏅 Week Warrior")
        if streak >= 30: badges.append("🥇 Month Master")
        if streak >= 100: badges.append("💎 Century Club")

        return {"streak": streak, "badges": badges, "total_workouts": len(logs)}

    async def optimize_schedule(self, user_id: str, history: list) -> dict:
        """Suggest optimal workout days/times based on engagement patterns."""
        best_days = {}
        for log in history:
            if log.get("workout_completed"):
                dt = log.get("date")
                if isinstance(dt, str):
                    dt = datetime.fromisoformat(dt)
                day_name = dt.strftime("%A")
                best_days[day_name] = best_days.get(day_name, 0) + 1

        sorted_days = sorted(best_days, key=best_days.get, reverse=True)[:4]
        return {
            "recommended_days": sorted_days or ["Monday", "Wednesday", "Friday", "Saturday"],
            "preferred_time": self._suggest_best_time(history)
        }

    async def get_analytics(self, user_id: str, days: int, db) -> dict:
        """Prepare chart data for frontend dashboard."""
        cutoff = datetime.now() - timedelta(days=days)
        logs = await db.habit_logs.find({
            "user_id": user_id,
            "date": {"$gte": cutoff}
        }).sort("date", 1).to_list(None)

        return {
            "dates": [str(l["date"])[:10] for l in logs],
            "mood": [l.get("mood", 3) for l in logs],
            "energy": [l.get("energy_level", 3) for l in logs],
            "completed": [int(l.get("workout_completed", False)) for l in logs],
            "completion_rate": sum(1 for l in logs if l.get("workout_completed")) / max(len(logs), 1)
        }