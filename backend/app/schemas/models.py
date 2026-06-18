from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FitnessGoal(str, Enum):
    weight_loss = "weight_loss"
    muscle_gain = "muscle_gain"
    endurance = "endurance"
    flexibility = "flexibility"
    maintenance = "maintenance"

class DietPreference(str, Enum):
    vegetarian = "vegetarian"
    vegan = "vegan"
    keto = "keto"
    paleo = "paleo"
    none = "none"

# ── User ──────────────────────────────────────────────
class UserBase(BaseModel):
    name: str
    email: EmailStr
    age: int
    weight_kg: float
    height_cm: float
    fitness_goal: FitnessGoal
    diet_preference: DietPreference = DietPreference.none

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    bmi: float
    created_at: datetime

    class Config:
        from_attributes = True

# ── Workout ───────────────────────────────────────────
class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    duration_secs: Optional[int] = None
    rest_secs: int = 60

class WorkoutPlan(BaseModel):
    user_id: str
    title: str
    exercises: List[Exercise]
    difficulty: str  # beginner / intermediate / advanced
    estimated_duration_mins: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ── Pose Analysis ─────────────────────────────────────
class PoseFrame(BaseModel):
    keypoints: List[dict]   # [{name, x, y, confidence}]
    timestamp_ms: int

class PoseFeedback(BaseModel):
    exercise: str
    rep_count: int
    form_score: float       # 0-100
    corrections: List[str]  # e.g. ["Keep back straight", "Lower hips more"]
    performance_score: float

# ── Diet ──────────────────────────────────────────────
class Meal(BaseModel):
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fats_g: float
    ingredients: List[str]

class DietPlan(BaseModel):
    user_id: str
    daily_calories: int
    meals: List[Meal]
    grocery_list: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ── Habit ─────────────────────────────────────────────
class HabitLog(BaseModel):
    user_id: str
    date: datetime
    workout_completed: bool
    mood: int           # 1-5
    energy_level: int   # 1-5
    notes: Optional[str] = None

class SkipPrediction(BaseModel):
    user_id: str
    skip_probability: float     # 0-1
    recommended_nudge: str
    best_time_to_workout: str

# ── IoT ───────────────────────────────────────────────
class IoTReading(BaseModel):
    device_id: str
    equipment_type: str     # treadmill, bike, weights
    metric: str             # speed, resistance, heart_rate
    value: float
    unit: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)