"""This module contains unit tests for conda_utils.py."""
from unittest import TestCase
import unittest.mock
import json

from model.openalea.inspector.openalea_inspector import OpenAleaInspector

class TestOpenAleaInspectorMethods(TestCase):
    """Unit tests for OpenAleaInspector class"""

    # data for testing
    mock_openalea_desc_file = "tests/resources/conda/openalea_package_desc.json"

    @unittest.mock.patch("conda_utils.conda_inspector.PackageManager")
    def test_list_installed_openalea_packages(self, mock_package_manager):
        """Test listing installed OpenAlea packages in the current conda environment."""
        # Setup mock package manager
        mock_pm_instance = mock_package_manager.return_value
        mock_pm_instance.init.return_value = None
        mock_pm_instance.keys.return_value = ["openalea.astk", "openalea.flow"]

        # Call the method
        installed_packages = OpenAleaInspector.list_installed_openalea_packages()

        # Assertions
        self.assertIsInstance(installed_packages, list)
        self.assertIn("openalea.astk", installed_packages)
        self.assertIn("openalea.flow", installed_packages)

    # @unittest.skip("Skipping test that requires actual OpenAlea package.")
    def test_describe_openalea_package(self):
        """Test describing an OpenAlea package."""
        pkg_description = OpenAleaInspector.describe_openalea_package("openalea.astk")

        expected_description = open(
            self.mock_openalea_desc_file,
            encoding="utf-8"
        ).read()
        expected_description = json.loads(expected_description)

        self.assertIsInstance(pkg_description, dict)
        self.assertIn("nodes", pkg_description)
        self.assertEqual(len(pkg_description["nodes"]), len(expected_description["nodes"]))
        # if this package gets updated, this test may fail
        self.assertEqual(pkg_description, expected_description)
