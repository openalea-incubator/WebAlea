from fastapi import APIRouter
from pydantic import BaseModel
import traceback

from model.openalea.visualizer.visualizer_utils import json_from_result

router = APIRouter()


class VisualizationRequest(BaseModel):
    node_id: str
    visualization_data: dict = {}


def _extract_scene_from_payload(payload: dict):
    if not payload:
        return None

    # Already serialized scene
    if "scene" in payload and isinstance(payload["scene"], dict):
        return payload["scene"]
    if "objects" in payload and isinstance(payload["objects"], list):
        return {"objects": payload["objects"]}

    # Outputs list from execution results
    outputs = payload.get("outputs")
    if isinstance(outputs, list):
        for output in outputs:
            value = output.get("value") if isinstance(output, dict) else None
            if not value:
                continue

            # Marker-based payload from backend serialization
            if isinstance(value, dict) and value.get("__type__") == "plantgl_scene":
                return value.get("scene")

            # Raw scene already embedded
            if isinstance(value, dict) and "objects" in value:
                return value

    return None


@router.post("/visualize")
def visualize_node(request: VisualizationRequest):
    try:
        node_id = request.node_id
        payload = request.visualization_data or {}

        scene = _extract_scene_from_payload(payload)
        if scene:
            return {"nodeId": node_id, "success": True, "scene": scene}

        # If a raw PlantGL object was passed (non-JSON), attempt serialization
        raw = payload.get("raw") if isinstance(payload, dict) else None
        if raw is not None:
            scene = json_from_result(raw)
            if scene and "error" not in scene:
                return {"nodeId": node_id, "success": True, "scene": scene}

        return {
            "nodeId": node_id,
            "success": False,
            "error": "No visualizable data found in visualization_data"
        }

    except Exception as e:
        return {
            "nodeId": request.node_id,
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }


