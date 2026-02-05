try:
    from openalea.plantgl.all import Scene, Vector3, Polyline2D, Vector2
    from openalea.weberpenn.tree_client import Weber_Laws, Black_Oak
    from openalea.weberpenn.tree_server import TreeServer
    from openalea.weberpenn.tree_geom import GeomEngine
    PLANTGL_AVAILABLE = True
except Exception:
    Scene = None
    Vector3 = None
    Polyline2D = None
    Vector2 = None
    Weber_Laws = None
    Black_Oak = None
    TreeServer = None
    GeomEngine = None
    PLANTGL_AVAILABLE = False

from model.openalea.visualizer.visualizer_utils import json_from_result


def build_weberpenn_scene():
    if not PLANTGL_AVAILABLE:
        return {"error": "OpenAlea PlantGL/WeberPenn is not available in this environment"}

    param = Black_Oak()
    client = Weber_Laws(param)
    server = TreeServer(client)
    server.run()

    section = Polyline2D([
        Vector2(0.5, 0),
        Vector2(0, 0.5),
        Vector2(-0.5, 0),
        Vector2(0, -0.5),
        Vector2(0.5, 0)
    ])

    scene = GeomEngine(server, section, Vector3(0, 0, 0)).scene("axis", Scene())
    return json_from_result(scene)
