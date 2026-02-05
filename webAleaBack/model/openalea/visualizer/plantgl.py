from openalea.plantgl.all import (
    Polyline, BezierCurve, NurbsCurve, PointSet, Tesselator, Discretizer
)


def isCurve(geom):
    return isinstance(geom, (Polyline, BezierCurve, NurbsCurve, PointSet))

def mesh_from_geometry(geometry):
    d = Discretizer() if isCurve(geometry) else Tesselator()
    geometry.apply(d)
    if isCurve(geometry):
        vertices = [[p.x, p.y, p.z] for p in d.result.pointList]
        return {"type": "line", "vertices": vertices}

    vertices = [[p.x, p.y, p.z] for p in d.discretization.pointList]
    faces = [list(i) for i in d.discretization.indexList]
    return {"type": "mesh", "vertices": vertices, "indices": faces}
