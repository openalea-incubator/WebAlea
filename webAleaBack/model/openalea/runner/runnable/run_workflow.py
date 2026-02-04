"""Execute OpenAlea nodes and composite graphs."""
import json
import sys
import logging
import re
from typing import Optional

from openalea.core.pkgmanager import PackageManager

logging.basicConfig(level=logging.INFO)


def parse_if_boolean(type_name: str):
    """Parse type string to standardize boolean type."""
    if type_name == "bool":
        return "boolean"
    return type_name


def execute_node(
    package_name: str,
    node_name: str,
    inputs: dict,
    pm: Optional[PackageManager] = None
) -> dict:
    """
    Execute a single OpenAlea node.

    Args:
        package_name: OpenAlea package (e.g., "openalea.math")
        node_name: Node name in package (e.g., "addition")
        inputs: Dict of {input_name: value} or {input_index: value}
        pm: Optional shared PackageManager
    """
    logging.info("Executing node '%s' from package '%s'", node_name, package_name)
    logging.info("Inputs: %s", inputs)

    if pm is None:
        pm = PackageManager()
        pm.init()

    pkg = pm.get(package_name)
    if not pkg:
        raise ValueError(f"Package '{package_name}' not found")

    factory = pkg.get(node_name)
    if not factory:
        raise ValueError(f"Node '{node_name}' not found in '{package_name}'")

    node = factory.instantiate()
    logging.info("Node instantiated: %s", node)

    for key, value in inputs.items():
        try:
            if isinstance(key, int):
                node.set_input(key, value)
                logging.info("Set input[%d] = %s", key, value)
            elif str(key).isdigit():
                node.set_input(int(key), value)
                logging.info("Set input[%s] = %s", key, value)
            else:
                node.set_input(key, value)
                logging.info("Set input['%s'] = %s", key, value)
        except Exception as e:
            logging.warning("Failed to set input '%s': %s", key, e)

    logging.info("Evaluating node...")
    node.eval()
    logging.info("Node evaluation completed")

    outputs = []
    node_outputs = node.outputs if hasattr(node, "outputs") else []
    logging.info("Node raw outputs: %s", node_outputs)

    factory_outputs = []
    if hasattr(factory, "outputs") and factory.outputs:
        factory_outputs = factory.outputs

    for i, output_value in enumerate(node_outputs):
        output_name = f"output_{i}"
        if i < len(factory_outputs):
            fo = factory_outputs[i]
            if isinstance(fo, dict):
                output_name = fo.get("name", output_name)
            elif hasattr(fo, "name"):
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
    if hasattr(value, "tolist"):
        return value.tolist()
    return str(value)


def _is_custom_node(node: dict) -> bool:
    data = node.get("data", {})
    return node.get("type") == "custom" or bool(data.get("packageName") and data.get("nodeName"))


def _parse_output_index(handle: str) -> Optional[int]:
    if not handle:
        return None
    for pattern in (r"port_(\d+)_", r"output_(\d+)", r"-(\d+)$"):
        match = re.search(pattern, handle)
        if match:
            return int(match.group(1))
    return None


def _find_node_by_label(nodes_by_id: dict, label: str) -> Optional[dict]:
    for node in nodes_by_id.values():
        data = node.get("data", {})
        if data.get("nodeName") == label or data.get("label") == label:
            return node
    return None


def _build_explicit_mapping(mapping_list: list) -> list:
    normalized = []
    for item in mapping_list:
        if not isinstance(item, dict):
            continue
        source = item.get("source") or item.get("input") or item.get("composite_input")
        target = item.get("target") or item.get("node_input") or item.get("target_input")
        if isinstance(source, dict):
            source = source.get("id") or source.get("name")
        if isinstance(target, dict):
            target = {
                "node": target.get("node_id") or target.get("node") or target.get("label"),
                "input": target.get("input_id") or target.get("input") or target.get("name")
            }
        normalized.append({"source": source, "target": target})
    return normalized


def _apply_composite_input_mapping(
    composite_inputs: list,
    nodes_by_id: dict,
    input_states: dict,
    explicit_mapping: Optional[list] = None
):
    def set_input_value(node_id: str, input_id: str, value):
        if node_id in input_states and input_id in input_states[node_id]:
            input_states[node_id][input_id]["value"] = value
            input_states[node_id][input_id]["received"] = True

    if explicit_mapping:
        for mapping in explicit_mapping:
            source = mapping.get("source")
            target = mapping.get("target")
            if not source or not target:
                continue

            # find composite input by id or name
            composite_input = next(
                (inp for inp in composite_inputs
                 if inp.get("id") == source or inp.get("name") == source),
                None
            )
            if not composite_input:
                continue
            value = composite_input.get("value", composite_input.get("default"))

            if isinstance(target, str):
                if ":" in target:
                    t_node, t_input = target.split(":", 1)
                    node = nodes_by_id.get(t_node) or _find_node_by_label(nodes_by_id, t_node)
                    if node:
                        set_input_value(node["id"], t_input, value)
                continue
            if isinstance(target, dict):
                t_node = target.get("node")
                t_input = target.get("input")
                node = nodes_by_id.get(t_node) or _find_node_by_label(nodes_by_id, t_node)
                if node and t_input:
                    set_input_value(node["id"], t_input, value)

    for inp in composite_inputs:
        raw_value = inp.get("value")
        if raw_value is None:
            raw_value = inp.get("default")

        name = inp.get("name") or ""
        if "_" in name:
            node_label, port_name = name.split("_", 1)
            node = _find_node_by_label(nodes_by_id, node_label)
            if node:
                for node_input in node.get("data", {}).get("inputs", []):
                    if node_input.get("name") == port_name or str(node_input.get("id", "")).endswith(f"_{port_name}"):
                        set_input_value(node["id"], node_input.get("id"), raw_value)
                        break

        if name:
            for node_id, inputs in input_states.items():
                if name in inputs:
                    set_input_value(node_id, name, raw_value)


def _resolve_primitive_output_value(node: dict, source_handle: str):
    outputs = node.get("data", {}).get("outputs", [])
    for out in outputs:
        if out.get("id") == source_handle:
            return out.get("value")
    index = _parse_output_index(source_handle)
    if index is not None and index < len(outputs):
        return outputs[index].get("value")
    return outputs[0].get("value") if outputs else None


def _build_output_map(node: dict, outputs: list) -> dict:
    output_defs = node.get("data", {}).get("outputs", [])
    output_map = {}
    for i, output in enumerate(outputs):
        value = output.get("value")
        if i < len(output_defs):
            out_def = output_defs[i]
            out_id = out_def.get("id")
            out_name = out_def.get("name")
            if out_id:
                output_map[out_id] = value
            if out_name:
                output_map[out_name] = value
        output_map[f"output_{i}"] = value
    return output_map


def execute_composite(composite_node: dict) -> dict:
    graph = composite_node.get("graph", {})
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    if not nodes:
        return {"success": False, "error": "Composite graph has no nodes"}

    nodes_by_id = {node["id"]: node for node in nodes}
    custom_nodes = [node for node in nodes if _is_custom_node(node)]
    custom_ids = {node["id"] for node in custom_nodes}

    input_states = {}
    dependencies = {}
    for node in custom_nodes:
        node_id = node["id"]
        input_states[node_id] = {}
        for inp in node.get("data", {}).get("inputs", []):
            input_states[node_id][inp.get("id")] = {
                "received": False,
                "value": inp.get("value", inp.get("default")),
            }
        dependencies[node_id] = set()

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        target_handle = edge.get("targetHandle")
        source_handle = edge.get("sourceHandle")

        if target not in input_states:
            continue

        if source in custom_ids:
            dependencies[target].add(source)
        else:
            source_node = nodes_by_id.get(source, {})
            value = _resolve_primitive_output_value(source_node, source_handle)
            if target_handle in input_states[target]:
                input_states[target][target_handle]["value"] = value
                input_states[target][target_handle]["received"] = True

    composite_inputs_list = composite_node.get("inputs", [])
    explicit_map = composite_node.get("inputs_map") or composite_node.get("input_map") \
        or composite_node.get("inputs_mapping") or composite_node.get("input_mapping")
    explicit_map = _build_explicit_mapping(explicit_map) if isinstance(explicit_map, list) else None
    _apply_composite_input_mapping(
        composite_inputs_list,
        nodes_by_id,
        input_states,
        explicit_mapping=explicit_map
    )

    pm = PackageManager()
    pm.init()
    executed = {}
    outputs_by_node = {}

    while len(executed) < len(custom_nodes):
        progressed = False
        for node in custom_nodes:
            node_id = node["id"]
            if node_id in executed:
                continue
            if dependencies[node_id] - executed.keys():
                continue

            data = node.get("data", {})
            package_name = data.get("packageName")
            node_name = data.get("nodeName")
            if not package_name or not node_name:
                return {"success": False, "error": f"Missing package or node name for {node_id}"}

            inputs_dict = {}
            for inp in data.get("inputs", []):
                inp_id = inp.get("id")
                value = input_states[node_id].get(inp_id, {}).get("value")
                if value is None:
                    value = inp.get("default")
                inputs_dict[inp.get("name") or inp_id] = value

            result = execute_node(package_name, node_name, inputs_dict, pm=pm)
            if not result.get("success"):
                return result

            outputs_by_node[node_id] = _build_output_map(node, result.get("outputs", []))
            executed[node_id] = True
            progressed = True

            for edge in edges:
                if edge.get("source") != node_id:
                    continue
                target = edge.get("target")
                if target not in input_states:
                    continue
                target_handle = edge.get("targetHandle")
                source_handle = edge.get("sourceHandle")

                value = None
                output_map = outputs_by_node.get(node_id, {})
                if source_handle in output_map:
                    value = output_map[source_handle]
                else:
                    idx = _parse_output_index(source_handle)
                    if idx is not None:
                        value = output_map.get(f"output_{idx}")
                    if value is None:
                        value = next(iter(output_map.values()), None)

                if target_handle in input_states[target]:
                    input_states[target][target_handle]["value"] = value
                    input_states[target][target_handle]["received"] = True

        if not progressed:
            return {"success": False, "error": "Composite execution blocked (cycle or missing inputs)"}

    composite_outputs = []
    output_defs = composite_node.get("outputs", [])
    explicit_out_map = composite_node.get("outputs_map") or composite_node.get("output_map") \
        or composite_node.get("outputs_mapping") or composite_node.get("output_mapping")
    explicit_out_map = _build_explicit_mapping(explicit_out_map) if isinstance(explicit_out_map, list) else None

    for idx, out_def in enumerate(output_defs):
        out_id = out_def.get("id", f"output_{idx}")
        out_name = out_def.get("name", f"output_{idx}")
        value = None

        if explicit_out_map:
            for mapping in explicit_out_map:
                source = mapping.get("source")
                target = mapping.get("target")
                if target in (out_id, out_name):
                    if isinstance(source, str) and ":" in source:
                        src_node, src_output = source.split(":", 1)
                        node = nodes_by_id.get(src_node) or _find_node_by_label(nodes_by_id, src_node)
                        if node and node["id"] in outputs_by_node:
                            value = outputs_by_node[node["id"]].get(src_output)
                            break

        if value is None and "_" in out_name:
            node_label, port_name = out_name.split("_", 1)
            node = _find_node_by_label(nodes_by_id, node_label)
            if node and node["id"] in outputs_by_node:
                value = outputs_by_node[node["id"]].get(port_name)

        if value is None and outputs_by_node:
            last_node_outputs = next(reversed(outputs_by_node.values()))
            value = next(iter(last_node_outputs.values()), None)

        composite_outputs.append({
            "index": idx,
            "name": out_name,
            "value": serialize_value(value),
            "type": parse_if_boolean(type(value).__name__) if value is not None else "None"
        })

    return {"success": True, "outputs": composite_outputs}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing node_info argument"}))
        sys.exit(1)

    try:
        node_info = json.loads(sys.argv[1])

        package_name = node_info.get("package_name")
        node_name = node_info.get("node_name")
        inputs = node_info.get("inputs", {})
        composite = node_info.get("composite")

        if composite:
            result = execute_composite(composite)
            print(json.dumps(result))
            sys.exit(0)

        if not package_name or not node_name:
            raise ValueError("package_name and node_name are required for simple nodes")

        result = execute_node(package_name, node_name, inputs)
        print(json.dumps(result))

    except Exception as e:
        logging.exception("Error executing node")
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
