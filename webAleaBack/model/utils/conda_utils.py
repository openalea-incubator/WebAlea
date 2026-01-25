"""Module to manage conda environments and packages."""
import json
import subprocess
import logging
import re
from typing import Iterator, Dict, Any, Optional

from packaging.version import Version
from core.config import settings

logger = logging.getLogger(__name__)

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
            if "alinea" not in package_name:
                latest_entry = max(package_list, key=lambda e: Version(e["version"]))
                latest_versions[package_name] = latest_entry
        return latest_versions

    @staticmethod
    def install_package(package_name: str, version: str = None, env_name: str = None):
        """installs a package in the conda environment

        Args:
            package_name (str): the package to install
            version (str, optional): the version. Defaults to latest.
            env_name (str, optional): the conda environment name. Defaults to default environment.

        Raises:
            RuntimeError: if installation fails
        """
        pkg = f"{package_name}={version}" if version else package_name
        env_name = env_name or settings.CONDA_ENV_NAME

        cmd = [
            "conda", "install",
            "-n", env_name,
            "-c", "openalea3",
            "-c", "conda-forge",
            pkg,
            "-y",
        ]

        logger.info("Running command: %s", ' '.join(cmd))

        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )

        logger.info("Conda stdout:\n%s", result.stdout)

        if result.returncode != 0:
            logger.error("Conda stderr:\n%s", result.stderr)
            raise RuntimeError(
                f"Conda install failed for {pkg} (exit code {result.returncode})"
            )

        logger.info("Package %s installed successfully", pkg)

    @staticmethod
    def install_package_with_progress(
        package_name: str, 
        version: str = None, 
        env_name: str = None
    ) -> Iterator[Dict[str, Any]]:
        """Installs a package in the conda environment with progress updates.

        Yields progress events as dictionaries with the following structure:
        - {"type": "status", "message": "..."}
        - {"type": "download", "package": "...", "size": "...", "downloaded": "...", "percent": 0-100}
        - {"type": "extract", "message": "..."}
        - {"type": "complete", "package": "..."}
        - {"type": "error", "message": "..."}

        Args:
            package_name (str): the package to install
            version (str, optional): the version. Defaults to latest.
            env_name (str, optional): the conda environment name. Defaults to default environment.

        Yields:
            Dict[str, Any]: Progress event dictionary
        """
        pkg = f"{package_name}={version}" if version else package_name
        env_name = env_name or settings.CONDA_ENV_NAME

        cmd = [
            "conda", "install",
            "-n", env_name,
            "-c", "openalea3",
            "-c", "conda-forge",
            pkg,
            "-y",
        ]

        logger.info("Running command: %s", ' '.join(cmd))
        yield {"type": "status", "message": f"Starting installation of {pkg}..."}

        try:
            # Use Popen to read output in real-time
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,  # Merge stderr into stdout
                text=True,
                bufsize=1,  # Line buffered
                universal_newlines=True
            )

            # Patterns to match conda output
            download_pattern = re.compile(
                r'Downloading\s+.*?:\s+(\d+%)\s+(\d+\.?\d*)\s*([KMGT]?B)\s+/\s+(\d+\.?\d*)\s*([KMGT]?B)'
            )
            downloading_pattern = re.compile(
                r'Downloading\s+([^\s]+).*?(\d+\.?\d*)\s*([KMGT]?B)'
            )
            extracting_pattern = re.compile(r'Extracting|extracting', re.IGNORECASE)
            percent_pattern = re.compile(r'(\d+)%')
            size_pattern = re.compile(r'(\d+\.?\d*)\s*([KMGT]?B)', re.IGNORECASE)

            current_package = None
            current_size = None
            current_downloaded = None

            # Read output line by line
            for line in process.stdout:
                line = line.strip()
                if not line:
                    continue

                logger.debug("Conda output: %s", line)

                # Check for download progress
                download_match = download_pattern.search(line)
                if download_match:
                    percent = int(download_match.group(1).rstrip('%'))
                    downloaded = float(download_match.group(2))
                    downloaded_unit = download_match.group(3)
                    total = float(download_match.group(4))
                    total_unit = download_match.group(5)
                    
                    yield {
                        "type": "download",
                        "package": pkg,
                        "downloaded": f"{downloaded}{downloaded_unit}",
                        "total": f"{total}{total_unit}",
                        "percent": percent
                    }
                    continue

                # Check for "Downloading package_name: size"
                downloading_match = downloading_pattern.search(line)
                if downloading_match:
                    current_package = downloading_match.group(1)
                    size_str = downloading_match.group(2)
                    size_unit = downloading_match.group(3)
                    current_size = f"{size_str}{size_unit}"
                    yield {
                        "type": "status",
                        "message": f"Downloading {current_package} ({current_size})..."
                    }
                    continue

                # Check for extraction
                if extracting_pattern.search(line):
                    yield {
                        "type": "extract",
                        "message": "Extracting package..."
                    }
                    continue

                # Check for percentage in line (fallback)
                percent_match = percent_pattern.search(line)
                if percent_match and ("download" in line.lower() or "downloading" in line.lower()):
                    percent = int(percent_match.group(1))
                    yield {
                        "type": "download",
                        "package": pkg,
                        "percent": percent,
                        "message": line
                    }
                    continue

                # General status messages
                if any(keyword in line.lower() for keyword in ["solving", "collecting", "preparing", "verifying"]):
                    yield {
                        "type": "status",
                        "message": line
                    }

            # Wait for process to complete
            process.wait()

            if process.returncode != 0:
                error_msg = f"Conda install failed for {pkg} (exit code {process.returncode})"
                logger.error(error_msg)
                yield {"type": "error", "message": error_msg}
                raise RuntimeError(error_msg)

            yield {"type": "complete", "package": pkg, "message": f"Package {pkg} installed successfully"}
            logger.info("Package %s installed successfully", pkg)

        except Exception as e:
            error_msg = f"Error installing {pkg}: {str(e)}"
            logger.exception(error_msg)
            yield {"type": "error", "message": error_msg}
            raise

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
            except (subprocess.CalledProcessError, FileNotFoundError, RuntimeError) as e:
                logger.error("Failed to install %s: %s", pkg, e)
                results["failed"].append({"package": pkg, "error": str(e)})
        return results

    @staticmethod
    def install_package_list_with_progress(
        env_name: str, 
        package_list: list
    ) -> Iterator[Dict[str, Any]]:
        """Install a list of packages with progress updates.

        Args:
            env_name (str): The name of the conda environment.
            package_list (list): A list of package specifications (e.g. ["pkg1=1.2.3", "pkg2"]).

        Yields:
            Dict[str, Any]: Progress event dictionary
        """
        total = len(package_list)
        installed = []
        failed = []

        for idx, pkg in enumerate(package_list):
            # Extract package name (remove version if present)
            pkg_name = pkg.split('=')[0] if '=' in pkg else pkg
            
            yield {
                "type": "package_start",
                "package": pkg_name,
                "package_index": idx + 1,
                "total_packages": total
            }

            try:
                # Parse version if present
                version = None
                if '=' in pkg:
                    version = pkg.split('=', 1)[1]
                    pkg_name_only = pkg.split('=')[0]
                else:
                    pkg_name_only = pkg

                # Yield progress events from installation
                for event in Conda.install_package_with_progress(
                    pkg_name_only, 
                    version=version, 
                    env_name=env_name
                ):
                    # Add package context to events
                    event["package"] = pkg_name
                    yield event

                installed.append(pkg)
                yield {
                    "type": "package_complete",
                    "package": pkg_name,
                    "package_index": idx + 1,
                    "total_packages": total
                }

            except Exception as e:
                logger.error("Failed to install %s: %s", pkg, e)
                failed.append({"package": pkg, "error": str(e)})
                yield {
                    "type": "package_error",
                    "package": pkg_name,
                    "error": str(e),
                    "package_index": idx + 1,
                    "total_packages": total
                }

        # Final summary
        yield {
            "type": "installation_complete",
            "installed": installed,
            "failed": failed,
            "total": total
        }
