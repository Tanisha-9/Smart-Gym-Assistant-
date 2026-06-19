# GymGenie 🧞‍♂️🏋️
### Unified AI-Powered Fitness & Nutrition Ecosystem

GymGenie is a cutting-edge fitness platform that combines AI pose analysis, personalized nutrition, and smart habit tracking into a single seamless experience.

---

## 🚀 Quick Start (Demo Mode)
The application is pre-configured with **Demo Mode**, allowing you to test all features without needing a live MongoDB database or AI API keys.

### 1. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8080
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Access the app at http://localhost:3003 (or the port shown in your terminal).*

---

## 🛠️ Key Features
- **🤖 Virtual Gym Buddy (Alex)**: Real-time motivational chat powered by sentiment analysis.
- **🏋️ AI Trainer**: Real-time pose detection and repetition counting for exercises like squats and bicep curls.
- **🥗 Smart Dietician**: Personalized meal plans and grocery lists based on your BMI and fitness goals.
- **📈 Habit Analytics**: Advanced tracking of workout consistency, mood, and energy levels.
- **🎮 IoT Integration**: Mock equipment status and recovery recommendations.

---

## 🧰 Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), Pydantic, Motor (Async MongoDB).
- **AI/ML**: MediaPipe (Pose), HuggingFace (NLP).

---

