from fastapi import APIRouter
from pydantic import BaseModel
import traceback
from openalea.plantgl.all import Scene, Vector3, Polyline2D
from openalea.weberpenn.tree_client import Weber_Laws, TreeParameter, Quaking_Aspen
from openalea.weberpenn.tree_server import TreeServer
from openalea.weberpenn.tree_geom import GeomEngine

router = APIRouter()

class VisualizationRequest(BaseModel):
    node_id: str
    visualization_data: dict = {}

@router.post("/visualize")
def visualize_node(request: VisualizationRequest):
    try:
        node_id = request.node_id

        # Utiliser un arbre par défaut pour éviter les erreurs de déballage
        param = Quaking_Aspen()  # WeberPenn fournit des arbres “prédéfinis”

        client = Weber_Laws(param)
        server = TreeServer(client)
        server.run()

        section = Polyline2D([Vector3(0.5,0,0),
                              Vector3(0,0.5,0),
                              Vector3(-0.5,0,0),
                              Vector3(0,-0.5,0),
                              Vector3(0.5,0,0)])
        scene = GeomEngine(server, section, Vector3(0,0,0)).scene("axis", Scene())

        return {"nodeId": node_id, "success": True, "scene": str(scene)}

    except Exception as e:
        return {
            "nodeId": node_id,
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }
