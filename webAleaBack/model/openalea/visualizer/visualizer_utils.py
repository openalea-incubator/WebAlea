from openalea.plantgl.all import Scene, Shape
from model.openalea.visualizer.serialize import serialize_scene
import logging

def json_from_result(result):
    if isinstance(result, Scene):
        logging.info("Serializing Scene object to JSON")
        return serialize_scene(result)
    elif isinstance(result, Shape):
        scene = Scene()
        scene.add(result)
        return serialize_scene(scene)
    else:
        return {"error": "Unsupported type for 3D rendering"}
