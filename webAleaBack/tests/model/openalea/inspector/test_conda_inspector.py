"""This module contains unit tests for conda_utils.py."""
from unittest import TestCase
import unittest.mock
import json

from model.openalea.inspector.openalea_inspector import OpenAleaInspector

class TestOpenAleaInspectorMethods(TestCase):
    """Unit tests for OpenAleaInspector class"""

    # data for testing
    mock_openalea_desc_file = "tests/resources/conda/openalea.astk_description.json"

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

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.subprocess")
    def test_list_wralea_packages(self, mock_subprocess):
        """Test listing wralea packages in an OpenAlea package."""
        # Setup mock subprocess.run
        mock_subprocess.run.return_value.stdout = json.dumps([
            "wralea_package_1",
            "wralea_package_2",
            "wralea_package_3"
        ])
        mock_subprocess.run.return_value.returncode = 0
        mock_subprocess.run.return_value.stderr = ""

        # Call the method
        wralea_packages = OpenAleaInspector.list_wralea_packages()

        # Assertions
        self.assertIsInstance(wralea_packages, list)
        self.assertIn("wralea_package_1", wralea_packages)
        self.assertIn("wralea_package_2", wralea_packages)


class TestOpenAleaInspectorFailure(TestCase):
    """Unit tests for OpenAleaInspector class failure cases"""

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.subprocess")
    def test_list_installed_openalea_packages_failure(self, mock_subprocess):
        """Test failure case for listing installed OpenAlea packages."""
        # Setup mock subprocess.run to simulate failure
        mock_subprocess.run.return_value.stdout = ""
        mock_subprocess.run.return_value.returncode = 1
        mock_subprocess.run.return_value.stderr = "Error occurred"

        # Call the method
        installed_packages = OpenAleaInspector.list_installed_openalea_packages()

        # Assertions
        self.assertIsInstance(installed_packages, list)
        self.assertEqual(len(installed_packages), 0)

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.subprocess")
    def test_describe_openalea_package_failure(self, mock_subprocess):
        """Test failure case for describing an OpenAlea package."""
        # Setup mock subprocess.run to simulate failure
        mock_subprocess.run.return_value.stdout = ""
        mock_subprocess.run.return_value.returncode = 1
        mock_subprocess.run.return_value.stderr = "Error occurred"

        # Call the method and expect ValueError
        with self.assertRaises(ValueError):
            OpenAleaInspector.describe_openalea_package("nonexistent_package")

    @unittest.mock.patch("model.openalea.inspector.openalea_inspector.subprocess")
    def test_list_wralea_packages_failure(self, mock_subprocess):
        """Test failure case for listing wralea packages."""
        # Setup mock subprocess.run to simulate failure
        mock_subprocess.run.return_value.stdout = ""
        mock_subprocess.run.return_value.returncode = 1
        mock_subprocess.run.return_value.stderr = "Error occurred"

        # Call the method
        wralea_packages = OpenAleaInspector.list_wralea_packages()

        # Assertions
        self.assertIsInstance(wralea_packages, list)
        self.assertEqual(len(wralea_packages), 0)
