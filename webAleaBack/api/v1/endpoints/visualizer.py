from fastapi import APIRouter
from pydantic import BaseModel
import logging
import traceback

from model.openalea.visualizer.visualizer_utils import json_from_result
from model.openalea.cache.object_cache import (
    cache_cleanup,
    cache_load,
    cache_load_scene_json,
    cache_store_scene_json,
)

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


def _extract_scene_ref_from_payload(payload: dict):
    if not payload:
        return None

    scene_ref = payload.get("scene_ref")
    expected_shape_count = payload.get("scene_ref_expected_shape_count")
    outputs = payload.get("outputs")
    if isinstance(outputs, list):
        for output in outputs:
            value = output.get("value") if isinstance(output, dict) else None
            if not isinstance(value, dict):
                continue
            if value.get("__type__") in {"plantgl_scene_ref", "plantgl_scene_json_ref"} and value.get("__ref__"):
                meta = value.get("__meta__") if isinstance(value.get("__meta__"), dict) else {}
                expected_from_output = meta.get("shape_count")
                # If scene_ref is explicitly provided, use it but still enrich expected shape count from outputs metadata.
                if isinstance(scene_ref, str) and scene_ref:
                    return {
                        "ref": scene_ref,
                        "refType": value.get("__type__"),
                        "expectedShapeCount": expected_shape_count if expected_shape_count is not None else expected_from_output
                    }
                return {
                    "ref": str(value["__ref__"]),
                    "refType": value.get("__type__"),
                    "expectedShapeCount": expected_from_output
                }

    if isinstance(scene_ref, str) and scene_ref:
        return {
            "ref": scene_ref,
            "refType": "plantgl_scene_ref",
            "expectedShapeCount": expected_shape_count
        }

    return None


def _build_scene_response(node_id: str, scene: dict, cache_hit: bool = False):
    response = {
        "nodeId": node_id,
        "success": True,
        "scene": scene,
        "cacheHit": cache_hit,
    }
    if isinstance(scene, dict) and isinstance(scene.get("objects"), list) and len(scene["objects"]) == 0:
        response["warning"] = "Scene contains no objects."
    return response


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

        scene = _extract_scene_from_payload(payload)
        if scene:
            object_count = len(scene.get("objects", [])) if isinstance(scene, dict) else -1
            logging.info("Visualizer using inline scene node=%s objects=%s", node_id, object_count)
            return _build_scene_response(node_id, scene, cache_hit=False)

        scene_ref_data = _extract_scene_ref_from_payload(payload)
        if scene_ref_data:
            scene_ref = scene_ref_data.get("ref")
            scene_ref_type = scene_ref_data.get("refType") or "plantgl_scene_ref"
            expected_shape_count = scene_ref_data.get("expectedShapeCount")
            logging.info(
                "Visualizer extracted scene_ref node=%s ref=%s type=%s expected_shape_count=%s",
                node_id,
                scene_ref,
                scene_ref_type,
                expected_shape_count
            )
            cached_scene_json = cache_load_scene_json(scene_ref)
            if cached_scene_json:
                object_count = len(cached_scene_json.get("objects", [])) if isinstance(cached_scene_json, dict) else -1
                logging.info("Visualizer scene JSON cache hit node=%s ref=%s objects=%s", node_id, scene_ref, object_count)
                return _build_scene_response(node_id, cached_scene_json, cache_hit=True)

            if scene_ref_type == "plantgl_scene_json_ref":
                logging.error("Visualizer scene JSON ref missing on disk ref=%s", scene_ref)
                return {
                    "nodeId": node_id,
                    "success": False,
                    "error": f"Scene JSON cache entry not found: {scene_ref}"
                }

            try:
                raw_cached = cache_load(scene_ref)
            except Exception as e:
                logging.exception("Visualizer failed loading scene object cache node=%s ref=%s", node_id, scene_ref)
                return {
                    "nodeId": node_id,
                    "success": False,
                    "error": f"Failed to load scene cache: {e}",
                }

            scene = json_from_result(raw_cached)
            if scene and "error" not in scene:
                cache_store_scene_json(scene_ref, scene)
                object_count = len(scene.get("objects", [])) if isinstance(scene, dict) else -1
                if isinstance(expected_shape_count, int) and expected_shape_count > 0 and object_count == 0:
                    logging.warning(
                        "Visualizer mismatch ref=%s expected_shape_count=%s but object_count=%s",
                        scene_ref,
                        expected_shape_count,
                        object_count
                    )
                logging.info("Visualizer scene generated from ref node=%s ref=%s objects=%s", node_id, scene_ref, object_count)
                return _build_scene_response(node_id, scene, cache_hit=False)

            logging.error("Visualizer failed serializing cached scene node=%s ref=%s error=%s", node_id, scene_ref, scene)
            return {
                "nodeId": node_id,
                "success": False,
                "error": scene.get("error") if isinstance(scene, dict) else "Failed to serialize cached scene"
            }

        # If a raw PlantGL object was passed (non-JSON), attempt serialization
        raw = payload.get("raw") if isinstance(payload, dict) else None
        if raw is not None:
            logging.info("Visualizer received raw payload node=%s", node_id)
            scene = json_from_result(raw)
            if scene and "error" not in scene:
                object_count = len(scene.get("objects", [])) if isinstance(scene, dict) else -1
                logging.info("Visualizer scene generated from raw node=%s objects=%s", node_id, object_count)
                return _build_scene_response(node_id, scene, cache_hit=False)

        logging.warning("Visualizer no visualizable data node=%s", node_id)
        return {
            "nodeId": node_id,
            "success": False,
            "error": "No visualizable data found in visualization_data"
        }

    except Exception as e:
        logging.exception("Visualizer endpoint error node=%s", request.node_id)
        return {
            "nodeId": request.node_id,
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }


