"""This module presents integration tests for package inspection via the inspector endpoints."""
import unittest
from unittest import TestCase
from dotenv import load_dotenv
from pathlib import Path

import subprocess
import os
import json

from api.v1.endpoints.inspector import fetch_installed_openalea_packages, fetch_wralea_packages, fetch_package_nodes

_TESTS_ROOT = next(p for p in Path(__file__).resolve().parents if p.name == "tests")
load_dotenv(_TESTS_ROOT / ".env")


def _resolve_test_path(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    raw_value = str(raw_value)
    path = Path(raw_value)
    if path.is_absolute():
        return str(path)
    normalized = raw_value.replace("\\", "/")
    if normalized.startswith("tests/"):
        return str(_TESTS_ROOT.parent / normalized)
    return str(_TESTS_ROOT / normalized)


def _has_openalea() -> bool:
    try:
        import openalea.core  # noqa: F401
        return True
    except Exception:
        return False

@unittest.skipUnless(_has_openalea(), "OpenAlea not installed")
class TestPackageInspectionIntegration(TestCase):
    """Integration tests for package inspection via the inspector endpoints."""

    installed_package = os.getenv("INSTALLED_PACKAGE")
    package_description_file = _resolve_test_path(os.getenv("PACKAGE_DESCRIPTION_FILE"))
    list_wralea_packages_file = _resolve_test_path(os.getenv("LIST_WRALEA_PACKAGES_FILE"))

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
            self.assertIn("package_name", package_info)
            self.assertEqual(package_info.get("package_name"), self.installed_package)
            self.assertIn("nodes", package_info)
            self.assertIsInstance(package_info.get("nodes"), dict)
            self.assertGreater(len(package_info.get("nodes", {})), 0)
        except subprocess.CalledProcessError as e:
            self.fail(f"Fetching package nodes failed with error: {e}")
