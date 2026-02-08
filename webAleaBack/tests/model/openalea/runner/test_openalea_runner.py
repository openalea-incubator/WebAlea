"""This module in responsible for testing the OpenAleaRunner class"""
import json
import unittest

from subprocess import TimeoutExpired

from model.openalea.runner.openalea_runner import OpenAleaRunner

class TestOpenAleaRunner(unittest.TestCase):
    """Tests the OpenAleaRunner class"""

    @unittest.mock.patch("model.openalea.runner.openalea_runner.run_node_subprocess")
    def test_execute_node(self, mock_run_node):
        """Test executing a simple OpenAlea node."""
        # Setup mock subprocess output
        mock_response = {
            "success": True,
            "outputs": [
                {"index": 0, "name": "result", "value": 5, "type": "int"}
            ]
        }
        mock_run_node.return_value = unittest.mock.Mock(
            stdout=json.dumps(mock_response),
            stderr=""
        )

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

class TestOpenAleaRunnerFailure(unittest.TestCase):
    """Tests failure cases for the OpenAleaRunner class"""

    @unittest.mock.patch("model.openalea.runner.openalea_runner.run_node_subprocess")
    def test_execute_node_failure(self, mock_run_node):
        """Test executing a node that fails."""
        # Setup mock subprocess output to simulate failure
        mock_run_node.return_value = unittest.mock.Mock(
            stdout="",
            stderr="Execution error"
        )

        # Call the method
        result = OpenAleaRunner.execute_node(
            package_name="openalea.math",
            node_name="nonexistent_node",
            inputs={"a": 2, "b": 3}
        )

        # Assertions
        self.assertIsInstance(result, dict)
        self.assertFalse(result.get("success"))
        self.assertIn("error", result)

    def test_execute_node_timeout(self):
        """Test executing a node that times out."""
        with unittest.mock.patch(
            "model.openalea.runner.openalea_runner.run_node_subprocess",
            side_effect=TimeoutExpired(cmd="test", timeout=1)
        ):
            # Call the method
            result = OpenAleaRunner.execute_node(
                package_name="openalea.math",
                node_name="addition",
                inputs={"a": 2, "b": 3},
                timeout=1  # short timeout for test
            )

            # Assertions
            self.assertIsInstance(result, dict)
            self.assertFalse(result.get("success"))
            self.assertIn("error", result)
            self.assertIn("timed out", result["error"])

    def test_execute_node_invalid_json(self):
        """Test executing a node that returns invalid JSON."""
        with unittest.mock.patch(
            "model.openalea.runner.openalea_runner.run_node_subprocess"
        ) as mock_run_node:
            # Setup mock subprocess.run to return invalid JSON
            mock_run_node.return_value = unittest.mock.Mock(
                stdout="invalid json",
                stderr=""
            )

            # Call the method
            result = OpenAleaRunner.execute_node(
                package_name="openalea.math",
                node_name="addition",
                inputs={"a": 2, "b": 3}
            )

            # Assertions
            self.assertIsInstance(result, dict)
            self.assertFalse(result.get("success"))
            self.assertIn("error", result)
            self.assertIn("Invalid JSON response", result["error"])

    def test_execute_node_file_not_found(self):
        """Test executing a node when the script file is not found."""
        with unittest.mock.patch(
            "model.openalea.runner.openalea_runner.run_node_subprocess",
            side_effect=FileNotFoundError("No such file or directory")
        ):
            # Call the method
            result = OpenAleaRunner.execute_node(
                package_name="openalea.math",
                node_name="addition",
                inputs={"a": 2, "b": 3}
            )

            # Assertions
            self.assertIsInstance(result, dict)
            self.assertFalse(result.get("success"))
            self.assertIn("error", result)
