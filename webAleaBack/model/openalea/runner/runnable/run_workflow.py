"""Execute a single OpenAlea node with inputs."""
import json
import sys
import logging
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from model.openalea.cache.object_cache import (
    cache_store,
    cache_load,
    cache_load_scene_json,
    cache_store_scene_json_new,
)

PLANTGL_AVAILABLE = False
try:
    from openalea.plantgl.all import Scene, Shape, Geometry, Material, Color3
    PLANTGL_AVAILABLE = True
except Exception:
    PLANTGL_AVAILABLE = False

from openalea.core.pkgmanager import PackageManager


def normalize_package_name(package_name: str, available_keys: list) -> str | None:
    """Try to find the correct package name in the PackageManager.

    OpenAlea PackageManager may use different naming conventions:
    - 'openalea.widgets' (conda name) -> 'widgets' (PM name)
    - or vice versa

    Args:
        package_name: the package name to look for
        available_keys: list of keys from PackageManager

    Returns:
        The matching key name, or None if not found
    """
    if package_name in available_keys:
        return package_name

    if package_name.startswith("openalea."):
        short_name = package_name[len("openalea."):]
        if short_name in available_keys:
            return short_name

    prefixed_name = f"openalea.{package_name}"
    if prefixed_name in available_keys:
        return prefixed_name

    return None

logging.basicConfig(level=logging.INFO)

def resolve_value(value):
    if isinstance(value, dict):
        if "__ref__" in value:
            ref_id = str(value["__ref__"])
            logging.info("Resolving cached input ref=%s", ref_id)
            if value.get("__type__") == "plantgl_scene_json_ref":
                scene_json = cache_load_scene_json(ref_id)
                if scene_json is None:
                    raise FileNotFoundError(f"Cached scene JSON not found: {ref_id}")
                return scene_json
            return cache_load(ref_id)
        return {k: resolve_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve_value(v) for v in value]
    if isinstance(value, tuple):
        return tuple(resolve_value(v) for v in value)
    return value

def parse_if_boolean(type: str):
    """Parse type string to standardize boolean type."""
    if type == "bool":
        return "boolean"
    return type


def _serialize_plantgl_scene(scene):
    try:
        shape_count = len(scene)
    except Exception:
        shape_count = -1
    logging.info("Preparing PlantGL scene for cache shape_count=%s", shape_count)
    try:
        from model.openalea.visualizer.serialize import serialize_scene
        scene_json = serialize_scene(scene)
        object_count = len(scene_json.get("objects", [])) if isinstance(scene_json, dict) else -1
        ref_id = cache_store_scene_json_new(scene_json)
        logging.info(
            "Serialized PlantGL scene to JSON cache ref=%s shape_count=%s object_count=%s",
            ref_id,
            shape_count,
            object_count
        )
        return {
            "__type__": "plantgl_scene_json_ref",
            "__ref__": ref_id,
            "__meta__": {
                "shape_count": shape_count,
                "object_count": object_count
            }
        }
    except Exception:
        logging.exception("Failed to build/cache scene JSON, falling back to object cache")
        try:
            ref_id = cache_store(scene)
            logging.info("Serialized PlantGL scene as object ref=%s", ref_id)
            return {
                "__type__": "plantgl_scene_ref",
                "__ref__": ref_id,
                "__meta__": {
                    "shape_count": shape_count
                }
            }
        except Exception:
            logging.exception("Failed to cache PlantGL scene object, falling back to inline scene serialization")
            from model.openalea.visualizer.serialize import serialize_scene
            return {"__type__": "plantgl_scene", "scene": serialize_scene(scene)}

def execute_node(package_name: str, node_name: str, inputs: dict) -> dict:
    """
    Execute a single OpenAlea node.

    Args:
        package_name: OpenAlea package (e.g., "openalea.math")
        node_name: Node name in package (e.g., "addition")
        inputs: Dict of {input_name: value} or {input_index: value}

    Returns:
        Dict with outputs: [{index, name, value, type}, ...]
    """
    logging.info("Executing node '%s' from package '%s'", node_name, package_name)
    logging.info("Inputs: %s", inputs)

    # 1. Init PackageManager
    pm = PackageManager()
    pm.init()

    # 2. Get package
    available_keys = list(pm.keys())
    resolved_name = normalize_package_name(package_name, available_keys)
    if resolved_name is None:
        raise ValueError(f"Package '{package_name}' not found")

    pkg = pm.get(resolved_name)
    if not pkg:
        raise ValueError(f"Package '{package_name}' not found")

    # 3. Get node factory
    factory = pkg.get(node_name)
    if not factory:
        raise ValueError(f"Node '{node_name}' not found in '{package_name}'")

    # 4. Instantiate node
    node = factory.instantiate()
    logging.info("Node instantiated: %s", node)

    # 5. Inject inputs
    for key, value in inputs.items():
        try:
            value = resolve_value(value)
            logging.info("Input '%s' resolved type=%s", key, type(value).__name__)
            # Try as index first if key is numeric
            if isinstance(key, int):
                node.set_input(key, value)
                logging.info("Set input[%d]", key)
            elif str(key).isdigit():
                node.set_input(int(key), value)
                logging.info("Set input[%s]", key)
            else:
                # Try by name
                node.set_input(key, value)
                logging.info("Set input['%s']", key)
        except Exception as e:
            logging.warning("Failed to set input '%s': %s", key, e)

    # 6. Execute node
    logging.info("Evaluating node...")
    node.eval()
    logging.info("Node evaluation completed")

    # 7. Serialize outputs
    outputs = []
    node_outputs = node.outputs if hasattr(node, 'outputs') else []
    logging.info("Node produced %d outputs", len(node_outputs))
    logging.info("Node raw output types: %s", [type(v).__name__ for v in node_outputs])

    # Get output descriptions from factory if available
    factory_outputs = []
    if hasattr(factory, 'outputs') and factory.outputs:
        factory_outputs = factory.outputs

    for i, output_value in enumerate(node_outputs):
        # Get output name from factory description
        output_name = f"output_{i}"
        if i < len(factory_outputs):
            fo = factory_outputs[i]
            if isinstance(fo, dict):
                output_name = fo.get("name", output_name)
            elif hasattr(fo, 'name'):
                output_name = fo.name or output_name

        outputs.append({
            "index": i,
            "name": output_name,
            "value": serialize_value(output_value),
            "type": parse_if_boolean(type(output_value).__name__) if output_value is not None else "None"
        })

    logging.info("Serialized outputs summary: %s", [
        {"index": out["index"], "name": out["name"], "type": out["type"]}
        for out in outputs
    ])
    return {"success": True, "outputs": outputs}


def _object_type_name(value):
    try:
        cls = value.__class__
        module = cls.__module__ or ""
        name = cls.__name__ or "Object"
        return f"{module}.{name}" if module else name
    except Exception:
        return "Object"

def serialize_value(value, depth=0, max_depth=3):
    """Serialize a Python value to JSON-compatible format."""
    if depth > max_depth:
        return {"__type__": "DepthLimit", "summary": "Max depth reached"}
    if value is None:
        return None
    if PLANTGL_AVAILABLE:
        if isinstance(value, Scene):
            return _serialize_plantgl_scene(value)
        if isinstance(value, Shape):
            scene = Scene()
            scene.add(value)
            return _serialize_plantgl_scene(scene)
        if isinstance(value, Geometry):
            scene = Scene()
            scene.add(Shape(value, Material(Color3(200, 200, 200))))
            return _serialize_plantgl_scene(scene)
    if isinstance(value, (int, float, str, bool)):
        return value
    if isinstance(value, (list, tuple)):
        return [serialize_value(v, depth + 1, max_depth) for v in value]
    if isinstance(value, dict):
        return {str(k): serialize_value(v, depth + 1, max_depth) for k, v in value.items()}
    # For numpy arrays or similar
    if hasattr(value, 'tolist'):
        return value.tolist()
    # Custom objects: store in cache and return opaque ref
    try:
        ref_id = cache_store(value)
        return {
            "__type__": _object_type_name(value),
            "__ref__": ref_id,
            "summary": str(value)
        }
    except Exception:
        # Fallback: convert to string representation
        return str(value)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing node_info argument"}))
        sys.exit(1)

    try:
        node_info = json.loads(sys.argv[1])

        package_name = node_info.get("package_name")
        node_name = node_info.get("node_name")
        inputs = node_info.get("inputs", {})

        if not package_name or not node_name:
            raise ValueError("package_name and node_name are required")

        result = execute_node(package_name, node_name, inputs)
        print(json.dumps(result))

    except Exception as e:
        logging.exception("Error executing node")
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
