import logging

try:
    from openalea.plantgl.all import Scene, Shape
    PLANTGL_AVAILABLE = True
except Exception:
    Scene = None
    Shape = None
    PLANTGL_AVAILABLE = False


def json_from_result(result):
    """Convert PlantGL Scene/Shape results into serialized scene JSON.

    Args:
        result (Any): PlantGL Scene or Shape instance.
    Returns:
        scene_json (dict): Serialized scene JSON or error payload.
    """
    if not PLANTGL_AVAILABLE:
        return {"error": "OpenAlea PlantGL is not available in this environment"}

    from model.openalea.visualizer.utils.serialize import serialize_scene

    if isinstance(result, Scene):
        try:
            shape_count = len(result)
        except Exception:
            shape_count = -1
        logging.info("Serializing Scene object to JSON shape_count=%s", shape_count)
        return serialize_scene(result)
    if isinstance(result, Shape):
        logging.info("Serializing single Shape object to JSON")
        scene = Scene()
        scene.add(result)
        return serialize_scene(scene)
    return {"error": "Unsupported type for 3D rendering"}
