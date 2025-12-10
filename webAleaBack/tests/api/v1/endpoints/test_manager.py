"""Tests for the manager endpoints."""
import unittest
import unittest.mock

from api.v1.endpoints import manager

class TestManagerEndpoints(unittest.TestCase):
    """Unit tests for manager endpoints."""

    # openalea inspector package desc file
    openalea_package_desc_file = "tests/resources/conda/openalea_package_desc.json"

    app_router = manager.router
    # expected route names
    expected_route_names = {
        "fetch_package_list",
        "fetch_latest_package_versions",
        "install_packages_in_env",
    }
    # mock data for testing
    mock_list_packages_output_file = "tests/resources/conda/mock_list_package.json"

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

    @unittest.mock.patch("conda_utils.conda_utils.Conda.list_packages")
    def test_fetch_package_list(self, conda_list_packages):
        """Test fetching the package list."""
        conda_list_packages.return_value = open(
            self.mock_list_packages_output_file,
            encoding="utf-8"
        ).read()
        packages = manager.fetch_package_list()
        self.assertTrue(len(packages) > 0)
        self.assertIn("openalea.astk", packages)

    @unittest.mock.patch("conda_utils.conda_utils.Conda.list_latest_packages")
    def test_fetch_latest_package_versions(self, conda_list_latest_packages):
        """Test fetching the latest package versions."""
        conda_list_latest_packages.return_value = open(
            self.mock_list_packages_output_file,
            encoding="utf-8"
        ).read()
        latest_packages = manager.fetch_latest_package_versions()
        self.assertTrue(len(latest_packages) > 0)

    @unittest.mock.patch("conda_utils.conda_utils.Conda.install_package_list")
    def test_install_packages_in_env(self, conda_install_package_list):
        """Test installing packages in a conda environment via the endpoint."""
        request = manager.InstallRequest(
            packages=[
                manager.PackageSpec(name="agroservices")
            ],
            env_name="test_env"
        )
        conda_install_package_list.return_value = {
            "installed": ["agroservices"],
            "failed": []
        }
        results = manager.install_packages_in_env(request)
        self.assertIn("installed", results)
        self.assertIn("agroservices", results["installed"])

    @unittest.mock.patch("conda_utils.conda_utils.Conda.install_package_list")
    def test_install_packages_in_env_with_failure(self, conda_install_package_list):
        """Test installing packages with one expected failure."""
        request = manager.InstallRequest(
            packages=[
                manager.PackageSpec(name="nonexistent_package_12345")
            ],
            env_name="test_env"
        )
        conda_install_package_list.return_value = {
            "installed": [],
            "failed": [{"package": "nonexistent_package_12345", "error": "Package not found"}]
        }
        results = manager.install_packages_in_env(request)
        self.assertIn("failed", results)
        self.assertTrue(any(
            failure["package"] == "nonexistent_package_12345" for failure in results["failed"]
        ))

    @unittest.mock.patch("conda_utils.conda_inspector.OpenAleaInspector.list_installed_openalea_packages")
    def test_fetch_installed_openalea_packages(self, mock_list_installed):
        """Test fetching installed OpenAlea packages."""
        mock_list_installed.return_value = {
            "openalea.astk": "3.0.3",
            "openalea.plantgl": "2.8.0"
        }
        installed_packages = manager.fetch_installed_openalea_packages()
        self.assertIn("openalea.astk", installed_packages["installed_openalea_packages"])
        self.assertIn("openalea.plantgl", installed_packages["installed_openalea_packages"])

    @unittest.mock.patch("conda_utils.conda_inspector.OpenAleaInspector.describe_openalea_package")
    def test_fetch_package_nodes(self, mock_describe_package):
        """Test fetching nodes of an OpenAlea package."""
        mock_describe_package.return_value = open(
            self.openalea_package_desc_file,
            encoding="utf-8"
        ).read()
        package_nodes = manager.fetch_package_nodes("openalea.astk")
        self.assertIn("nodes", package_nodes)
        self.assertTrue(len(package_nodes) > 0)
        self.assertIn("iter with delays", package_nodes)
