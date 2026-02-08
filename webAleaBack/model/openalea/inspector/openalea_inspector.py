"""Module to inspect OpenAlea packages in the current conda environment."""
import logging
import subprocess
import ast
import json
from pathlib import Path

from typing import Any, Dict, List



class OpenAleaInspector:
    """Class to inspect OpenAlea packages installed in the current environment."""
    _BASE_DIR = Path(__file__).resolve().parent
    describe_script = str(_BASE_DIR / "runnable" / "describe_openalea_package.py")
    list_installed_script = str(_BASE_DIR / "runnable" / "list_installed_openalea_packages.py")
    list_wralea_script = str(_BASE_DIR / "runnable" / "list_wralea_packages.py")

    @staticmethod
    def _extract_last_json_object(raw_text: str) -> str | None:
        """Extract the last JSON-like object from raw text output.

        This helps when subprocess stdout is polluted by warnings or logs.
        """
        if not raw_text:
            return None
        depth = 0
        start = None
        last = None
        for idx, ch in enumerate(raw_text):
            if ch == "{":
                if depth == 0:
                    start = idx
                depth += 1
            elif ch == "}":
                if depth > 0:
                    depth -= 1
                    if depth == 0 and start is not None:
                        last = raw_text[start:idx + 1]
                        start = None
        return last

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
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        # Log stderr if present for debugging
        if result.stderr:
            logging.warning("list_installed_openalea_packages stderr: %s", result.stderr)
        # Check return code
        if result.returncode != 0:
            logging.error("list_installed_openalea_packages failed with code %d: %s",
                         result.returncode, result.stderr)
            return []
        # parse output: prefer JSON, fallback to Python literal
        try:
            packages = json.loads(result.stdout)
        except ValueError:
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
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        # Log stderr if present for debugging
        if result.stderr:
            logging.warning("describe_openalea_package stderr: %s", result.stderr)
        # Check return code
        if result.returncode != 0:
            logging.error("describe_openalea_package failed with code %d: %s",
                         result.returncode, result.stderr)
            raise ValueError(f"Failed to describe package '{package_name}': {result.stderr}")
        # parse output: prefer JSON, fallback to Python literal
        try:
            description = json.loads(result.stdout)
        except ValueError:
            candidate = OpenAleaInspector._extract_last_json_object(result.stdout)
            if candidate:
                try:
                    description = json.loads(candidate)
                except ValueError:
                    try:
                        description = ast.literal_eval(candidate)
                    except (ValueError, SyntaxError):
                        description = {}
            else:
                description = {}
            if not description:
                try:
                    description = ast.literal_eval(result.stdout)
                except (ValueError, SyntaxError):
                    logging.error("Failed to parse package description output: %s", result.stdout)
                    description = {}
        return description

    @staticmethod
    def list_wralea_packages() -> List[Dict[str, str]]:
        """Lists all installed packages that have wralea entry points (visual nodes).

        These are the packages that can be used in the visual workflow editor.

        Returns:
            list: A list of dicts with 'name' and 'module' for each wralea package.
            example: [{"name": "package1", "module": "package1.module"}, ...]
        """
        result = subprocess.run(
            ["python3", OpenAleaInspector.list_wralea_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        # Log stderr if present for debugging
        if result.stderr:
            logging.warning("list_wralea_packages stderr: %s", result.stderr)
        # Check return code
        if result.returncode != 0:
            logging.error("list_wralea_packages failed with code %d: %s",
                         result.returncode, result.stderr)
            return []
        # parse output
        try:
            packages = json.loads(result.stdout)
        except ValueError:
            logging.error("Failed to parse wralea packages output: %s", result.stdout)
            packages = []
        return packages
