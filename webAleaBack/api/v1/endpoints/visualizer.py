from fastapi import APIRouter
from pydantic import BaseModel
import logging
import traceback

from model.openalea.visualizer.utils.visualizer_service import resolve_visualization
from model.openalea.cache.object_cache import (
    cache_cleanup,
)

router = APIRouter()


class VisualizationRequest(BaseModel):
    node_id: str
    visualization_data: dict = {}


@router.post("/visualize")
def visualize_node(request: VisualizationRequest):
    try:
        node_id = request.node_id
        payload = request.visualization_data or {}
        logging.info(
            "Visualizer request node=%s payload_keys=%s outputs=%s has_scene_ref=%s",
            node_id,
            list(payload.keys()),
            len(payload.get("outputs", [])) if isinstance(payload.get("outputs"), list) else 0,
            bool(payload.get("scene_ref"))
        )
        cache_cleanup()
        return resolve_visualization(node_id, payload)

    except Exception as e:
        logging.exception("Visualizer endpoint error node=%s", request.node_id)
        return {
            "nodeId": request.node_id,
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }


