from __future__ import annotations

import logging
from typing import Any, Dict

from model.openalea.cache.object_cache import (
    cache_load,
    cache_load_scene_json,
    cache_store_scene_json,
)
from model.openalea.visualizer.utils.payload_extractors import parse_visualization_payload
from model.openalea.visualizer.utils.visualizer_utils import json_from_result


def _build_error_response(node_id: str, message: str) -> Dict[str, Any]:
    """Build a standardized error response payload.

    Args:
        node_id (str): Node identifier.
        message (str): Error message.
    Returns:
        response (Dict[str, Any]): Error response payload.
    """
    return {
        "nodeId": node_id,
        "success": False,
        "error": message,
    }


def build_scene_response(node_id: str, scene: dict, cache_hit: bool = False) -> Dict[str, Any]:
    """Build a standardized success response for a scene payload.

    Args:
        node_id (str): Node identifier.
        scene (dict): Scene JSON payload.
        cache_hit (bool): Whether the scene came from cache.
    Returns:
        response (Dict[str, Any]): Success response payload.
    """
    response = {
        "nodeId": node_id,
        "success": True,
        "scene": scene,
        "cacheHit": cache_hit,
    }
    if isinstance(scene, dict) and isinstance(scene.get("objects"), list) and len(scene["objects"]) == 0:
        response["warning"] = "Scene contains no objects."
    return response


def _resolve_scene_ref(node_id: str, scene_ref_data: Dict[str, Any]) -> Dict[str, Any]:
    """Resolve a scene reference through cache lookup and serialization.

    Args:
        node_id (str): Node identifier.
        scene_ref_data (Dict[str, Any]): Scene reference metadata.
    Returns:
        response (Dict[str, Any]): Response with resolved scene or error.
    """
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
        return build_scene_response(node_id, cached_scene_json, cache_hit=True)

    if scene_ref_type == "plantgl_scene_json_ref":
        logging.error("Visualizer scene JSON ref missing on disk ref=%s", scene_ref)
        return _build_error_response(node_id, f"Scene JSON cache entry not found: {scene_ref}")

    try:
        raw_cached = cache_load(scene_ref)
    except Exception as e:
        logging.exception("Visualizer failed loading scene object cache node=%s ref=%s", node_id, scene_ref)
        return _build_error_response(node_id, f"Failed to load scene cache: {e}")

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
        return build_scene_response(node_id, scene, cache_hit=False)

    logging.error("Visualizer failed serializing cached scene node=%s ref=%s error=%s", node_id, scene_ref, scene)
    error_message = scene.get("error") if isinstance(scene, dict) else "Failed to serialize cached scene"
    return _build_error_response(node_id, error_message)


def _resolve_raw_payload(node_id: str, raw: Any) -> Dict[str, Any] | None:
    """Attempt to serialize a raw PlantGL object payload.

    Args:
        node_id (str): Node identifier.
        raw (Any): Raw PlantGL object payload.
    Returns:
        response (Dict[str, Any] | None): Scene response or None if unsupported.
    """
    logging.info("Visualizer received raw payload node=%s", node_id)
    scene = json_from_result(raw)
    if scene and "error" not in scene:
        object_count = len(scene.get("objects", [])) if isinstance(scene, dict) else -1
        logging.info("Visualizer scene generated from raw node=%s objects=%s", node_id, object_count)
        return build_scene_response(node_id, scene, cache_hit=False)
    return None


def resolve_visualization(node_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Resolve visualization payload into a response with a scene or error.

    Args:
        node_id (str): Node identifier.
        payload (Dict[str, Any]): Visualization payload.
    Returns:
        response (Dict[str, Any]): Response with scene or error.
    """
    scene, scene_ref_data = parse_visualization_payload(payload)
    if scene:
        object_count = len(scene.get("objects", [])) if isinstance(scene, dict) else -1
        logging.info("Visualizer using inline scene node=%s objects=%s", node_id, object_count)
        return build_scene_response(node_id, scene, cache_hit=False)

    if scene_ref_data:
        return _resolve_scene_ref(node_id, scene_ref_data)

    raw = payload.get("raw") if isinstance(payload, dict) else None
    if raw is not None:
        response = _resolve_raw_payload(node_id, raw)
        if response:
            return response

    logging.warning("Visualizer no visualizable data node=%s", node_id)
    return _build_error_response(node_id, "No visualizable data found in visualization_data")
