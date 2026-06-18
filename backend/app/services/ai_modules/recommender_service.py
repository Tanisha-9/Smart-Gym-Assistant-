"""
Gym Recommender Service — collaborative filtering + location-based gym suggestions.
"""
import math

class RecommenderService:

    async def recommend_gyms(self, lat: float, lng: float, radius_km: float, user: dict) -> list:
        """Return mock gym recommendations ranked by distance and goal fit."""
        # In production: call Google Places API + apply CF scoring
        goal = user.get("fitness_goal", "maintenance") if user else "maintenance"
        return [
            {"name": "FitZone Pro", "distance_km": 1.2, "rating": 4.8, "amenities": ["weights", "cardio", "pool"], "goal_match": goal},
            {"name": "Iron Temple Gym", "distance_km": 2.5, "rating": 4.5, "amenities": ["weights", "powerlifting"], "goal_match": goal},
            {"name": "Wellness Hub", "distance_km": 3.1, "rating": 4.3, "amenities": ["yoga", "cardio", "spa"], "goal_match": goal},
        ]

    async def recommend_programs(self, user: dict, history: list, db) -> list:
        """Recommend workout programs based on user goal and history."""
        goal = user.get("fitness_goal", "maintenance") if user else "maintenance"
        programs = {
            "weight_loss": [
                {"id": "p1", "name": "HIIT Burn 30", "duration_weeks": 4, "difficulty": "intermediate"},
                {"id": "p2", "name": "Cardio Blast", "duration_weeks": 6, "difficulty": "beginner"},
            ],
            "muscle_gain": [
                {"id": "p3", "name": "5x5 Strength", "duration_weeks": 8, "difficulty": "intermediate"},
                {"id": "p4", "name": "PPL Split", "duration_weeks": 12, "difficulty": "advanced"},
            ],
            "maintenance": [
                {"id": "p5", "name": "Full Body 3x", "duration_weeks": 4, "difficulty": "beginner"},
            ],
        }
        return programs.get(goal, programs["maintenance"])

    async def get_challenges(self, user: dict) -> list:
        """Return fitness challenges appropriate for user level."""
        return [
            {"id": "c1", "name": "30-Day Squat Challenge", "duration_days": 30, "category": "strength"},
            {"id": "c2", "name": "10K Steps Daily", "duration_days": 21, "category": "cardio"},
            {"id": "c3", "name": "7-Day Plank Progression", "duration_days": 7, "category": "core"},
        ]

    async def find_similar_users(self, user: dict, db) -> list:
        """Find users with similar fitness profiles (stub — extend with real CF)."""
        if not user:
            return []
        goal = user.get("fitness_goal")
        similar = await db.users.find(
            {"fitness_goal": goal, "_id": {"$ne": user.get("_id")}}
        ).limit(5).to_list(5)
        return [{"id": str(u["_id"]), "name": u.get("name"), "goal": u.get("fitness_goal")} for u in similar]
