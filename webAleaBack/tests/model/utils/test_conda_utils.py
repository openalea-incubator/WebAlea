"""Tests for the conda module."""
from unittest import TestCase
import unittest.mock
import unittest
from subprocess import CalledProcessError
from model.utils.conda_utils import Conda

class TestCondaMethods(TestCase):
    """Unit tests for Conda class methods."""

    # mock data for testing
    mock_list_packages_output_file = "tests/resources/conda/mock_list_package.json"

    @unittest.mock.patch("subprocess.run")
    def test_list_packages(self, mock_run):
        """Test listing packages from a channel."""
        # Use mock data from a file instead of actual subprocess call
        mock_run.return_value.stdout = open(
            self.mock_list_packages_output_file,
            encoding="utf-8"
        ).read()
        # Call the method
        packages = Conda.list_packages()
        self.assertIsInstance(packages, dict)
        self.assertTrue(len(packages) > 0)

    @unittest.mock.patch("subprocess.run")
    def test_list_latest_packages(self, mock_run):
        """Test listing latest package versions from a channel."""
        # Use mock data from a file instead of actual subprocess call
        mock_run.return_value.stdout = open(
            self.mock_list_packages_output_file,
            encoding="utf-8"
        ).read()
        # Call the method
        latest_packages = Conda.list_latest_packages()
        self.assertIsInstance(latest_packages, dict)
        self.assertIn("openalea.astk", latest_packages)
        self.assertIn("3.0.3", latest_packages["openalea.astk"]["version"]) # based on mock data
        self.assertNotIn("3.0.2", latest_packages["openalea.astk"]["version"]) # based on mock data

    @unittest.mock.patch("subprocess.run")
    def test_install_package(self, mock_run):
        """Test installing a package in a conda environment."""
        mock_run.return_value = None
        Conda.install_package("openalea.astk", env_name="test_env")


class TestCondaIntegration(TestCase):
    """Integration tests for Conda class methods."""

    # @unittest.skip("Skipping test that requires actual conda environment.")
    def test_install_package_list(self):
        """Test installing a list of packages in a conda environment."""
        package_list = ["openalea.astk", "nonexistent_package_12345"]
        results = Conda.install_package_list("test_env", package_list)
        self.assertIn("installed", results)
        self.assertIn("failed", results)
        self.assertIn("openalea.astk", results["installed"])
        self.assertTrue(any(
                failure["package"] == "nonexistent_package_12345" for failure in results["failed"]
            ))

    # @unittest.skip("Skipping test that requires actual conda environment.")
    def test_list_packages(self):
        """Test listing packages from a channel."""
        packages = Conda.list_packages()
        self.assertIsInstance(packages, dict)
        self.assertTrue(len(packages) > 0)

    # @unittest.skip("Skipping test that requires actual conda environment.")
    def test_list_latest_packages(self):
        """Test listing latest package versions from a channel."""
        latest_packages = Conda.list_latest_packages()
        self.assertIsInstance(latest_packages, dict)
        self.assertTrue(len(latest_packages) > 0)

    # @unittest.skip("Skipping test that requires actual conda environment.")
    def test_install_package(self):
        """Test installing a package in a conda environment."""
        try:
            Conda.install_package("openalea.astk", env_name="test_env")
        except (CalledProcessError, FileNotFoundError) as e:
            self.fail(f"install_package raised an exception: {e}")

    # @unittest.skip("Skipping test that requires actual conda environment.")
    def test_install_nonexistent_package(self):
        """Test installing a nonexistent package to check error handling."""
        with self.assertRaises((CalledProcessError, FileNotFoundError)):
            Conda.install_package("nonexistent_package_12345", env_name="test_env")
