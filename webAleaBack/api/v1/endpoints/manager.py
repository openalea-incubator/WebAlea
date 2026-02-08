""""API endpoints for managing conda packages and environments."""
from typing import List, Optional
import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from model.utils.conda_utils import Conda
from core.config import settings

router = APIRouter()


class PackageSpec(BaseModel):
    """Specification for a conda package with optional version."""
    name: str = Field(..., example="openalea.core")
    version: Optional[str] = Field(None, example="2.0.0")


class InstallRequest(BaseModel):
    """Request model for installing packages into a conda environment."""
    packages: List[PackageSpec] = Field(
        ...,
        example=[
            {"name": "openalea.core", "version": "2.0.0"},
            {"name": "openalea.numpy"},
        ],
    )
    env_name: Optional[str] = Field(None, example="webalea_env")

@router.get(
    "/latest",
    responses={
        200: {
            "description": "Latest package versions from the OpenAlea channel",
            "content": {
                "application/json": {
                    "example": {
                        "openalea.core": {"version": "2.0.0", "build": "py_0"},
                        "openalea.numpy": {"version": "1.0.0", "build": "py_0"},
                    }
                }
            },
        }
    },
)
def fetch_latest_package_versions():
    """Fetch the latest versions of all conda packages."""
    logging.info("Fetching latest package versions")
    return Conda.list_latest_packages()


@router.post(
    "/install",
    responses={
        200: {
            "description": "Installation results",
            "content": {
                "application/json": {
                    "example": {
                        "installed": ["openalea.core=2.0.0"],
                        "failed": [],
                    }
                }
            },
        }
    },
)
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
