"""
This module describes OpenAlea packages installed in the current conda environment.

Module used via subprocess to for dynamic python instance management.
"""
import logging
import json
import sys
from typing import Any, Dict

from openalea.core.pkgmanager import PackageManager



def get_interface_type(interface) -> str:
    """Extract the interface type name from an OpenAlea interface object.

    Args:
        interface: The interface object (can be None, a class, or an instance)

    Returns:
        str: The interface type name (e.g., "IFloat", "IInt", "IStr", "None")
    """
    if interface is None:
        return "None"

    # Try to get the class name
    try:
        # If it's an instance, get the class name
        if hasattr(interface, '__class__'):
            class_name = interface.__class__.__name__
            # Avoid generic names
            if class_name not in ('type', 'NoneType'):
                return class_name

        # If it's a class itself
        if hasattr(interface, '__name__'):
            return interface.__name__

        # Fallback to string representation
        iface_str = str(interface)

        # Try to extract type from string like "IFloat" or "<class 'openalea.core.interface.IFloat'>"
        if 'IFloat' in iface_str:
            return 'IFloat'
        elif 'IInt' in iface_str:
            return 'IInt'
        elif 'IStr' in iface_str:
            return 'IStr'
        elif 'IBool' in iface_str:
            return 'IBool'
        elif 'ISequence' in iface_str:
            return 'ISequence'
        elif 'IDict' in iface_str:
            return 'IDict'
        elif 'IFileStr' in iface_str:
            return 'IFileStr'
        elif 'IDirStr' in iface_str:
            return 'IDirStr'
        elif 'IEnumStr' in iface_str:
            return 'IEnumStr'
        elif 'IRGBColor' in iface_str:
            return 'IRGBColor'

        return iface_str if iface_str != 'None' else 'None'

    except Exception:
        return "None"


def serialize_node_puts(puts) -> dict:
    """serialize inputs and outputs of a list inputs/outputs

    Args:
        node_factory : the flow node factory

    Returns:
        dict: serialized inputs and outputs
    """
    serialized = []
    if not puts:
        return serialized # empty array if no inputs/outputs
    for put in puts: # for each input/output
        try:
            # serialize into a json dict
            interface_type = get_interface_type(put.interface)
            put_dict = {
                "name": put.name,
                "interface": interface_type,
                "optional": put.optional,
                "desc": put.desc,
            }
            serialized.append(put_dict)
        except AttributeError:
            serialized.append(str(put))
    return serialized


def serialize_node(node_factory) -> dict:
    """describes a node from its factory

    Args:
        node_factory : the node factory

    Raises:
        ValueError: if no node was found

    Returns:
        dict: the node description
    """
    # serialize node factory information
    inputs = serialize_node_puts(node_factory.inputs)
    outputs = serialize_node_puts(node_factory.outputs)

    return {
        "description": node_factory.description,
        "inputs": inputs,
        "outputs": outputs,
        "callable": node_factory.nodeclass,
    }



def normalize_package_name(package_name: str, available_keys: list) -> str:
    """Try to find the correct package name in the PackageManager.

    OpenAlea PackageManager may use different naming conventions:
    - 'openalea.widgets' (conda name) -> 'widgets' (PM name)
    - or vice versa

    Args:
        package_name: the package name to look for
        available_keys: list of keys from PackageManager

    Returns:
        The matching key name, or original if no match found
    """
    # Try exact match first
    if package_name in available_keys:
        return package_name

    # Try without 'openalea.' prefix
    if package_name.startswith("openalea."):
        short_name = package_name[len("openalea."):]
        if short_name in available_keys:
            return short_name

    # Try with 'openalea.' prefix
    prefixed_name = f"openalea.{package_name}"
    if prefixed_name in available_keys:
        return prefixed_name

    # No match found
    return None


def describe_openalea_package(package_name: str) -> Dict[str, Any]:
    """lists all nodes contained in an OpenAlea package.

    Args:
        package_name (str): the name of a package

    Raises:
        ValueError: the package was not found

    Returns:
        dict: the package description (JSON-serializable)
    """
    # initalize package manager
    pm = PackageManager()
    pm.init()

    # Try to find the correct package name
    available_keys = list(pm.keys())
    resolved_name = normalize_package_name(package_name, available_keys)

    if resolved_name is None:
        logging.warning("Package '%s' has no visual nodes (wralea). Available packages with nodes: %s",
                       package_name, available_keys)
        # Return empty nodes instead of error - package exists but has no visual nodes
        return {"package_name": package_name, "nodes": {}, "has_wralea": False}

    # retrieve package
    pkg = pm.get(resolved_name)
    nodes: Dict[str, Any] = {}
    # describe each node in the package
    for node_factory in pkg.values():
        node_name = getattr(node_factory, "name", str(node_factory))
        nodes[node_name] = serialize_node(node_factory)

    return {"package_name": resolved_name, "nodes": nodes, "has_wralea": True}

if __name__ == "__main__":
    logging.info("describing an OpenAlea package by subprocess")
    
    if len(sys.argv) != 2:
        logging.error("Package name argument is required.")
        sys.exit(1)
    pkg_name = sys.argv[1]
    try:
        description = describe_openalea_package(pkg_name)
        print(json.dumps(description, indent=2))
    except ValueError as e:
        logging.error("Error: %s", e)
        sys.exit(1)
