"""Helpers for OpenAleaRunner subprocess execution."""
from __future__ import annotations

import json
import logging
import subprocess
from typing import Any, Dict, List

def build_node_info(package_name: str, node_name: str, inputs: dict) -> Dict[str, Any]:
    """Build node info for subprocess execution.

    Args:
        package_name (str): Name of the OpenAlea package (e.g., "openalea.core").
        node_name (str): Name of the node within the package (e.g., "addition").
        inputs (dict): Input values for the node.
    Returns:
        node_info (Dict[str, Any]): Payload passed to the subprocess.
    """
    return {
        "package_name": package_name,
        "node_name": node_name,
        "inputs": inputs,
    }


def run_node_subprocess(script_path: str, node_info: Dict[str, Any], timeout: int) -> subprocess.CompletedProcess:
    """Run the node execution script as a subprocess.

    Args:
        script_path (str): Path to the execution script.
        node_info (Dict[str, Any]): Payload to pass to the script.
        timeout (int): Execution timeout in seconds.
    Returns:
        result (subprocess.CompletedProcess): Subprocess execution result.
    """
    return subprocess.run(
        ["python3", script_path, json.dumps(node_info)],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False
    )

def log_subprocess_output(result: subprocess.CompletedProcess) -> None:
    """Log subprocess stdout/stderr for debugging.

    Args:
        result (subprocess.CompletedProcess): Subprocess execution result.
    Returns:
        None (None): No return value.
    """
    if result.stderr:
        logging.warning("Subprocess stderr: %s", result.stderr)
    if result.stdout:
        logging.info("Subprocess stdout length: %d", len(result.stdout))

def summarize_outputs(outputs: List[dict]) -> List[dict]:
    """Summarize outputs for logging.

    Args:
        outputs (List[dict]): Raw output list from the subprocess response.
    Returns:
        summary (List[dict]): List with index, name, type, and scene refs if present.
    """
    summary = []
    for out in outputs:
        if not isinstance(out, dict):
            continue
        value = out.get("value")
        value_type = value.get("__type__") if isinstance(value, dict) else None
        summary.append({
            "index": out.get("index"),
            "name": out.get("name"),
            "type": out.get("type"),
            "sceneRef": (
                value.get("__ref__")
                if isinstance(value, dict)
                and value_type in {"plantgl_scene_ref", "plantgl_scene_json_ref"}
                else None
            ),
            "sceneShapeCount": (
                value.get("__meta__", {}).get("shape_count")
                if isinstance(value, dict)
                and value_type in {"plantgl_scene_ref", "plantgl_scene_json_ref"}
                else None
            )
        })
    return summary


def parse_subprocess_response(stdout: str) -> Dict[str, Any] | None:
    """Parse subprocess stdout into a response dict.

    Args:
        stdout (str): Standard output from the subprocess execution.
    Returns:
        response (Dict[str, Any] | None): Parsed response or None if empty.
    """
    if not stdout:
        return None
    try:
        response = json.loads(stdout)
    except json.JSONDecodeError as e:
        logging.error("Failed to decode JSON response: %s", e)
        return {
            "success": False,
            "error": f"Invalid JSON response: {stdout[:200]}"
        }

    outputs = response.get("outputs", [])
    output_summary = summarize_outputs(outputs) if isinstance(outputs, list) else []
    logging.info(
        "OpenAleaRunner: Execution result success=%s outputs=%s error=%s",
        response.get("success"),
        output_summary,
        response.get("error")
    )
    return response
