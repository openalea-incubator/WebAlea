""""API endpoints for 3D visualizer."""
from typing import List, Optional, Any
import logging

from fastapi import APIRouter
from pydantic import BaseModel
from openalea.plantgl.all import Sphere, Cylinder, Scene, Shape, Material, Color3
import json
from webAleaBack.model.openalea.visualizer.plantgl import serialize_scene

router = APIRouter()

class VisualizationRequest(BaseModel):
    """Request model for visualizing node data."""
    node_id: str
    visualization_data: dict


@router.post("/visualize")
def visualize_node():
    try:
        scene = Scene()
        shape = Shape(Sphere(1.0), Material(Color3(255, 0, 0)))
        scene.add(shape)
        serialized_scene = serialize_scene(scene)
        return {"success": True, "scene": serialized_scene}
    except Exception as e:
        import traceback
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}
