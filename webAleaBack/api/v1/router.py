from fastapi import APIRouter
from api.v1.endpoints import helloWorld
from core.config import settings

router = APIRouter()

# Include the items router
router.include_router(
        helloWorld.router, prefix=f"{settings.API_V1_STR}/hello", tags=["hello"],
    )
