"""API v1 router configuration."""
from fastapi import APIRouter
from api.v1.endpoints import manager, runner, inspector, visualizer
from core.config import settings

router = APIRouter()

# Include the items router
# router list
routers = [
    (manager.router, f"{settings.API_V1_STR}/manager", ["manager"]),
    (runner.router, f"{settings.API_V1_STR}/runner", ["runner"]),
    (inspector.router, f"{settings.API_V1_STR}/inspector", ["inspector"]),
    (visualizer.router, f"{settings.API_V1_STR}/visualizer", ["visualizer"]),
]

for router_item, prefix, tags in routers:
    router.include_router(router_item, prefix=prefix, tags=tags)
