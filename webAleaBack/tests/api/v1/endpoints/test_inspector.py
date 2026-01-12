"""Tests for the inspector endpoints."""
import unittest
import unittest.mock

from api.v1.endpoints import inspector

class TestOpenAleaInspectorInspector(unittest.TestCase):
    """Unit tests for OpenAlea Inspector endpoints."""

    # openalea inspector package desc file
    openalea_package_desc_file = "tests/resources/conda/openalea_package_desc.json"

    app_router = inspector.router

    # expected route names
    expected_route_names = {
        "fetch_installed_openalea_packages",
        "fetch_wralea_packages",
        "fetch_package_nodes",
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

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.OpenAleaInspector.list_installed_openalea_packages")
    def test_fetch_installed_openalea_packages(self, mock_list_installed):
        """Test fetching installed OpenAlea packages."""
        mock_list_installed.return_value = {
            "openalea.astk": "3.0.3",
            "openalea.plantgl": "2.8.0"
        }
        installed_packages = inspector.fetch_installed_openalea_packages()
        self.assertIn("openalea.astk", installed_packages["installed_openalea_packages"])
        self.assertIn("openalea.plantgl", installed_packages["installed_openalea_packages"])

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.OpenAleaInspector.list_wralea_packages")
    def test_fetch_wralea_packages(self, mock_list_wralea):
        """Test fetching wralea packages."""
        mock_list_wralea.return_value = ["openalea.astk", "openalea.srsm"]
        wralea_packages = inspector.fetch_wralea_packages()
        self.assertIn("openalea.astk", wralea_packages["wralea_packages"])
        self.assertIn("openalea.srsm", wralea_packages["wralea_packages"])

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.OpenAleaInspector.describe_openalea_package")
    def test_fetch_package_nodes(self, mock_describe_package):
        """Test fetching nodes of an OpenAlea package."""
        mock_describe_package.return_value = open(
            self.openalea_package_desc_file,
            encoding="utf-8"
        ).read()
        package_nodes = inspector.fetch_package_nodes("openalea.astk")
        self.assertIn("nodes", package_nodes)
        self.assertGreater(len(package_nodes), 0)
        self.assertIn("iter with delays", package_nodes)
