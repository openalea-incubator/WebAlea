"""Tests for the manager endpoints."""
import unittest
import unittest.mock

from fastapi import HTTPException

from api.v1.endpoints import manager
from core.config import settings
from conda_utils.conda_utils import Conda

class TestManagerEndpoints(unittest.TestCase):
    """Unit tests for manager endpoints."""

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

    @unittest.mock.patch("api.v1.endpoints.manager.Conda.list_packages")
    def test_fetch_package_list(self, mock_list_packages):
        """Test fetching the package list."""
        mock_list_packages.return_value = open(
            self.mock_list_packages_output_file,
            encoding="utf-8"
        ).read()
        packages = manager.fetch_package_list()
        self.assertTrue(len(packages) > 0)
        self.assertIn("openalea.astk", packages)

    @unittest.mock.patch("api.v1.endpoints.manager.Conda.list_latest_packages")
    def test_fetch_latest_package_versions(self, mock_list_latest_packages):
        """Test fetching the latest package versions."""
        mock_list_latest_packages.return_value = open(
            self.mock_list_packages_output_file,
            encoding="utf-8"
        ).read()
        latest_packages = manager.fetch_latest_package_versions()
        self.assertTrue(len(latest_packages) > 0)

    @unittest.mock.patch("api.v1.endpoints.manager.Conda.install_package_list")
    def test_install_packages_in_env(self, mock_install_package_list):
        """Test installing packages in a conda environment via the endpoint."""
        request = manager.InstallRequest(
            packages=[
                manager.PackageSpec(name="agroservices")
            ],
            env_name="test_env"
        )
        try:
            mock_install_package_list.return_value = {
                "installed": ["agroservices"],
                "failed": []
            }
            results = manager.install_packages_in_env(request)
            self.assertIn("installed", results)
            self.assertIn("agroservices", results["installed"])
        except HTTPException as e:
            self.fail(f"install_packages_in_env raised HTTPException: {e.detail}")

    @unittest.mock.patch("api.v1.endpoints.manager.Conda.install_package_list")
    def test_install_packages_in_env_with_failure(self, mock_install_package_list):
        """Test installing packages with one expected failure."""
        request = manager.InstallRequest(
            packages=[
                manager.PackageSpec(name="nonexistent_package_12345")
            ],
            env_name="test_env"
        )
        mock_install_package_list.return_value = {
            "installed": [],
            "failed": [{"package": "nonexistent_package_12345", "error": "Package not found"}]
        }
        results = manager.install_packages_in_env(request)
        self.assertIn("failed", results)
        self.assertTrue(any(
            failure["package"] == "nonexistent_package_12345" for failure in results["failed"]
        ))
