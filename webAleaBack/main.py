from fastapi import FastAPI
from contextlib import asynccontextmanager
from core.config import settings
from api.v1 import router as v1_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application startup logic
    print(f"Application '{settings.PROJECT_NAME}' starting up...")
    yield
    # Application shutdown logic
    print(f"Application '{settings.PROJECT_NAME}' shutting down...")

# Initialize the main FastAPI application instance
webAleaBack = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="",
    lifespan=lifespan
)

# Include the API router
webAleaBack.include_router(
    v1_router.router,
)

# A simple root endpoint
@webAleaBack.get("/")
def read_root():
    # returns a welcome message with the differents routes available
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}!",
        "available_routes": {
            "hello": f"{settings.API_V1_STR}/hello"
        }
    }
