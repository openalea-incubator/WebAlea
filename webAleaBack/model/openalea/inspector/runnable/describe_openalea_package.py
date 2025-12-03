"""
This module describes OpenAlea packages installed in the current conda environment.

Module used via subprocess to for dynamic python instance management.
"""
import logging
import json
from typing import Any, Dict

from openalea.core.pkgmanager import PackageManager



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
            put_dict = {
                "name": put.name,
                "interface": str(put.interface),
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
    # check package existence
    if package_name not in pm.keys():
        logging.error("No OpenAlea package named '%s' found.", package_name)
        raise ValueError(f"No OpenAlea package named '{package_name}' found.")
    # retrieve package
    pkg = pm.get(package_name)
    nodes: Dict[str, Any] = {}
    # describe each node in the package
    for node_factory in pkg.values():
        node_name = getattr(node_factory, "name", str(node_factory))
        nodes[node_name] = serialize_node(node_factory)

    return {"nodes": nodes}

if __name__ == "__main__":
    logging.info("describing an OpenAlea package by subprocess")
    import sys
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
