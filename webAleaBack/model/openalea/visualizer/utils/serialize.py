from __future__ import annotations

import logging
import uuid

from openalea.plantgl.all import Scene, Shape, Text

from model.openalea.visualizer.utils.plantgl import mesh_from_geometry


def serialize_color(color):
    """Serialize a PlantGL color to normalized RGB.

    Args:
        color (Any): PlantGL color object.
    Returns:
        rgb (list): Normalized RGB list.
    """
    return [
        color.red / 255.0,
        color.green / 255.0,
        color.blue / 255.0
    ]


def serialize_shape(shape: Shape):
    """Serialize a PlantGL Shape into a JSON-friendly object node.

    Args:
        shape (Shape): PlantGL shape to serialize.
    Returns:
        node (dict): Serialized object node.
    """
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
        "transform": {
            "position": [0, 0, 0],
            "rotation": [0, 0, 0],
            "scale": [1, 1, 1]
        }
    }


def serialize_scene(scene: Scene):
    """Serialize a PlantGL Scene into JSON with object nodes.

    Args:
        scene (Scene): PlantGL scene to serialize.
    Returns:
        scene_json (dict): JSON scene with objects list.
    """
    objects = []
    shape_count = 0

    for shape in scene:
        shape_count += 1
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

    logging.info("serialize_scene done shape_count=%s object_count=%s", shape_count, len(objects))
    return {"objects": objects}
