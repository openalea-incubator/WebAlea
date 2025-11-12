"""Module to manage conda environments and packages."""
import json
import os
import subprocess
from packaging.version import Version

class Conda:
    """
    Class to manage conda environments and packages.
    """

    @staticmethod
    def list_packages(channel="openalea"):
        """List all packages in a conda channel.

        Args:
            channel (str, optional): The conda channel to search. Defaults to "openalea".

        Returns:
            dict: A dictionary of packages and their versions.
        """
        result = subprocess.run(
            ["conda", "search", "--override-channels", "-c", channel, "*", "--json"],
            stdout=subprocess.PIPE,
            text=True,
            check=True,
        )
        data = json.loads(result.stdout)
        with open(f"conda_{channel}_packages.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return data

    @staticmethod
    def get_list_last_version(channel="openalea"):
        """Get uniquely last version of package and create JSON

        Args:
            channel (str, optional): The conda channel to search. Defaults to "openalea".

        Returns:
            dict: A dictionary with all last versions of package.
        """
        filename = f"conda_{channel}_packages.json"
        if not os.path.exists(filename):
            Conda.list_packages()
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)
            latest_versions = {}
            for package_name, package_list in data.items():
                latest_entry = max(package_list, key=lambda e: Version(e["version"]))
                latest_versions[package_name] = latest_entry
        with open(f"conda_{channel}_packages_last_version.json", "w", encoding="utf-8") as f:
            json.dump(latest_versions, f, indent=2)
        return

    @staticmethod
    def get_versions(package_name, channel="openalea"):
        """Get all available versions of a package in a conda channel.

        Args:
            package_name (str): The name of the package to search for.
            channel (str, optional): The conda channel to search. Defaults to "openalea".

        Returns:
            list: A list of available versions for the package.
        """
        data = Conda.list_packages(channel)
        versions = sorted({pkg["version"] for pkg in data.get(package_name, [])})
        return versions

    @staticmethod
    def install_package(env_name, package_name, version=None):
        """Install a package in a conda environment.

        Args:
            env_name (str): The name of the conda environment.
            package_name (str): The name of the package to install.
            version (str, optional): The version of the package to install. Defaults to None.
        """
        pkg = f"{package_name}={version}" if version else package_name
        subprocess.run(
            ["conda", "install", "-n", env_name, pkg, "-y"],
            check=True,
        )

    @staticmethod
    def install_all_packages(env_name, channel="openalea"):
        """Install all packages in a conda environment.
        Args:
            env_name (str): The name of the conda environment.
        """
        with open(f"conda_{channel}_packages_last_version.json", "w", encoding="utf-8") as f:
            data = json.load(f)
            for package_name, entries in data.items():
                subprocess.run(
                    ["conda", "install", "-n", env_name, f"{package_name}={entries['version']}", "-y"],
                    check=True,
                )
