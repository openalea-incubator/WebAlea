"""Tests for the conda module."""
import unittest
from conda.conda import Conda

class TestCondaMethods(unittest.TestCase):
    """Unit tests for Conda class methods."""

    def test_get_versions_existing_package(self):
        """Test getting versions for an existing package."""
        versions = Conda.get_versions("agroservices")
        self.assertIsInstance(versions, list)
        self.assertGreater(len(versions), 0)

    def test_get_versions_nonexistent_package(self):
        """Test getting versions for a non-existent package."""
        versions = Conda.get_versions("nonexistent_package_12345")
        self.assertIsInstance(versions, list)
        self.assertEqual(len(versions), 0)

    def test_list_packages(self):
        """Test listing packages from a channel."""
        packages = Conda.list_packages()
        self.assertIsInstance(packages, dict)
        self.assertTrue(len(packages) > 0)

    def test_list_latest_packages(self):
        """Test listing latest package versions from a channel."""
        latest_packages = Conda.list_latest_packages()
        self.assertIsInstance(latest_packages, dict)
        self.assertTrue(len(latest_packages) > 0)
        packages = Conda.list_packages()
        self.assertTrue(len(latest_packages) <= len(packages))

    def test_install_package(self):
        """Test installing a package in a conda environment."""
        try:
            Conda.install_package("agroservices", env_name="test_env")
        except Exception as e:
            self.fail(f"install_package raised an exception: {e}")

    def test_install_package_list(self):
        """Test installing a list of packages in a conda environment."""
        package_list = ["agroservices", "nonexistent_package_12345"]
        results = Conda.install_package_list("test_env", package_list)
        self.assertIn("installed", results)
        self.assertIn("failed", results)
        self.assertIn("agroservices", results["installed"])
        self.assertTrue(any(
                failure["package"] == "nonexistent_package_12345" for failure in results["failed"]
            ))
