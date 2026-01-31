from openalea.plantgl.all import (
    Scene, Shape, Text,
    Tesselator, Discretizer
)

from openalea.widget import (
    isCurve
)

import uuid


def serialize_color(color):
    return [
        color.red / 255.0,
        color.green / 255.0,
        color.blue / 255.0
    ]


def mesh_from_geometry(geometry):
    d = Discretizer() if geometry.isACurve() else Tesselator()
    geometry.apply(d)

    if geometry.isACurve():
        points = d.result.pointList
        vertices = [[p.x, p.y, p.z] for p in points]
        return {
            "type": "line",
            "vertices": vertices
        }

    pts = d.discretization.pointList
    indices = d.discretization.indexList

    vertices = [[p.x, p.y, p.z] for p in pts]
    faces = [list(i) for i in indices]

    return {
        "type": "mesh",
        "vertices": vertices,
        "indices": faces
    }


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
