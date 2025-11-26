""""API endpoints for managing conda packages and environments."""
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from conda_utils.conda_utils import Conda
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
    return Conda.list_packages()


@router.get("/latest")
def fetch_latest_package_versions():
    """Fetch the latest versions of all conda packages."""
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
    env_name = request.env_name or settings.CONDA_ENV_NAME

    # build package list with versions
    package_list = [
            pkg.name + (f"={pkg.version}" if pkg.version else "") for pkg in request.packages
        ]

    results = Conda.install_package_list(env_name, package_list)

    if results["failed"]:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=results)

    return results



# POC test 26/11
@router.get("/poc/get_node")
def poc_get_node():
    """GET POC fake type node"""
    node_json = {
        "concatenate" : {
            "parameters": {
                "parameter1": "string",
                "parameter2": "string",
            }
        },
        "addition": {
            "parameters": {
                "parameter1": "int",
                "parameter2": "int",
            }
        },
        "subtract": {
            "parameters": {
                "parameter1": "int",
                "parameter2": "int",
            }
        }
    }
    return node_json

class ExecuteNode(BaseModel):
    """Request model for executing packages into a conda environment."""
    name_node: str
    parameters: dict

@router.post("/poc/execute_nodes")
def poc_execute_nodes(request: ExecuteNode):
    """Execute POC fake type node"""
    res = {}
    parameters = request.parameters
    match request.name_node:
        case "concatenate":
            res["result"] = concatenate(parameters["parameters1"], parameters["parameters2"])
        case "addition":
            res["result"] = addition(parameters["parameters1"], parameters["parameters2"])
        case "subtract":
            res["result"] = subtraction(parameters["parameters1"], parameters["parameters2"])
        case _:
            pass
    res["success"] = len(res) > 0
    return res