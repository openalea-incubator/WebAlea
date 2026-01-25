""""API endpoints for managing conda packages and environments."""
from typing import List, Optional
import logging
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from model.utils.conda_utils import Conda
from core.config import settings

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


@router.post("/install/stream")
async def install_packages_with_progress(request: InstallRequest):
    """Install packages with Server-Sent Events (SSE) for real-time progress updates.

    Body format:
    {
      "packages": [{"name": "pkg1", "version": "1.2.3"}, {"name": "pkg2"}],
      "env_name": "webalea_env"  # optional
    }

    Returns a Server-Sent Events stream with progress updates.
    """
    logging.info("Installing packages with progress: %s into environment: %s", request.packages, request.env_name)
    env_name = request.env_name or settings.CONDA_ENV_NAME

    # build package list with versions
    package_list = [
        pkg.name + (f"={pkg.version}" if pkg.version else "") for pkg in request.packages
    ]

    def generate():
        """Generator function for SSE stream."""
        try:
            for event in Conda.install_package_list_with_progress(env_name, package_list):
                # Format as Server-Sent Event
                data = json.dumps(event, ensure_ascii=False)
                yield f"data: {data}\n\n"
        except Exception as e:
            error_event = {
                "type": "error",
                "message": f"Installation failed: {str(e)}"
            }
            data = json.dumps(error_event, ensure_ascii=False)
            yield f"data: {data}\n\n"
            logging.exception("Error in installation stream")

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
