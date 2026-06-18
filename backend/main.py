from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import trainer, dietician, habit_tracker, virtual_buddy, pose_analyzer, recommender, iot, users
from app.core.config import settings
from app.core.database import connect_db, disconnect_db

import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="GymGenie",
    description="Unified AI-powered fitness ecosystem",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"ERROR: Internal Server Error on {request.url}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_event_handler("startup", connect_db)
app.add_event_handler("shutdown", disconnect_db)

app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(trainer.router,          prefix="/api/v1/trainer",    tags=["AI Trainer"])
app.include_router(dietician.router,        prefix="/api/v1/dietician",  tags=["Dietician"])
app.include_router(habit_tracker.router,    prefix="/api/v1/habits",     tags=["Habit Tracker"])
app.include_router(virtual_buddy.router,    prefix="/api/v1/buddy",      tags=["Virtual Buddy"])
app.include_router(pose_analyzer.router,    prefix="/api/v1/pose",       tags=["Pose Analyzer"])
app.include_router(recommender.router,      prefix="/api/v1/recommend",  tags=["Recommender"])
app.include_router(iot.router,              prefix="/api/v1/iot",        tags=["IoT"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
