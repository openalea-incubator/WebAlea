"""Tests for the manager endpoints."""
import unittest

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

    def test_fetch_package_list(self):
        """Test fetching the package list."""
        packages = manager.fetch_package_list()
        self.assertIsInstance(packages, dict)
        self.assertTrue(len(packages) > 0)

    def test_fetch_latest_package_versions(self):
        """Test fetching the latest package versions."""
        latest_packages = manager.fetch_latest_package_versions()
        self.assertIsInstance(latest_packages, dict)
        self.assertTrue(len(latest_packages) > 0)
        packages = Conda.list_packages()
        self.assertTrue(len(latest_packages) <= len(packages))

    def test_install_packages_in_env(self):
        """Test installing packages in a conda environment via the endpoint."""
        request = manager.InstallRequest(
            packages=[
                manager.PackageSpec(name="agroservices")
            ],
            env_name="test_env"
        )
        try:
            results = manager.install_packages_in_env(request)
            self.assertIn("installed", results)
            self.assertIn("agroservices", results["installed"])
        except HTTPException as e:
            self.fail(f"install_packages_in_env raised HTTPException: {e.detail}")

    def test_install_packages_in_env_with_failure(self):
        """Test installing packages with one expected failure."""
        request = manager.InstallRequest(
            packages=[
                manager.PackageSpec(name="nonexistent_package_12345")
            ],
            env_name="test_env"
        )
        with self.assertRaises(HTTPException) as context:
            manager.install_packages_in_env(request)
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn("failed", context.exception.detail)
        failed_packages = [failure["package"] for failure in context.exception.detail["failed"]]
        self.assertIn("nonexistent_package_12345", failed_packages)
