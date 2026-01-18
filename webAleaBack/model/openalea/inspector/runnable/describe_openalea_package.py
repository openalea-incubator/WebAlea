"""
This module describes OpenAlea packages installed in the current conda environment.

Module used via subprocess to for dynamic python instance management.
"""
import logging
import json
import re
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

    try:
        # 1. If it's a CLASS (e.g., IFloat, IInt) - check this FIRST
        if isinstance(interface, type):
            return interface.__name__

        # 2. If it's an INSTANCE (e.g., IFloat(), IInt(0, 100))
        if hasattr(interface, '__class__'):
            class_name = interface.__class__.__name__
            # Avoid generic/meta class names
            if class_name not in ('type', 'NoneType', 'ABCMeta', 'MetaClass'):
                return class_name

        # 3. Fallback: extract from string representation
        iface_str = str(interface)

        # Known OpenAlea interface types
        known_interfaces = [
            'IFloat', 'IInt', 'IStr', 'IBool', 'ISequence', 'IDict',
            'IFileStr', 'IDirStr', 'ITextStr', 'ICodeStr', 'IEnumStr',
            'IRGBColor', 'IDateTime', 'ITuple', 'ITuple3', 'IFunction', 'IData'
        ]

        for iface_type in known_interfaces:
            if iface_type in iface_str:
                return iface_type

        return iface_str if iface_str and iface_str != 'None' else 'None'

    except Exception:
        return "None"


def interface_to_type(interface_name: str) -> str:
    """Map OpenAlea interface name to frontend-compatible type.

    Args:
        interface_name: The OpenAlea interface name (e.g., "IFloat", "IInt")

    Returns:
        str: The frontend type (e.g., "float", "string", "boolean")
    """
    mapping = {
        'IFloat': 'float',
        'IInt': 'float',  # Treated as float in frontend for numeric input
        'IStr': 'string',
        'ITextStr': 'string',
        'ICodeStr': 'string',
        'IFileStr': 'string',
        'IDirStr': 'string',
        'IBool': 'boolean',
        'IEnumStr': 'enum',
        'ISequence': 'array',
        'IDict': 'object',
        'IRGBColor': 'color',
        'IDateTime': 'string',
        'ITuple': 'array',
        'ITuple3': 'array',
        'IFunction': 'function',
        'IData': 'any',
        'None': 'any',
    }
    return mapping.get(interface_name, 'any')


def parse_dict_like_string(s: str) -> dict:
    """Parse a dict-like string from OpenAlea into a proper dict.

    Handles formats like:
    - "{'name': 'x', 'interface': IFloat, 'value': 0.0}"
    - "{'name': 'mode', 'interface': IEnumStr(enum=['a', 'b']), 'value': 'a'}"

    Args:
        s: The dict-like string to parse

    Returns:
        dict: Parsed dictionary with name, interface, value, etc.
    """

    result = {}

    # Extract 'name' field
    name_match = re.search(r"'name':\s*'([^']*)'", s)
    if name_match:
        result['name'] = name_match.group(1)

    # Extract 'interface' field - can be None, IFloat, IEnumStr(enum=[...]), etc.
    # First try to match IEnumStr with enum values
    enum_match = re.search(r"'interface':\s*(IEnumStr\(enum=\[([^\]]+)\]\))", s)
    if enum_match:
        result['interface'] = 'IEnumStr'
        # Extract enum options
        enum_options_str = enum_match.group(2)
        result['enum_options'] = [opt.strip().strip("'\"") for opt in enum_options_str.split(',')]
    else:
        # Try to match simple interface like IFloat, IInt, ITuple, None
        iface_match = re.search(r"'interface':\s*(\w+)", s)
        if iface_match:
            iface_val = iface_match.group(1)
            result['interface'] = iface_val if iface_val != 'None' else None

    # Extract 'value' field - can be string, number, None, True, False
    # Try string value first
    value_str_match = re.search(r"'value':\s*'([^']*)'", s)
    if value_str_match:
        result['value'] = value_str_match.group(1)
    else:
        # Try numeric or boolean value
        value_match = re.search(r"'value':\s*([^,}]+)", s)
        if value_match:
            val_str = value_match.group(1).strip()
            if val_str == 'None':
                result['value'] = None
            elif val_str == 'True':
                result['value'] = True
            elif val_str == 'False':
                result['value'] = False
            else:
                try:
                    # Try to parse as number
                    if '.' in val_str:
                        result['value'] = float(val_str)
                    else:
                        result['value'] = int(val_str)
                except ValueError:
                    result['value'] = val_str

    # Extract 'desc' field if present
    desc_match = re.search(r"'desc':\s*'([^']*)'", s)
    if desc_match:
        result['desc'] = desc_match.group(1)

    # Extract 'optional' field if present
    optional_match = re.search(r"'optional':\s*(True|False)", s)
    if optional_match:
        result['optional'] = optional_match.group(1) == 'True'

    return result


def serialize_node_puts(puts) -> list:
    """Serialize inputs and outputs from a NodeFactory.

    Args:
        puts: List of input/output descriptors from a NodeFactory
              Can be objects with attributes or dict-like strings

    Returns:
        list: Serialized inputs/outputs with interface and type information
    """
    serialized = []
    if not puts:
        return serialized  # empty array if no inputs/outputs

    for idx, put in enumerate(puts):
        try:
            port_name = None
            interface_obj = None
            default_value = None
            optional = False
            desc = ''
            enum_options = None

            # Case 1: put is a string (dict-like representation)
            if isinstance(put, str):
                if put.startswith('{'):
                    # Parse the dict-like string
                    parsed = parse_dict_like_string(put)
                    port_name = parsed.get('name', f'input_{idx}')
                    interface_obj = parsed.get('interface')
                    default_value = parsed.get('value')
                    optional = parsed.get('optional', False)
                    desc = parsed.get('desc', '')
                    enum_options = parsed.get('enum_options')
                else:
                    # Plain string, use as name
                    port_name = put

            # Case 2: put is a dict
            elif isinstance(put, dict):
                port_name = put.get('name', f'input_{idx}')
                interface_obj = put.get('interface')
                default_value = put.get('value')
                optional = put.get('optional', False)
                desc = put.get('desc', '')

            # Case 3: put is an object with attributes
            else:
                port_name = getattr(put, 'name', f'input_{idx}')
                interface_obj = getattr(put, 'interface', None)
                default_value = getattr(put, 'default', None)
                optional = getattr(put, 'optional', False)
                desc = getattr(put, 'desc', '')

            # Extract interface type name
            interface_type = get_interface_type(interface_obj)
            # Map to frontend-compatible type
            frontend_type = interface_to_type(interface_type)

            # Generate a unique ID for the port
            port_id = f"port_{idx}_{port_name}"

            put_dict = {
                "id": port_id,
                "name": port_name,
                "interface": interface_type,
                "type": frontend_type,
                "optional": optional,
                "desc": desc,
            }

            # Include default value if available
            if default_value is not None:
                put_dict["default"] = default_value

            # Include enum options if available
            if enum_options:
                put_dict["enum_options"] = enum_options

            serialized.append(put_dict)

        except (AttributeError, TypeError, ValueError, KeyError) as e:
            # Fallback for any unexpected format
            logging.warning("Failed to serialize port %d: %s - %s", idx, put, e)
            serialized.append({
                "id": f"port_{idx}",
                "name": str(put)[:50] if put else f"input_{idx}",  # Truncate long strings
                "interface": "None",
                "type": "any",
                "optional": False,
                "desc": "",
            })

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



def normalize_package_name(package_name: str, available_keys: list) -> str|None:
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
        logging.warning(
                "Package '%s' has no visual nodes (wralea). Available packages with nodes: %s",
                package_name, available_keys
            )
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
