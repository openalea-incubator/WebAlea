"""This module contains unit tests for conda_utils.py."""
from unittest import TestCase
import unittest.mock
import json

from model.openalea.inspector.openalea_inspector import OpenAleaInspector

class TestOpenAleaInspectorMethods(TestCase):
    """Unit tests for OpenAleaInspector class"""

    # data for testing
    mock_openalea_desc_file = "tests/resources/conda/openalea_package_desc.json"

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.subprocess")
    def test_list_installed_openalea_packages(self, mock_subprocess):
        """Test listing installed OpenAlea packages in the current conda environment."""
        # Setup mock subprocess.run
        mock_subprocess.run.return_value.stdout = json.dumps([
            "openalea.astk",
            "openalea.flow",
            "openalea.core"
        ])
        mock_subprocess.run.return_value.returncode = 0
        mock_subprocess.run.return_value.stderr = ""

        # Call the method
        installed_packages = OpenAleaInspector.list_installed_openalea_packages()

        # Assertions
        self.assertIsInstance(installed_packages, list)
        self.assertIn("openalea.astk", installed_packages)
        self.assertIn("openalea.flow", installed_packages)

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.subprocess")
    def test_describe_openalea_package(self, mock_subprocess):
        """Test describing an OpenAlea package."""
        # Setup mock subprocess.run
        with open(self.mock_openalea_desc_file, encoding="utf-8") as f:
            mock_description = f.read()
        mock_subprocess.run.return_value.stdout = mock_description
        mock_subprocess.run.return_value.returncode = 0
        mock_subprocess.run.return_value.stderr = ""
        # Call the method
        pkg_description = OpenAleaInspector.describe_openalea_package("openalea.astk")

        expected_description = json.loads(mock_description)

        self.assertIsInstance(pkg_description, dict)
        self.assertIn("nodes", pkg_description)
        self.assertEqual(len(pkg_description["nodes"]), len(expected_description["nodes"]))
        # if this package gets updated, this test may fail
        self.assertEqual(pkg_description, expected_description)
