""""API endpoints for managing conda packages and environments."""
from typing import List, Optional
import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from model.utils.conda_utils import Conda
from model.openalea.inspector.openalea_inspector import OpenAleaInspector
from core.config import settings
from pydantic.json_schema import model_json_schema

from api.v1.utils.POC import *

router = APIRouter()


class PackageSpec(BaseModel):
    """Specification for a conda package with optional version."""
    name: str
    version: Optional[str] = None


class InstallRequest(BaseModel):
    """Request model for installing packages into a conda environment."""
    packages: List[PackageSpec]
    env_name: Optional[str] = None


@router.get("/")
def fetch_package_list():
    """Fetch the list of all conda packages."""
    logging.info("Fetching package list")
    return Conda.list_packages()


@router.get("/latest")
def fetch_latest_package_versions():
    """Fetch the latest versions of all conda packages."""
    logging.info("Fetching latest package versions")
    return Conda.list_latest_packages()


@router.post("/install")
def install_packages_in_env(request: InstallRequest):
    """Install a list of packages into the given conda environment.

    Body format:
    {
      "packages": [{"name": "pkg1", "version": "1.2.3"}, {"name": "pkg2"}],
      "env_name": "webalea_env"  # optional
    }
    """
    logging.info("Installing packages: %s into environment: %s", request.packages, request.env_name)
    env_name = request.env_name or settings.CONDA_ENV_NAME

    # build package list with versions
    package_list = [
            pkg.name + (f"={pkg.version}" if pkg.version else "") for pkg in request.packages
        ]

    results = Conda.install_package_list(env_name, package_list)
    logging.info("Installation results: %s", results)
    return results

@router.get("/installed")
def fetch_installed_openalea_packages():
    """Fetch the list of installed OpenAlea packages in the current conda environment."""
    logging.info("Fetching installed OpenAlea packages")
    packages = OpenAleaInspector.list_installed_openalea_packages()
    logging.info("Installed OpenAlea packages: %s", packages)
    return {"installed_openalea_packages": packages}


@router.get("/wralea")
def fetch_wralea_packages():
    """Fetch the list of installed packages that have visual nodes (wralea).

    These are the packages that can be used in the visual workflow editor.
    Packages without wralea entry points are utility libraries.
    """
    logging.info("Fetching packages with visual nodes (wralea)")
    packages = OpenAleaInspector.list_wralea_packages()
    logging.info("Wralea packages found: %s", packages)
    return {"wralea_packages": packages}

@router.get("/installed/{package_name}")
def fetch_package_nodes(package_name: str):
    logging.info("Fetching information for package: %s", package_name)
    try:
        description = OpenAleaInspector.describe_openalea_package(package_name)
        logging.info("description successfully retrieved for package: %s", package_name)
        return description

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        logging.exception("UNEXPECTED ERROR in fetch_package_nodes")
        raise HTTPException(status_code=500, detail=str(e))
