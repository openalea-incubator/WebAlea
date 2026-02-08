from __future__ import annotations

import logging

from openalea.core.pkgmanager import PackageManager

from model.openalea.runner.utils.input_resolver import resolve_value
from model.openalea.runner.utils.serialization import serialize_value


def normalize_package_name(package_name: str, available_keys: list) -> str | None:
    """Normalize a package name to a known PackageManager key.

    Args:
        package_name (str): Package name to resolve.
        available_keys (list): Available PackageManager keys.
    Returns:
        normalized (str | None): Resolved name or None if not found.
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


def parse_if_boolean(type_name: str):
    """Normalize boolean type names.

    Args:
        type_name (str): Raw type name.
    Returns:
        normalized (str): Normalized type name.
    """
    if type_name == "bool":
        return "boolean"
    return type_name


def init_package_manager() -> PackageManager:
    """Initialize and return the OpenAlea PackageManager.

    Args:
        None (None): No arguments.
    Returns:
        manager (PackageManager): Initialized PackageManager instance.
    """
    pm = PackageManager()
    pm.init()
    return pm


def get_package(pm: PackageManager, package_name: str):
    """Fetch a package from the PackageManager.

    Args:
        pm (PackageManager): Initialized PackageManager instance.
        package_name (str): Name of the package to fetch.
    Returns:
        package (Any): Package instance corresponding to the given name.
    """
    available_keys = list(pm.keys())
    resolved_name = normalize_package_name(package_name, available_keys)
    if resolved_name is None:
        raise ValueError(f"Package '{package_name}' not found")

    pkg = pm.get(resolved_name)
    if not pkg:
        raise ValueError(f"Package '{package_name}' not found")

    return pkg


def get_node_factory(pkg, package_name: str, node_name: str):
    """Retrieve the node factory from a package.

    Args:
        pkg (Any): Package instance.
        package_name (str): Name of the package.
        node_name (str): Name of the node to retrieve.
    Returns:
        factory (Any): Node factory instance.
    """
    factory = pkg.get(node_name)
    if not factory:
        raise ValueError(f"Node '{node_name}' not found in '{package_name}'")
    return factory


def instantiate_node(factory):
    """Instantiate a node from the given factory.

    Args:
        factory (Any): Node factory instance.
    Returns:
        node (Any): Instantiated node.
    """
    node = factory.instantiate()
    logging.info("Node instantiated: %s", node)
    return node


def apply_inputs(node, inputs: dict):
    """Apply input values to a node.

    Args:
        node (Any): Node instance to apply inputs to.
        inputs (dict): Input values {name: value} or {index: value}.
    Returns:
        None (None): No return value.
    """
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


def get_factory_outputs(factory):
    """Retrieve factory output metadata if available.

    Args:
        factory (Any): Node factory instance.
    Returns:
        outputs (list): Output metadata list, or empty list.
    """
    if hasattr(factory, 'outputs') and factory.outputs:
        return factory.outputs
    return []


def get_output_name(factory_outputs, index: int) -> str:
    """Get the output name for a given index.

    Args:
        factory_outputs (list): List of factory output metadata.
        index (int): Index of the output.
    Returns:
        output_name (str): Name of the output.
    """
    output_name = f"output_{index}"
    if index < len(factory_outputs):
        fo = factory_outputs[index]
        if isinstance(fo, dict):
            return fo.get("name", output_name)
        if hasattr(fo, 'name'):
            return fo.name or output_name
    return output_name


def build_outputs(node, factory_outputs):
    """Build output dictionaries from a node and factory outputs.

    Args:
        node (Any): Node instance.
        factory_outputs (list): Factory output metadata list.
    Returns:
        outputs (list): Output dictionaries with index, name, value, type.
    """
    outputs = []
    node_outputs = node.outputs if hasattr(node, 'outputs') else []
    logging.info("Node produced %d outputs", len(node_outputs))
    logging.info("Node raw output types: %s", [type(v).__name__ for v in node_outputs])

    for i, output_value in enumerate(node_outputs):
        outputs.append({
            "index": i,
            "name": get_output_name(factory_outputs, i),
            "value": serialize_value(output_value),
            "type": parse_if_boolean(type(output_value).__name__) if output_value is not None else "None"
        })

    return outputs
