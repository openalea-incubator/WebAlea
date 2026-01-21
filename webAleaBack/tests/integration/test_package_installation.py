"""This modules presents integration tests for package installation via conda."""
from unittest import TestCase
from dotenv import load_dotenv

import subprocess
import os

from api.v1.endpoints.manager import fetch_package_list, install_packages_in_env
from types import SimpleNamespace

load_dotenv("tests/.env")

class TestPackageInstallationIntegration(TestCase):
    """Integration tests for package installation via conda."""

    test_env_name = os.getenv("TEST_ENV_NAME")

    def test_install_openalea_astk_package(self):
        """Test installing the openalea.astk package in a new conda environment."""
        try :
            env_name = self.test_env_name or "webalea_test_env"
            install_request = SimpleNamespace(
                packages=[SimpleNamespace(name="openalea.astk", version="3.0.3")],
                env_name=env_name,
            )
            result = install_packages_in_env(install_request)
            self.assertIn("installed", result)
            self.assertIn("openalea.astk=3.0.3", result["installed"])
        except subprocess.CalledProcessError as e:
            self.fail(f"Package installation failed with error: {e}")
