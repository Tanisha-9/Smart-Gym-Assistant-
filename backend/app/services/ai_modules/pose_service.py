"""
Pose Analysis Service - Uses MediaPipe for real-time pose detection,
rep counting, and form feedback.
"""
import cv2
import mediapipe as mp
import numpy as np
from typing import Optional
from app.schemas.models import PoseFeedback, WorkoutPlan, Exercise

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

class WorkoutSession:
    def __init__(self, exercise: str):
        self.exercise = exercise
        self.rep_count = 0
        self.stage = None   # "up" or "down"
        self.form_scores = []
        self.corrections = []

class PoseAnalysisService:
    def __init__(self):
        self._pose = None

    @property
    def pose(self):
        if self._pose is None:
            self._pose = mp_pose.Pose(
                min_detection_confidence=0.7,
                min_tracking_confidence=0.7
            )
        return self._pose

    def new_session(self, exercise: str) -> WorkoutSession:
        return WorkoutSession(exercise)

    def _get_angle(self, a, b, c) -> float:
        """Calculate angle between three landmarks (in degrees)."""
        a = np.array([a.x, a.y])
        b = np.array([b.x, b.y])
        c = np.array([c.x, c.y])

        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - \
                  np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        if angle > 180.0:
            angle = 360 - angle
        return angle

    def _analyze_squat(self, landmarks, session: WorkoutSession):
        """Analyze squat form: knee angle, back alignment, hip depth."""
        lm = landmarks.landmark
        left_hip   = lm[mp_pose.PoseLandmark.LEFT_HIP.value]
        left_knee  = lm[mp_pose.PoseLandmark.LEFT_KNEE.value]
        left_ankle = lm[mp_pose.PoseLandmark.LEFT_ANKLE.value]

        knee_angle = self._get_angle(left_hip, left_knee, left_ankle)
        corrections = []
        form_score = 100.0

        # Rep counting
        if knee_angle < 90:
            session.stage = "down"
        elif knee_angle > 160 and session.stage == "down":
            session.stage = "up"
            session.rep_count += 1

        # Form checks
        if knee_angle < 70:
            corrections.append("Don't go too deep — stop at 90°")
            form_score -= 15

        # Knee over toes check
        if left_knee.x > left_ankle.x + 0.05:
            corrections.append("Keep knees behind toes")
            form_score -= 20

        return form_score, corrections

    def _analyze_bicep_curl(self, landmarks, session: WorkoutSession):
        """Analyze bicep curl: elbow angle, shoulder stability."""
        lm = landmarks.landmark
        shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        elbow    = lm[mp_pose.PoseLandmark.LEFT_ELBOW.value]
        wrist    = lm[mp_pose.PoseLandmark.LEFT_WRIST.value]

        elbow_angle = self._get_angle(shoulder, elbow, wrist)
        corrections = []
        form_score = 100.0

        if elbow_angle > 160:
            session.stage = "down"
        elif elbow_angle < 30 and session.stage == "down":
            session.stage = "up"
            session.rep_count += 1

        if shoulder.y < elbow.y - 0.03:
            corrections.append("Keep elbows tucked to sides")
            form_score -= 20

        return form_score, corrections

    EXERCISE_ANALYZERS = {
        "squat": "_analyze_squat",
        "bicep_curl": "_analyze_bicep_curl",
    }

    async def analyze_frame(self, img: np.ndarray, session: WorkoutSession) -> PoseFeedback:
        """Process a single frame and return feedback."""
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        if not results.pose_landmarks:
            return PoseFeedback(
                exercise=session.exercise,
                rep_count=session.rep_count,
                form_score=0,
                corrections=["Cannot detect pose — ensure full body is visible"],
                performance_score=0
            )

        analyzer_name = self.EXERCISE_ANALYZERS.get(session.exercise, "_analyze_squat")
        analyzer = getattr(self, analyzer_name)
        form_score, corrections = analyzer(results.pose_landmarks, session)

        session.form_scores.append(form_score)
        session.corrections = corrections

        perf_score = np.mean(session.form_scores) if session.form_scores else 0

        return PoseFeedback(
            exercise=session.exercise,
            rep_count=session.rep_count,
            form_score=form_score,
            corrections=corrections,
            performance_score=round(perf_score, 1)
        )

    async def analyze(self, img: np.ndarray, exercise: str) -> PoseFeedback:
        session = self.new_session(exercise)
        return await self.analyze_frame(img, session)

    async def generate_plan(self, user: dict) -> WorkoutPlan:
        """Generate a workout plan based on user profile."""
        from datetime import datetime

        goal = user.get("fitness_goal", "maintenance")
        bmi = user.get("bmi", 22)

        plans = {
            "weight_loss": [
                Exercise(name="Jumping Jacks", sets=3, reps=20, duration_secs=60, rest_secs=30),
                Exercise(name="Squat", sets=4, reps=15, rest_secs=60),
                Exercise(name="Mountain Climbers", sets=3, reps=20, duration_secs=45, rest_secs=30),
                Exercise(name="Burpees", sets=3, reps=10, rest_secs=60),
            ],
            "muscle_gain": [
                Exercise(name="Barbell Squat", sets=4, reps=8, rest_secs=90),
                Exercise(name="Deadlift", sets=3, reps=6, rest_secs=120),
                Exercise(name="Bench Press", sets=4, reps=8, rest_secs=90),
                Exercise(name="Pull-ups", sets=3, reps=8, rest_secs=90),
            ],
            "maintenance": [
                Exercise(name="Squat", sets=3, reps=12, rest_secs=60),
                Exercise(name="Bicep Curl", sets=3, reps=12, rest_secs=60),
                Exercise(name="Plank", sets=3, reps=1, duration_secs=60, rest_secs=45),
                Exercise(name="Jogging", sets=1, reps=1, duration_secs=1200, rest_secs=0),
            ]
        }

        exercises = plans.get(goal, plans["maintenance"])
        return WorkoutPlan(
            user_id=str(user["_id"]),
            title=f"{goal.replace('_', ' ').title()} Workout Plan",
            exercises=exercises,
            difficulty="beginner" if bmi > 30 else "intermediate",
            estimated_duration_mins=45,
            created_at=datetime.utcnow()
        )