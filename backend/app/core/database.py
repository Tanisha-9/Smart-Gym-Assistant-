from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_manager = Database()

async def connect_db():
    db_manager.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_manager.db = db_manager.client[settings.MONGO_DB]
    print(f"Connected to MongoDB: {settings.MONGO_DB}")

async def disconnect_db():
    if db_manager.client:
        db_manager.client.close()

def get_db():
    return db_manager.db