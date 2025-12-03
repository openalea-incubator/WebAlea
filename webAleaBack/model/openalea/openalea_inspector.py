"""Module to inspect OpenAlea packages in the current conda environment."""
import logging
import subprocess
import ast
import json

from typing import Any, Dict, List



class OpenAleaInspector:
    """Class to inspect OpenAlea packages installed in the current environment."""


    @staticmethod
    def list_installed_openalea_packages() -> List[str]:
        """Lists all installed OpenAlea packages in the current conda environment.

        Returns:
            list: A list of installed OpenAlea package names.
        """
        # run the subprocess to get installed packages list
        result = subprocess.run(
            ["python3", "model/openalea/runnable/list_installed_openalea_packages.py"],
            stdout=subprocess.PIPE,
            text=True,
            check=True,
        )
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
            ["python3", "model/openalea/runnable/describe_openalea_package.py", package_name],
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

if __name__ == "__main__":
    inspector = OpenAleaInspector()
    packages = inspector.list_installed_openalea_packages()
    print("Installed OpenAlea packages:", packages)
    if packages:
        package_desc = inspector.describe_openalea_package("openalea.flow control")
        print(f"Description of package openalea.flow control:", package_desc)
