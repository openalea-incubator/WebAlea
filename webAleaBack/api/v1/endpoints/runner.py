""""API endpoints for running openalea workflows."""
from typing import List, Optional, Any
import logging

from fastapi import APIRouter
from pydantic import BaseModel

from webAleaBack.model.openalea.runner.openalea_runner import OpenAleaRunner

router = APIRouter()


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


@router.post("/execute")
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
    except (OSError, RuntimeError) as e:
        logging.exception("Unexpected error during node execution")
        return {
            "success": False,
            "node_id": request.node_id,
            "outputs": [],
            "error": str(e)
        }
