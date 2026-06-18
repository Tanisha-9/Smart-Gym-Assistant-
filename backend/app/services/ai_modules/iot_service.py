"""
IoT Service — AI logic for smart gym equipment recommendations.
"""

class IoTService:

    async def process_reading(self, reading):
        """Process an IoT sensor reading and store recommendation."""
        return await self.get_recommendation(reading)

    async def get_recommendation(self, reading) -> dict:
        """Recommend resistance/intensity adjustment based on sensor data."""
        metric = reading.metric
        value = reading.value
        equipment = reading.equipment_type

        if metric == "heart_rate":
            if value > 170:
                return {"action": "reduce_intensity", "message": "Heart rate too high — lower resistance by 20%", "urgency": "high"}
            elif value < 100:
                return {"action": "increase_intensity", "message": "Heart rate low — increase resistance by 10%", "urgency": "low"}
            else:
                return {"action": "maintain", "message": "Heart rate in optimal zone. Keep going!", "urgency": "none"}

        if metric == "resistance" and equipment == "bike":
            if value > 15:
                return {"action": "reduce_resistance", "message": "High resistance detected — consider a recovery interval", "urgency": "medium"}

        if metric == "speed" and equipment == "treadmill":
            if value > 14:
                return {"action": "reduce_speed", "message": "Speed is very high — reduce to avoid injury", "urgency": "high"}

        return {"action": "monitor", "message": f"{equipment} running normally at {value} {reading.unit}", "urgency": "none"}

    async def recommend_rest(self, recent_readings: list) -> dict:
        """Recommend rest duration based on recent workout intensity."""
        if not recent_readings:
            return {"rest_seconds": 60, "reason": "Standard rest interval"}

        hr_readings = [r["value"] for r in recent_readings if r.get("metric") == "heart_rate"]
        if hr_readings:
            avg_hr = sum(hr_readings) / len(hr_readings)
            if avg_hr > 160:
                return {"rest_seconds": 120, "reason": "High intensity detected — extended rest recommended"}
            elif avg_hr > 130:
                return {"rest_seconds": 75, "reason": "Moderate intensity — standard rest"}
            else:
                return {"rest_seconds": 45, "reason": "Low intensity — short rest sufficient"}

        return {"rest_seconds": 60, "reason": "Standard rest interval"}
