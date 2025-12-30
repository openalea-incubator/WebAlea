""""API endpoints for managing conda packages and environments."""
from typing import List, Optional, Any
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


# --- Node Execution Endpoints ---

class NodeExecutionInput(BaseModel):
    """Input parameter for node execution."""
    id: str
    name: str
    type: str
    value: Optional[Any] = None


class NodeExecutionRequest(BaseModel):
    """Request model for executing a single node."""
    node_id: str
    package_name: str
    node_name: str
    inputs: List[NodeExecutionInput]


class WorkflowExecutionRequest(BaseModel):
    """Request model for executing a workflow."""
    workflow_type: str = "dataflow"
    nodes: List[dict]
    edges: List[dict]


@router.post("/execute/node")
def execute_single_node(request: NodeExecutionRequest):
    """Execute a single OpenAlea node with given inputs.

    Body format:
    {
        "node_id": "node_1",
        "package_name": "openalea.core",
        "node_name": "addition",
        "inputs": [
            {"id": "in_0", "name": "a", "type": "float", "value": 5},
            {"id": "in_1", "name": "b", "type": "float", "value": 3}
        ]
    }

    Response format:
    {
        "success": true,
        "node_id": "node_1",
        "outputs": [
            {"index": 0, "name": "result", "value": 8, "type": "float"}
        ]
    }
    """
    logging.info("Executing node: %s from package: %s", request.node_name, request.package_name)
    logging.info("Inputs received: %s", request.inputs)

    try:
        from model.openalea.openalea_runner import OpenAleaRunner

        # Convert inputs list to dict {name: value}
        inputs_dict = {}
        for inp in request.inputs:
            # Use name as key if available, otherwise use id
            key = inp.name if inp.name else inp.id
            inputs_dict[key] = inp.value

        logging.info("Inputs dict for execution: %s", inputs_dict)

        # Execute node via subprocess
        result = OpenAleaRunner.execute_node(
            package_name=request.package_name,
            node_name=request.node_name,
            inputs=inputs_dict
        )

        # Return response with node_id included
        return {
            "success": result.get("success", False),
            "node_id": request.node_id,
            "outputs": result.get("outputs", []),
            "error": result.get("error")
        }

    except ValueError as e:
        logging.error("Node execution error: %s", str(e))
        return {
            "success": False,
            "node_id": request.node_id,
            "outputs": [],
            "error": str(e)
        }
    except Exception as e:
        logging.exception("Unexpected error during node execution")
        return {
            "success": False,
            "node_id": request.node_id,
            "outputs": [],
            "error": str(e)
        }
