"""Module to manage conda environments and packages."""
import json
import subprocess

from packaging.version import Version
from core.config import settings

class Conda:
    """
    Class to manage conda environments and packages.
    """

    @staticmethod
    def list_packages(channel : str =settings.OPENALEA_CHANNEL) -> dict:
        """List all packages in a conda channel.

        Args:
            channel (str, optional): The conda channel to search.
            Defaults to settings.OPENALEA_CHANNEL.

        Returns:
            dict: A dictionary of packages and their versions.
        """
        result = subprocess.run(
            ["conda", "search", "--override-channels", "-c", channel, "openalea*", "--json"],
            stdout=subprocess.PIPE,
            text=True,
            check=True,
        )
        data = json.loads(result.stdout)
        return data

    @staticmethod
    def list_latest_packages(channel : str=settings.OPENALEA_CHANNEL) -> dict:
        """Get uniquely last version of package and create JSON

        Args:
            channel (str, optional): The conda channel to search.
            Defaults to settings.OPENALEA_CHANNEL.

        Returns:
            dict: A dictionary with all last versions of package.
        """
        packages = Conda.list_packages(channel)
        latest_versions = {}
        for package_name, package_list in packages.items():
            if not "alinea" in package_name:
                latest_entry = max(package_list, key=lambda e: Version(e["version"]))
                latest_versions[package_name] = latest_entry
        return latest_versions

    @staticmethod
    def install_package(package_name: str, version: str = None, env_name: str = None):
        """Install a package in a conda environment.

        Args:
            package_name (str): The name of the package to install.
            version (str, optional): The version of the package to install.
            Defaults to None.
            env_name (str, optional): The name of the conda environment.
            Defaults to settings.CONDA_ENV_NAME.
        """
        pkg = f"{package_name}={version}" if version else package_name
        env_name = env_name or settings.CONDA_ENV_NAME # Use default env name if none provided
        subprocess.run(
            ["conda", "install", "-n", env_name, pkg, "-y"],
            check=True,
        )

    @staticmethod
    def install_package_list(env_name : str, package_list: list) -> dict:
        """Install a list of packages in a conda environment.

        Args:
            env_name (str): The name of the conda environment.
            package_list (list): A list of package specifications (e.g. ["pkg1=1.2.3", "pkg2"]).

        Returns:
            dict: A dictionary with 'installed' and 'failed' lists.
        """
        results = {"installed": [], "failed": []}
        for pkg in package_list:
            try:
                Conda.install_package(pkg, env_name=env_name)
                results["installed"].append(pkg)
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                results["failed"].append({"package": pkg, "error": str(e)})
        return results

    @staticmethod
    def install_all_packages(env_name: str, channel: str=settings.OPENALEA_CHANNEL):
        """Install all packages in a conda environment.
        Args:
            env_name (str): The name of the conda environment.
            channel (str): The conda channel to search. Defaults to settings.OPENALEA_CHANNEL.
        """
        packages = Conda.list_latest_packages(channel)
        package_list = [f"{name}={info['version']}" for name, info in packages.items()]
        return Conda.install_package_list(env_name, package_list)
