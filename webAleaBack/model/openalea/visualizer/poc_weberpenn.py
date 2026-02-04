from openalea.plantgl.all import Scene, Vector3, Polyline2D, Vector2
from openalea.weberpenn.tree_client import Weber_Laws, Black_Oak
from openalea.weberpenn.tree_server import TreeServer
from openalea.weberpenn.tree_geom import GeomEngine

from model.openalea.visualizer.visualizer_utils import json_from_result


def build_weberpenn_scene():
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
