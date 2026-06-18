from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "GymGenie"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-in-production"

    # Database
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "gymgenie_db"
    POSTGRES_URI: str = "postgresql://user:password@localhost:5432/ai_gym"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # AWS
    AWS_ACCESS_KEY: str = ""
    AWS_SECRET_KEY: str = ""
    AWS_S3_BUCKET: str = "gymgenie_db"

    # HuggingFace — replaces OpenAI
    HUGGINGFACE_TOKEN: str = ""
    # Model to use for all LLM tasks (swap to any HF Inference API compatible model)
    HF_MODEL_ID: str = "HuggingFaceH4/zephyr-7b-beta"

    # MQTT (IoT)
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883

    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    DEMO_MODE: bool = True 
    
    class Config:
        env_file = ".env"
        extra = "ignore"
        
settings = Settings()
DEMO_MODE = settings.DEMO_MODE
