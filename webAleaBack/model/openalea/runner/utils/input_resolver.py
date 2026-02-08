from __future__ import annotations

import logging
from typing import Any

from model.openalea.cache.object_cache import cache_load, cache_load_scene_json


def _resolve_cached_ref(value: dict):
    """Resolve a cached reference dict to its underlying value.

    Args:
        value (dict): Reference payload containing ``__ref__`` and optional ``__type__``.
    Returns:
        resolved (Any): Loaded cached object or scene JSON.
    """
    ref_id = str(value["__ref__"])
    logging.info("Resolving cached input ref=%s", ref_id)
    if value.get("__type__") == "plantgl_scene_json_ref":
        scene_json = cache_load_scene_json(ref_id)
        if scene_json is None:
            raise FileNotFoundError(f"Cached scene JSON not found: {ref_id}")
        return scene_json
    return cache_load(ref_id)


def _resolve_mapping(value: dict):
    """Resolve values inside a mapping recursively.

    Args:
        value (dict): Mapping to resolve.
    Returns:
        resolved (dict): Mapping with resolved values.
    """
    return {k: resolve_value(v) for k, v in value.items()}


def _resolve_sequence(value):
    """Resolve values inside a sequence recursively.

    Args:
        value (list | tuple): Sequence to resolve.
    Returns:
        resolved (list): Sequence with resolved values.
    """
    return [resolve_value(v) for v in value]


def resolve_value(value: Any):
    """Resolve cached references inside nested structures.

    Args:
        value (Any): Input value to resolve.
    Returns:
        resolved (Any): Resolved value with refs expanded.
    """
    if isinstance(value, dict):
        if "__ref__" in value:
            return _resolve_cached_ref(value)
        return _resolve_mapping(value)
    if isinstance(value, list):
        return _resolve_sequence(value)
    if isinstance(value, tuple):
        return tuple(_resolve_sequence(value))
    return value
