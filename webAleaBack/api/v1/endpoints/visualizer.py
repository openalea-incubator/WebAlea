""""API endpoints for 3D visualizer."""
from typing import List, Optional, Any
import logging

from fastapi import APIRouter
from pydantic import BaseModel
from openalea.plantgl.all import Sphere, Cylinder, Scene
import json

router = APIRouter()

class VisualizationRequest(BaseModel):
    """Request model for visualizing node data."""
    node_id: str
    visualization_data: dict

@router.post("/visualize")
def visualize_node(data: VisualizationRequest):
    try:
        # Créer primitives sans viewer
        s = Sphere(radius=1)
        c = Cylinder(radius=0.5, height=2)
        scene = Scene([s, c])
        return {"success": True, "scene": scene}
    except Exception as e:
        return {"success": False, "error": str(e)}