
from openalea.plantgl.all import (
    Scene, Shape, Text,
    Tesselator, Discretizer,
    Cylinder, Sphere,
    Polyline, BezierCurve, NurbsCurve, PointSet
)
from model.openalea.visualizer.plantgl import mesh_from_geometry
import uuid


def serialize_color(color):
    return [
        color.red / 255.0,
        color.green / 255.0,
        color.blue / 255.0
    ]
    

def serialize_shape(shape: Shape):
    geom_data = mesh_from_geometry(shape.geometry)

    material = shape.appearance
    color = material.ambient
    opacity = 1.0 - material.transparency

    return {
        "id": str(uuid.uuid4()),
        "objectType": geom_data["type"],
        "geometry": geom_data,
        "material": {
            "color": serialize_color(color),
            "opacity": opacity
        },
        # Transformation par défaut
        "transform": {
            "position": [0, 0, 0],
            "rotation": [0, 0, 0],
            "scale": [1, 1, 1]
        }
    }

def serialize_scene(scene: Scene):
    objects = []

    for shape in scene:
        if isinstance(shape.geometry, Text):
            pos = shape.geometry.position
            objects.append({
                "id": str(uuid.uuid4()),
                "objectType": "text",
                "text": shape.geometry.string,
                "position": [pos.x, pos.y, pos.z]
            })
            continue

        objects.append(serialize_shape(shape))

    return {
        "objects": objects
    }
