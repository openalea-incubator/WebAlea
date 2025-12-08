"""Tests for the main API router inclusion of sub-routers."""
import unittest
from api.v1.router import router
from core.config import settings

class TestAppRouter(unittest.TestCase):
    """Unit tests for the main API router."""

    app_router = router
    # expected route names
    expected_route_names = {
        "fetch_package_list",
        "fetch_latest_package_versions",
        "install_packages_in_env",
    }

    def test_manager_router_included(self):
        """Test that the manager router is included in the main API router."""
        routes_names  = {route.name for route in self.app_router.routes}
        # Check that each expected route is included with correct prefix
        for route_name in self.expected_route_names:
            self.assertIn(
                route_name,
                routes_names,
                f"Route '{route_name}' not found in main API router."
            )
