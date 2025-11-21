"""Main application file for the webAleaBack FastAPI application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from core.config import settings
from api.v1 import router as v1_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """application life span function

    Args:
        app (FastAPI): the application instance
    """
    # Application startup logic
    print(f"Application '{settings.PROJECT_NAME}' starting up...")
    yield
    # Application shutdown logic
    print(f"Application '{settings.PROJECT_NAME}' shutting down...")
    app.state.shutdown_message = "Application has been shut down."

# Initialize the main FastAPI application instance
WEBALEA_BACK = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="",
    lifespan=lifespan
)

# Include the API router
WEBALEA_BACK.include_router(
    v1_router.router,
)

# A simple root endpoint
@WEBALEA_BACK.get("/")
def read_root():
    """
    Root endpoint that returns a welcome message and available routes.
    """
    # list available routes
    routes = {route.path: route.name for route in WEBALEA_BACK.routes}
    # returns a welcome message with the differents routes available
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}!",
        "available_routes": routes
    }
