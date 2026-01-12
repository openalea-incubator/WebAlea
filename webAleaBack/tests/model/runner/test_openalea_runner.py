"""This module in responsible for testing the OpenAleaRunner class"""
import json
import unittest

from model.openalea.runner.openalea_runner import OpenAleaRunner

class TestOpenAleaRunner(unittest.TestCase):
    """Tests the OpenAleaRunner class"""

    @unittest.mock.patch("model.openalea.runner.openalea_runner.subprocess")
    def test_execute_node(self, mock_subprocess):
        # Setup mock subprocess.run
        mock_response = {
            "success": True,
            "outputs": [
                {"index": 0, "name": "result", "value": 5, "type": "int"}
            ]
        }
        mock_subprocess.run.return_value.stdout = json.dumps(mock_response)
        mock_subprocess.run.return_value.returncode = 0
        mock_subprocess.run.return_value.stderr = ""

        # Call the method
        result = OpenAleaRunner.execute_node(
            package_name="openalea.math",
            node_name="addition",
            inputs={"a": 2, "b": 3}
        )

        # Assertions
        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("success"))
        self.assertIn("outputs", result)
        self.assertEqual(len(result["outputs"]), 1)
        self.assertEqual(result["outputs"][0]["value"], 5)