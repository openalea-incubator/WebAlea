"""Integration tests for node execution in WebAleaBack."""
import unittest
from unittest import TestCase
from dotenv import load_dotenv
from pathlib import Path

import subprocess
import os
import json


from api.v1.endpoints.runner import execute_single_node
from types import SimpleNamespace

_TESTS_ROOT = next(p for p in Path(__file__).resolve().parents if p.name == "tests")
load_dotenv(_TESTS_ROOT / ".env")


def _resolve_test_path(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    raw_value = str(raw_value)
    path = Path(raw_value)
    if path.is_absolute():
        return str(path)
    normalized = raw_value.replace("\\", "/")
    if normalized.startswith("tests/"):
        return str(_TESTS_ROOT.parent / normalized)
    return str(_TESTS_ROOT / normalized)


def _has_openalea() -> bool:
    try:
        import openalea.core  # noqa: F401
        return True
    except Exception:
        return False

_NODE_REQUEST_FILE = _resolve_test_path(os.getenv("NODE_EXECUTION_REQUEST_FILE"))
_NODE_RESPONSE_FILE = _resolve_test_path(os.getenv("NODE_EXECUTION_RESPONSE_FILE"))
_REQUEST_FILES_AVAILABLE = bool(
    _NODE_REQUEST_FILE
    and _NODE_RESPONSE_FILE
    and Path(_NODE_REQUEST_FILE).exists()
    and Path(_NODE_RESPONSE_FILE).exists()
)


@unittest.skipUnless(_has_openalea() and _REQUEST_FILES_AVAILABLE, "OpenAlea not installed or test resources missing")
class TestNodeExecutionIntegration(TestCase):
    """Integration tests for node execution"""


    package_to_execute = os.getenv("PACKAGE_TO_EXECUTE")
    node_execution_request_file = _NODE_REQUEST_FILE
    expected_node_execution_response_file = _NODE_RESPONSE_FILE

    def test_execute_node(self):
        """Test executing a node from a package."""
        try:
            # Load node execution request from file
            with open(self.node_execution_request_file, encoding="utf-8") as f:
                node_execution_request = json.load(f)
            # Convert dict to SimpleNamespace for easier attribute access
            node_execution_request = SimpleNamespace(
                node_id=node_execution_request["node_id"],
                package_name=node_execution_request["package_name"],
                node_name=node_execution_request["node_name"],
                inputs=[
                    SimpleNamespace(
                        id=input_item["id"],
                        name=input_item["name"],
                        type=input_item["type"],
                        value=input_item.get("value")
                    ) for input_item in node_execution_request["inputs"]
                ]
            )

            # Execute the node
            response = execute_single_node(node_execution_request)

            # Load expected response from file
            with open(self.expected_node_execution_response_file, encoding="utf-8") as f:
                expected_response = json.load(f)

            # Validate response
            self.assertEqual(response["success"], expected_response["success"])
            self.assertEqual(response["outputs"], expected_response["outputs"])

        except subprocess.CalledProcessError as e:
            self.fail(f"Node execution failed with error: {e}")
        except FileNotFoundError as e:
            self.fail(f"Test resource file not found: {e}")
        except json.JSONDecodeError as e:
            self.fail(f"Error decoding JSON from test resource file: {e}")
