"""This module presents integration tests for package inspection via the inspector endpoints."""
from unittest import TestCase
from dotenv import load_dotenv

import subprocess
import os
import json

from api.v1.endpoints.inspector import fetch_installed_openalea_packages, fetch_wralea_packages, fetch_package_nodes

load_dotenv("tests/.env")

class TestPackageInspectionIntegration(TestCase):
    """Integration tests for package inspection via the inspector endpoints."""

    installed_package = os.getenv("INSTALLED_PACKAGE")
    package_description_file = os.getenv("PACKAGE_DESCRIPTION_FILE")
    list_wralea_packages_file = os.getenv("LIST_WRALEA_PACKAGES_FILE")

    def test_fetch_installed_openalea_packages(self):
        """Test fetching the list of installed OpenAlea packages in the current environment."""
        try:
            installed_packages = fetch_installed_openalea_packages()
            self.assertIsInstance(installed_packages, dict)
            self.assertIn(
                    self.installed_package,
                    installed_packages.get("installed_openalea_packages", [])
                )
        except subprocess.CalledProcessError as e:
            self.fail(f"Fetching installed OpenAlea packages failed with error: {e}")

    def test_fetch_wralea_packages(self):
        """Test fetching the list installed packages with visual nodes (wralea)."""
        try:
            wralea_packages = fetch_wralea_packages()
            self.assertIsInstance(wralea_packages, dict)
            self.assertIn("wralea_packages", wralea_packages)
            self.assertIsInstance(wralea_packages.get("wralea_packages"), list)
            self.assertGreater(len(wralea_packages.get("wralea_packages", [])), 0)
        except subprocess.CalledProcessError as e:
            self.fail(f"Fetching wralea packages failed with error: {e}")

    def test_fetch_package_nodes(self):
        """Test fetching the nodes of a specific installed package."""
        try:
            package_info = fetch_package_nodes(self.installed_package)
            self.assertIsInstance(package_info, dict)
            self.assertEqual(
                package_info,
                json.load(open(self.package_description_file, encoding="utf-8"))
            )
        except subprocess.CalledProcessError as e:
            self.fail(f"Fetching package nodes failed with error: {e}")
