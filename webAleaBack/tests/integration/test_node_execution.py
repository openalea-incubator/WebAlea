"""Integration tests for node execution in WebAleaBack."""
from unittest import TestCase
from dotenv import load_dotenv

import subprocess
import os
import json


from api.v1.endpoints.runner import execute_single_node
from types import SimpleNamespace

load_dotenv("tests/.env")

class TestNodeExecutionIntegration(TestCase):
    """Integration tests for node execution"""


    package_to_execute = os.getenv("PACKAGE_TO_EXECUTE")
    node_execution_request_file = os.getenv("NODE_EXECUTION_REQUEST_FILE")
    expected_node_execution_response_file = os.getenv("NODE_EXECUTION_RESPONSE_FILE")

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
            self.assertEqual(response["node_id"], expected_response["node_id"])
            self.assertEqual(response["outputs"], expected_response["outputs"])

        except subprocess.CalledProcessError as e:
            self.fail(f"Node execution failed with error: {e}")
        except FileNotFoundError as e:
            self.fail(f"Test resource file not found: {e}")
        except json.JSONDecodeError as e:
            self.fail(f"Error decoding JSON from test resource file: {e}")
