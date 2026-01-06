"""inspector endpoints."""
import logging

from fastapi import APIRouter, HTTPException

from model.openalea.inspector.openalea_inspector import OpenAleaInspector

router = APIRouter()

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
