"""Execute a single OpenAlea node with inputs."""
import json
import sys
import logging
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from model.openalea.runner.utils.workflow_helpers import (
    apply_inputs,
    build_outputs,
    get_factory_outputs,
    get_node_factory,
    get_package,
    init_package_manager,
    instantiate_node,
)

logging.basicConfig(level=logging.INFO)


def execute_node(package_name: str, node_name: str, inputs: dict) -> dict:
    """Execute a single OpenAlea node.

    Args:
        package_name (str): OpenAlea package name (e.g., "openalea.math").
        node_name (str): Node name within the package (e.g., "addition").
        inputs (dict): Input values {input_name: value} or {input_index: value}.
    Returns:
        response (dict): Output response with serialized outputs.
    """
    logging.info("Executing node '%s' from package '%s'", node_name, package_name)

    # 1. Init PackageManager + resolve factory
    pm = init_package_manager()
    pkg = get_package(pm, package_name)
    factory = get_node_factory(pkg, package_name, node_name)

    # 2. Instantiate node + inject inputs
    node = instantiate_node(factory)
    apply_inputs(node, inputs)

    # 3. Execute node
    logging.info("Evaluating node...")
    node.eval()
    logging.info("Node evaluation completed")

    # 4. Serialize outputs
    factory_outputs = get_factory_outputs(factory)
    outputs = build_outputs(node, factory_outputs)

    logging.info("Serialized outputs summary: %s", [
        {"index": out["index"], "name": out["name"], "type": out["type"]}
        for out in outputs
    ])
    return {"success": True, "outputs": outputs}


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
