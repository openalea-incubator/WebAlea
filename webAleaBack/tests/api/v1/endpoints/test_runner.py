"""Tests for the runner endpoints."""
import unittest
import unittest.mock

from api.v1.endpoints import runner

class TestOpenAleaInspectorRunner(unittest.TestCase):
    """Unit tests for OpenAlea Inspector endpoints."""

    app_router = runner.router

    # expected route names
    expected_route_names = {
        "execute_single_node",
    }

    def test_routes_exist(self):
        """test that all expected routes exist in the manager router."""
        routes_names  = {route.name for route in self.app_router.routes}
        # Check that each expected route is included
        for route_name in self.expected_route_names:
            self.assertIn(
                route_name,
                routes_names,
                f"Route '{route_name}' not found in manager router."
            )

    @unittest.mock.patch("model.openalea.runner.openalea_runner.OpenAleaRunner.execute_node")
    def test_execute_single_node(self, mock_execute_node):
        """Test executing a single OpenAlea node."""
        # mock the execution result
        mock_execute_node.return_value = {
            "success": True,
            "node_id": "node_1",
            "outputs": [
                {"index": 0, "name": "result", "value": 8, "type": "float"}
            ]
        }
        # prepare request
        request = runner.NodeExecutionRequest(
            node_id="node_1",
            package_name="openalea.core",
            node_name="addition",
            inputs=[
                runner.NodeExecutionInput(id="in_0", name="a", type="float", value=5),
                runner.NodeExecutionInput(id="in_1", name="b", type="float", value=3)
            ]
        )
        # execute the node
        response = runner.execute_single_node(request)
        self.assertTrue(response["success"])
        self.assertEqual(response["node_id"], "node_1")
        self.assertEqual(len(response["outputs"]), 1)
        self.assertEqual(response["outputs"][0]["value"], 8)
