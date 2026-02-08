"""This module contains constants used in the runnable inspector."""
from enum import Enum

# ==============================
# describe_openalea_package.py
# ==============================

# Known OpenAlea interface types
KNOWN_INTERFACES = [
    'IFloat', 'IInt', 'IStr', 'IBool', 'ISequence', 'IDict',
    'IFileStr', 'IDirStr', 'ITextStr', 'ICodeStr', 'IEnumStr',
    'IRGBColor', 'IDateTime', 'ITuple', 'ITuple3', 'IFunction', 'IData'
]

# Mapping from OpenAlea interface types to frontend type strings
INTERFACE_TO_FRONTEND_TYPE_MAP = {
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

class NodeKind(Enum):
    """Enumeration of possible node kinds."""
    SIMPLE = "simple"
    COMPOSITE = "composite"
    PRESET = "preset"
    UNKNOWN = "unknown"