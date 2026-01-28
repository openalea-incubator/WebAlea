"""Execute a single OpenAlea node with inputs."""
import json
import sys
import logging

from openalea.core.pkgmanager import PackageManager

logging.basicConfig(level=logging.INFO)

def parse_if_boolean(type: str):
    """Parse type string to standardize boolean type."""
    if type == "bool":
        return "boolean"
    return type

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
    pkg = pm.get(package_name)
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
            # Try as index first if key is numeric
            if isinstance(key, int):
                node.set_input(key, value)
                logging.info("Set input[%d] = %s", key, value)
            elif str(key).isdigit():
                node.set_input(int(key), value)
                logging.info("Set input[%s] = %s", key, value)
            else:
                # Try by name
                node.set_input(key, value)
                logging.info("Set input['%s'] = %s", key, value)
        except Exception as e:
            logging.warning("Failed to set input '%s': %s", key, e)

    # 6. Execute node
    logging.info("Evaluating node...")
    node.eval()
    logging.info("Node evaluation completed")

    # 7. Serialize outputs
    outputs = []
    node_outputs = node.outputs if hasattr(node, 'outputs') else []
    logging.info("Node raw outputs: %s", node_outputs)

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

    logging.info("Outputs: %s", outputs)
    return {"success": True, "outputs": outputs}


def serialize_value(value):
    """Serialize a Python value to JSON-compatible format."""
    if value is None:
        return None
    if isinstance(value, (int, float, str, bool)):
        return value
    if isinstance(value, (list, tuple)):
        return [serialize_value(v) for v in value]
    if isinstance(value, dict):
        return {str(k): serialize_value(v) for k, v in value.items()}
    # For numpy arrays or similar
    if hasattr(value, 'tolist'):
        return value.tolist()
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
