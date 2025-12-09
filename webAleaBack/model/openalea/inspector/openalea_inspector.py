"""Module to inspect OpenAlea packages in the current conda environment."""
import logging
import subprocess
import ast
import json

from typing import Any, Dict, List



class OpenAleaInspector:
    """Class to inspect OpenAlea packages installed in the current environment."""
    describe_script = "model/openalea/inspector/runnable/describe_openalea_package.py"
    list_installed_script = "model/openalea/inspector/runnable/list_installed_openalea_packages.py"

    @staticmethod
    def list_installed_openalea_packages() -> List[str]:
        """Lists all installed OpenAlea packages in the current conda environment.

        Returns:
            list: A list of installed OpenAlea package names.
        """
        # run the subprocess to get installed packages list
        result = subprocess.run(
            ["python3", OpenAleaInspector.list_installed_script],
            stdout=subprocess.PIPE,
            text=True,
            check=True,
        )
        print(result.stdout)
        # parse output: prefer JSON, fallback to Python literal
        try:
            packages = json.loads(result.stdout)
        except (json.JSONDecodeError, TypeError, ValueError):
            try:
                packages = ast.literal_eval(result.stdout)
            except (ValueError, SyntaxError):
                logging.error("Failed to parse package list output: %s", result.stdout)
                packages = []
        return packages

    @staticmethod
    def describe_openalea_package(package_name: str) -> Dict[str, Any]:
        """Describes the nodes contained in an OpenAlea package.

        Args:
            package_name (str): the name of a package

        Raises:
            ValueError: the package was not found

        Returns:
            dict: the package description (JSON-serializable)
        """
        result = subprocess.run(
            ["python3", OpenAleaInspector.describe_script, package_name],
            stdout=subprocess.PIPE,
            text=True,
            check=True,
        )
        # parse output: prefer JSON, fallback to Python literal
        try:
            description = json.loads(result.stdout)
        except (json.JSONDecodeError, TypeError, ValueError):
            try:
                description = ast.literal_eval(result.stdout)
            except (ValueError, SyntaxError):
                logging.error("Failed to parse package description output: %s", result.stdout)
                description = {}
        return description
