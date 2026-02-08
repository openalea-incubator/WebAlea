from __future__ import annotations

import logging
from typing import Any

from model.openalea.cache.object_cache import cache_store, cache_store_scene_json_new

PLANTGL_AVAILABLE = False
try:
    from openalea.plantgl.all import Scene, Shape, Geometry, Material, Color3
    PLANTGL_AVAILABLE = True
except Exception:
    PLANTGL_AVAILABLE = False


def _object_type_name(value: Any) -> str:
    """Return a fully qualified type name for a value.

    Args:
        value (Any): Value to inspect.
    Returns:
        type_name (str): Fully qualified type name or fallback.
    """
    try:
        cls = value.__class__
        module = cls.__module__ or ""
        name = cls.__name__ or "Object"
        return f"{module}.{name}" if module else name
    except Exception:
        return "Object"


def _try_cache_scene_json(scene, shape_count: int):
    """Serialize a PlantGL scene to JSON and store it in the scene cache.

    Args:
        scene (Any): PlantGL scene object.
        shape_count (int): Number of shapes detected in the scene.
    Returns:
        ref_payload (dict | None): Cache reference payload or None on failure.
    """
    try:
        from model.openalea.visualizer.utils.serialize import serialize_scene
        scene_json = serialize_scene(scene)
        object_count = len(scene_json.get("objects", [])) if isinstance(scene_json, dict) else -1
        ref_id = cache_store_scene_json_new(scene_json)
        logging.info(
            "Serialized PlantGL scene to JSON cache ref=%s shape_count=%s object_count=%s",
            ref_id,
            shape_count,
            object_count
        )
        return {
            "__type__": "plantgl_scene_json_ref",
            "__ref__": ref_id,
            "__meta__": {
                "shape_count": shape_count,
                "object_count": object_count
            }
        }
    except Exception:
        logging.exception("Failed to build/cache scene JSON, falling back to object cache")
        return None


def _try_cache_scene_object(scene, shape_count: int):
    """Store a PlantGL scene object in the object cache.

    Args:
        scene (Any): PlantGL scene object.
        shape_count (int): Number of shapes detected in the scene.
    Returns:
        ref_payload (dict | None): Cache reference payload or None on failure.
    """
    try:
        ref_id = cache_store(scene)
        logging.info("Serialized PlantGL scene as object ref=%s", ref_id)
        return {
            "__type__": "plantgl_scene_ref",
            "__ref__": ref_id,
            "__meta__": {
                "shape_count": shape_count
            }
        }
    except Exception:
        logging.exception("Failed to cache PlantGL scene object, falling back to inline scene serialization")
        return None


def _fallback_inline_scene(scene):
    """Serialize a PlantGL scene inline as a last-resort fallback.

    Args:
        scene (Any): PlantGL scene object.
    Returns:
        inline (dict): Inline scene payload.
    """
    from model.openalea.visualizer.utils.serialize import serialize_scene
    return {"__type__": "plantgl_scene", "scene": serialize_scene(scene)}


def _serialize_plantgl_scene(scene):
    """Serialize a PlantGL scene using cache-first strategy with fallbacks.

    Args:
        scene (Any): PlantGL scene object.
    Returns:
        payload (dict): Scene payload (cache ref or inline).
    """
    try:
        shape_count = len(scene)
    except Exception:
        shape_count = -1
    logging.info("Preparing PlantGL scene for cache shape_count=%s", shape_count)
    cached_scene = _try_cache_scene_json(scene, shape_count)
    if cached_scene:
        return cached_scene
    cached_object = _try_cache_scene_object(scene, shape_count)
    if cached_object:
        return cached_object
    return _fallback_inline_scene(scene)


def _serialize_plantgl(value: Any):
    """Serialize PlantGL objects into cached scene references when available.

    Args:
        value (Any): Value to serialize.
    Returns:
        payload (dict | None): Scene payload or None if not a PlantGL type.
    """
    if not PLANTGL_AVAILABLE:
        return None
    if isinstance(value, Scene):
        return _serialize_plantgl_scene(value)
    if isinstance(value, Shape):
        scene = Scene()
        scene.add(value)
        return _serialize_plantgl_scene(scene)
    if isinstance(value, Geometry):
        scene = Scene()
        scene.add(Shape(value, Material(Color3(200, 200, 200))))
        return _serialize_plantgl_scene(scene)
    return None


def _serialize_collection(value: Any, depth: int, max_depth: int):
    """Serialize collections like lists, tuples, and dictionaries.

    Args:
        value (Any): Collection to serialize.
        depth (int): Current recursion depth.
        max_depth (int): Maximum allowed recursion depth.
    Returns:
        serialized (Any | None): Serialized collection or None if not a collection.
    """
    if isinstance(value, (list, tuple)):
        return [serialize_value(v, depth + 1, max_depth) for v in value]
    if isinstance(value, dict):
        return {str(k): serialize_value(v, depth + 1, max_depth) for k, v in value.items()}
    return None


def _serialize_numpy_like(value: Any):
    """Serialize numpy-like objects using ``tolist()`` when available.

    Args:
        value (Any): Numpy-like object to serialize.
    Returns:
        serialized (Any | None): Serialized value or None if not supported.
    """
    if hasattr(value, 'tolist'):
        return value.tolist()
    return None


def _serialize_cached_object(value: Any):
    """Attempt to cache an object and return a reference payload.

    Args:
        value (Any): Object to cache.
    Returns:
        payload (dict | str): Cache reference payload or string summary.
    """
    try:
        ref_id = cache_store(value)
        return {
            "__type__": _object_type_name(value),
            "__ref__": ref_id,
            "summary": str(value)
        }
    except Exception:
        return str(value)


def serialize_value(value: Any, depth: int = 0, max_depth: int = 3):
    """Serialize a Python value to JSON-compatible format.

    Args:
        value (Any): Value to serialize.
        depth (int): Current recursion depth.
        max_depth (int): Maximum allowed recursion depth.
    Returns:
        serialized (Any): JSON-compatible representation.
    """
    if depth > max_depth:
        return {"__type__": "DepthLimit", "summary": "Max depth reached"}
    if value is None:
        return None
    plantgl = _serialize_plantgl(value)
    if plantgl is not None:
        return plantgl
    if isinstance(value, (int, float, str, bool)):
        return value
    collection = _serialize_collection(value, depth, max_depth)
    if collection is not None:
        return collection
    numpy_like = _serialize_numpy_like(value)
    if numpy_like is not None:
        return numpy_like
    return _serialize_cached_object(value)
