"""Module to manage conda environments and packages."""
import json
import os
import subprocess
from core.config import settings
from packaging.version import Version

class Conda:
    """
    Class to manage conda environments and packages.
    """

    @staticmethod
    def list_packages(channel=settings.OPENALEA_CHANNEL):
        """List all packages in a conda channel.

        Args:
            channel (str, optional): The conda channel to search. Defaults to settings.OPENALEA_CHANNEL.

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
        return data

    @staticmethod
    def list_latest_packages(channel=settings.OPENALEA_CHANNEL):
        """Get uniquely last version of package and create JSON

        Args:
            channel (str, optional): The conda channel to search. Defaults to settings.OPENALEA_CHANNEL.

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
                if not "alinea" in package_name:
                    latest_entry = max(package_list, key=lambda e: Version(e["version"]))
                    latest_versions[package_name] = latest_entry
        return data

    @staticmethod
    def get_versions(package_name, channel=settings.OPENALEA_CHANNEL):
        """Get all available versions of a package in a conda channel.

        Args:
            package_name (str): The name of the package to search for.
            channel (str, optional): The conda channel to search. Defaults to settings.OPENALEA_CHANNEL.

        Returns:
            list: A list of available versions for the package.
        """
        data = Conda.list_packages(channel)
        versions = sorted({pkg["version"] for pkg in data.get(package_name, [])})
        return versions

    @staticmethod
    def install_package(package_name, version=None, env_name = None):
        """Install a package in a conda environment.

        Args:
            package_name (str): The name of the package to install.
            version (str, optional): The version of the package to install. Defaults to None.
            env_name (str, optional): The name of the conda environment. Defaults to settings.CONDA_ENV_NAME.
        """
        pkg = f"{package_name}={version}" if version else package_name
        env_name = env_name or settings.CONDA_ENV_NAME # Use default env name if none provided
        subprocess.run(
            ["conda", "install", "-n", env_name, pkg, "-y"],
            check=True,
        )

    @staticmethod
    def install_all_packages_wget(env_name, channel=settings.OPENALEA_CHANNEL):
        """Install all packages in a conda environment.
        Args:
            env_name (str): The name of the conda environment.
            channel (str): The conda channel to search. Defaults to settings.OPENALEA_CHANNEL.
        """
        filename = f"conda_{channel}_packages_last_version.json"
        if not os.path.exists(filename):
            Conda.get_list_last_version()
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)
            for package_name, entries in data.items():
                url = entries["url"]
                file_name = url.split("/")[-1]

                # Télécharger le fichier
                subprocess.run(["wget", url], check=True)

                # Installer le fichier téléchargé
                subprocess.run(["conda", "install", "-n", env_name, file_name, "-y"], check=True)

                # Supprimer le fichier après installation
                if os.path.exists(file_name):
                    os.remove(file_name)
                    print(f"{file_name} deleted after install")


    @staticmethod
    def find_channel(package_name):
        channels_to_test = [settings.OPENALEA_CHANNEL, "conda-forge", "defaults"]
        for ch in channels_to_test:
            try:
                out = subprocess.check_output(
                    ["conda", "search", package_name, "-c", ch, "--json"],
                    stderr=subprocess.DEVNULL
                )
                data = json.loads(out)
                if package_name in data:
                    return ch
            except subprocess.CalledProcessError:
                pass
        return None

    @staticmethod
    def install_all_packages(env_name, channel=settings.OPENALEA_CHANNEL):
        """Install all packages in a conda environment.
        Args:
            env_name (str): The name of the conda environment.
            channel (str): The conda channel to search. Defaults to settings.OPENALEA_CHANNEL.
        """
        filename = f"conda_{channel}_packages_last_version.json"
        if not os.path.exists(filename):
            Conda.get_list_last_version()
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)


            def install_depends(depends):
                for dep in depends:
                    if dep in data:
                        install_depends(data[dep]['depends'])
                    dep_channel = Conda.find_channel(dep)
                    if dep_channel:
                        subprocess.run(
                            ["conda", "install", "-n", env_name, "-c", dep_channel, dep, "-y"],
                            check=True,
                        )
                    else:
                        print(f"Impossible de trouver {dep} dans openalea3/conda-forge/defaults")

            for package_name, entries in data.items():
                install_depends(entries.get("depends", []))


                pkg = f"{package_name}={entries['version']}" if entries["version"] else package_name
                subprocess.run(
                    ["conda", "install", "-n", env_name,  "-c", channel, pkg, "-y"],
                    check=True,
                )

