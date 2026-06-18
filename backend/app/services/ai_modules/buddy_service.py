"""
Virtual Buddy Service - Combines HuggingFace Inference API + sentiment analysis
for an empathetic AI gym companion.

Migration: OpenAI replaced with HuggingFace Inference API (Zephyr-7B-Beta).
Sentiment pipeline unchanged (already HuggingFace).
"""
import httpx
from transformers import pipeline
from app.core.config import settings

HF_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
HF_HEADERS = {"Authorization": f"Bearer {settings.HUGGINGFACE_TOKEN}"}

# Local sentiment model — unchanged
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

SYSTEM_PROMPT = (
    "You are an enthusiastic, empathetic AI gym buddy named Alex. "
    "You know the user's fitness goals and adapt your tone to their emotional state. "
    "Keep responses short (2-4 sentences), energetic, and personal. "
    "When user is sad/tired: be gentle and encouraging. "
    "When user is energetic: match their energy. "
    "Always end with a micro action step they can take right now."
)


async def _hf_generate(prompt: str, max_new_tokens: int = 200) -> str:
    """Call HuggingFace Inference API and return generated text."""
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": 0.85,
            "return_full_text": False,
            "do_sample": True,
        }
    }
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(HF_API_URL, headers=HF_HEADERS, json=payload)
        r.raise_for_status()
        return r.json()[0]["generated_text"].strip()


def _build_zephyr_prompt(system: str, history: list, user_msg: str) -> str:
    """
    Build Zephyr-7B-Beta chat prompt (ChatML-style with special tokens).
    Format: <|system|>...</s> <|user|>...</s> <|assistant|>
    """
    prompt = f"<|system|>\n{system}</s>\n"
    for h in history[-6:]:
        prompt += f"<|user|>\n{h['user_message']}</s>\n"
        prompt += f"<|assistant|>\n{h['ai_response']}</s>\n"
    prompt += f"<|user|>\n{user_msg}</s>\n<|assistant|>\n"
    return prompt


class BuddyService:

    async def respond(self, message: str, user: dict, history: list) -> dict:
        sentiment_result = sentiment_analyzer(message[:512])[0]
        sentiment = sentiment_result["label"]
        emotion = self._classify_emotion(message, sentiment)

        system = SYSTEM_PROMPT
        if user:
            system += (
                f"\nUser: {user.get('name', 'there')}. "
                f"Goal: {user.get('fitness_goal', 'fitness')}. "
                f"Emotional state detected: {emotion}."
            )

        prompt = _build_zephyr_prompt(system, history, message)
        reply = await _hf_generate(prompt, max_new_tokens=200)

        return {
            "response": reply,
            "sentiment": sentiment,
            "emotion": emotion,
            "confidence": round(sentiment_result["score"], 2)
        }

    def _classify_emotion(self, text: str, sentiment: str) -> str:
        text_lower = text.lower()
        if any(w in text_lower for w in ["tired", "exhausted", "dead", "sore"]):
            return "fatigued"
        if any(w in text_lower for w in ["sad", "depressed", "unmotivated", "giving up"]):
            return "discouraged"
        if any(w in text_lower for w in ["great", "amazing", "pumped", "fired up"]):
            return "energized"
        if any(w in text_lower for w in ["anxious", "nervous", "worried", "scared"]):
            return "anxious"
        return "neutral" if sentiment == "NEGATIVE" else "positive"

    async def daily_motivation(self, user: dict, streak_data: list) -> str:
        streak = len(streak_data)
        name = user.get("name", "Champion")
        goal = user.get("fitness_goal", "fitness")
        user_msg = (
            f"Generate a short (2-3 sentence) personalized motivational message for {name}. "
            f"They have a {streak}-day streak and their goal is {goal}. Be energetic and specific."
        )
        prompt = _build_zephyr_prompt(SYSTEM_PROMPT, [], user_msg)
        return await _hf_generate(prompt, max_new_tokens=120)

    async def aggregate_mood(self, chat_history: list) -> dict:
        mood_map = {"POSITIVE": 1, "NEGATIVE": -1}
        emotion_counts: dict = {}
        dates, scores = [], []
        for item in chat_history:
            dates.append(str(item.get("timestamp", ""))[:10])
            scores.append(mood_map.get(item.get("sentiment", "POSITIVE"), 0))
            e = item.get("emotion", "neutral")
            emotion_counts[e] = emotion_counts.get(e, 0) + 1
        return {
            "dates": dates[::-1],
            "mood_scores": scores[::-1],
            "emotion_breakdown": emotion_counts,
            "average_sentiment": sum(scores) / max(len(scores), 1)
        }
