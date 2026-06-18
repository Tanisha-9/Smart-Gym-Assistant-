"""
Performance Service — scores workout sessions and generates weekly reports.
"""
import numpy as np
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose

class PerformanceService:

    def __init__(self):
        self.pose = mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6)

    async def score_frame(self, frame_bytes: bytes, exercise: str) -> dict:
        """Analyze a single frame and return component scores."""
        nparr = np.frombuffer(frame_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"form": 0, "detected": False}

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        if not results.pose_landmarks:
            return {"form": 0, "detected": False}

        # Basic scoring: all landmarks visible = higher score
        visible = sum(1 for lm in results.pose_landmarks.landmark if lm.visibility > 0.5)
        form_score = min(100, (visible / 33) * 100)
        return {"form": round(form_score, 1), "detected": True}

    def aggregate_session(self, frame_scores: list, exercise: str) -> dict:
        """Aggregate per-frame scores into overall session result."""
        valid = [s for s in frame_scores if s.get("detected")]
        if not valid:
            return {"overall_score": 0, "frames_analyzed": 0, "exercise": exercise}

        scores = [s["form"] for s in valid]
        return {
            "exercise": exercise,
            "overall_score": round(np.mean(scores), 1),
            "best_score": round(max(scores), 1),
            "consistency": round(100 - np.std(scores), 1),
            "frames_analyzed": len(valid),
        }

    async def generate_report(self, user_id: str, logs: list) -> dict:
        """Weekly performance summary from stored logs."""
        if not logs:
            return {"user_id": user_id, "message": "No sessions logged yet", "sessions": 0}

        scores = [l.get("overall_score", 0) for l in logs]
        exercises = {}
        for l in logs:
            ex = l.get("exercise", "unknown")
            exercises[ex] = exercises.get(ex, [])
            exercises[ex].append(l.get("overall_score", 0))

        best_ex = max(exercises, key=lambda e: np.mean(exercises[e])) if exercises else "N/A"
        return {
            "user_id": user_id,
            "sessions": len(logs),
            "average_score": round(np.mean(scores), 1),
            "best_exercise": best_ex,
            "trend": "improving" if len(scores) > 1 and scores[0] > scores[-1] else "steady",
        }

    async def generate_tips(self, recent_logs: list) -> list:
        """Generate improvement tips from recent performance logs."""
        if not recent_logs:
            return ["Complete a few sessions first to get personalized tips!"]
        avg = np.mean([l.get("overall_score", 0) for l in recent_logs])
        if avg < 50:
            return ["Focus on slowing down your reps for better form", "Ensure your full body is visible to the camera"]
        elif avg < 75:
            return ["Good progress! Work on keeping consistent depth on each rep", "Try to match your left and right side symmetry"]
        else:
            return ["Excellent form! Consider increasing resistance or reps", "Challenge yourself with a harder variation"]
