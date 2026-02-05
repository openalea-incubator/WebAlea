import logging

try:
    from openalea.plantgl.all import Scene, Shape
    PLANTGL_AVAILABLE = True
except Exception:
    Scene = None
    Shape = None
    PLANTGL_AVAILABLE = False

def json_from_result(result):
    if not PLANTGL_AVAILABLE:
        return {"error": "OpenAlea PlantGL is not available in this environment"}

    # Local import to avoid module import errors at app startup
    from model.openalea.visualizer.serialize import serialize_scene

    if isinstance(result, Scene):
        logging.info("Serializing Scene object to JSON")
        return serialize_scene(result)
    elif isinstance(result, Shape):
        scene = Scene()
        scene.add(result)
        return serialize_scene(scene)
    else:
        return {"error": "Unsupported type for 3D rendering"}
