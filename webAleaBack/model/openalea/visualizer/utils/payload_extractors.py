from __future__ import annotations

from typing import Any, Dict, Optional, Tuple


SceneRefData = Dict[str, Any]


def _extract_inline_scene(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract inline scene/object data from payload.

    Args:
        payload (Dict[str, Any]): Visualization payload.
    Returns:
        scene (Optional[Dict[str, Any]]): Scene dict if present, otherwise None.
    """
    scene = payload.get("scene")
    if isinstance(scene, dict):
        return scene
    objects = payload.get("objects")
    if isinstance(objects, list):
        return {"objects": objects}
    return None


def _extract_scene_from_value(value: Any) -> Optional[Dict[str, Any]]:
    """Extract a scene dict from an output value if present.

    Args:
        value (Any): Output value to inspect.
    Returns:
        scene (Optional[Dict[str, Any]]): Scene dict or None.
    """
    if not isinstance(value, dict):
        return None
    if value.get("__type__") == "plantgl_scene":
        scene_value = value.get("scene")
        return scene_value if isinstance(scene_value, dict) else None
    if isinstance(value.get("objects"), list):
        return value
    return None


def _extract_ref_from_value(value: Any) -> Optional[SceneRefData]:
    """Extract a scene reference from an output value if present.

    Args:
        value (Any): Output value to inspect.
    Returns:
        ref_data (Optional[SceneRefData]): Scene ref payload or None.
    """
    if not isinstance(value, dict):
        return None
    if value.get("__type__") in {"plantgl_scene_ref", "plantgl_scene_json_ref"} and value.get("__ref__"):
        meta = value.get("__meta__") if isinstance(value.get("__meta__"), dict) else {}
        return {
            "ref": str(value["__ref__"]),
            "refType": value.get("__type__"),
            "expectedShapeCount": meta.get("shape_count"),
        }
    return None


def _scan_outputs(outputs: list) -> Tuple[Optional[Dict[str, Any]], Optional[SceneRefData]]:
    """Scan outputs once to find an inline scene and/or scene reference.

    Args:
        outputs (list): Outputs list from the execution payload.
    Returns:
        scene_and_ref (Tuple[Optional[Dict[str, Any]], Optional[SceneRefData]]): Scene and ref data.
    """
    scene_from_outputs = None
    outputs_ref_data = None

    for output in outputs:
        if not isinstance(output, dict):
            continue
        value = output.get("value")
        if not value:
            continue

        if scene_from_outputs is None:
            scene_from_outputs = _extract_scene_from_value(value)
        if outputs_ref_data is None:
            outputs_ref_data = _extract_ref_from_value(value)
        if scene_from_outputs is not None and outputs_ref_data is not None:
            break

    return scene_from_outputs, outputs_ref_data


def _build_scene_ref(scene_ref: Any, expected_shape_count: Any, outputs_ref_data: Optional[SceneRefData]) -> Optional[SceneRefData]:
    """Combine explicit scene_ref with output-derived metadata.

    Args:
        scene_ref (Any): Explicit scene reference from payload.
        expected_shape_count (Any): Expected shape count from payload.
        outputs_ref_data (Optional[SceneRefData]): Ref data extracted from outputs.
    Returns:
        ref_data (Optional[SceneRefData]): Combined ref data or None.
    """
    if outputs_ref_data is not None:
        if isinstance(scene_ref, str) and scene_ref:
            return {
                "ref": scene_ref,
                "refType": outputs_ref_data.get("refType"),
                "expectedShapeCount": expected_shape_count if expected_shape_count is not None else outputs_ref_data.get("expectedShapeCount"),
            }
        return outputs_ref_data

    if isinstance(scene_ref, str) and scene_ref:
        return {
            "ref": scene_ref,
            "refType": "plantgl_scene_ref",
            "expectedShapeCount": expected_shape_count,
        }

    return None


def parse_visualization_payload(payload: Optional[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], Optional[SceneRefData]]:
    """Parse payload to extract an inline scene and/or scene reference.

    Args:
        payload (Optional[Dict[str, Any]]): Visualization payload.
    Returns:
        scene_and_ref (Tuple[Optional[Dict[str, Any]], Optional[SceneRefData]]): Scene and ref data.
    """
    if not isinstance(payload, dict) or not payload:
        return None, None

    inline_scene = _extract_inline_scene(payload)
    if inline_scene:
        return inline_scene, None

    outputs = payload.get("outputs") if isinstance(payload.get("outputs"), list) else []
    scene_from_outputs, outputs_ref_data = _scan_outputs(outputs)

    scene_ref = payload.get("scene_ref")
    expected_shape_count = payload.get("scene_ref_expected_shape_count")
    scene_ref_data = _build_scene_ref(scene_ref, expected_shape_count, outputs_ref_data)

    return scene_from_outputs, scene_ref_data
