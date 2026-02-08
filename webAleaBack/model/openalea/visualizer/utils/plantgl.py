from openalea.plantgl.all import (
    Polyline, BezierCurve, NurbsCurve, PointSet, Tesselator, Discretizer
)


def _is_curve(geometry) -> bool:
    """Check if a PlantGL geometry is curve-like.

    Args:
        geometry (Any): PlantGL geometry instance.
    Returns:
        is_curve (bool): True if geometry is curve-like.
    """
    return isinstance(geometry, (Polyline, BezierCurve, NurbsCurve, PointSet))


def mesh_from_geometry(geometry):
    """Convert PlantGL geometry into JSON-friendly mesh/line data.

    Args:
        geometry (Any): PlantGL geometry instance.
    Returns:
        mesh (dict): Mesh/line dict with vertices and indices when applicable.
    """
    discretizer = Discretizer() if _is_curve(geometry) else Tesselator()
    geometry.apply(discretizer)
    if _is_curve(geometry):
        vertices = [[p.x, p.y, p.z] for p in discretizer.result.pointList]
        return {"type": "line", "vertices": vertices}

    vertices = [[p.x, p.y, p.z] for p in discretizer.discretization.pointList]
    faces = [list(i) for i in discretizer.discretization.indexList]
    return {"type": "mesh", "vertices": vertices, "indices": faces}
