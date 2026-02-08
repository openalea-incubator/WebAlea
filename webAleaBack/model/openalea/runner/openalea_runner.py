"""Run OpenAlea node execution via subprocess."""
import subprocess
import logging
import os
from unittest import result

from model.openalea.runner.utils.openalea_runner_helpers import (
    build_node_info,
    log_subprocess_output,
    parse_subprocess_response,
    run_node_subprocess,
)

class OpenAleaRunner:
    """Execute OpenAlea nodes in isolated subprocess."""

    # Path to the execution script (relative to backend root)
    SCRIPT_PATH = os.path.join(
        os.path.dirname(__file__),
        "runnable",
        "run_workflow.py"
    )

    @staticmethod
    def execute_node(package_name: str, node_name: str, inputs: dict, timeout: int = 60) -> dict:
        """Execute a single OpenAlea node in a subprocess.

        Args:
            package_name (str): OpenAlea package name (e.g., "openalea.math").
            node_name (str): Node name within the package (e.g., "addition").
            inputs (dict): Input values {name: value} or {index: value}.
            timeout (int): Execution timeout in seconds.
        Returns:
            response (dict): Execution response with success flag and outputs or error.
        """
        logging.info(
            "OpenAleaRunner: Executing '%s.%s' with inputs: %s",
            package_name, node_name, inputs
        )

        # Build node info for subprocess
        node_info = build_node_info(package_name, node_name, inputs)

        try:
            result = run_node_subprocess(OpenAleaRunner.SCRIPT_PATH, node_info, timeout)
            if result.stderr:
                logging.warning("Subprocess stderr: %s", result.stderr)
            if result.stdout:
                logging.info("Subprocess stdout length: %d", len(result.stdout))

            response = parse_subprocess_response(result.stdout)
            if response is not None:
                return response

            return {"success": False, "error": "No output from subprocess"}

        except subprocess.TimeoutExpired:
            logging.error("Node execution timed out after %d seconds", timeout)
            return {
                "success": False,
                "error": f"Execution timed out after {timeout} seconds"
            }

        except FileNotFoundError:
            logging.error("Python3 or script not found: %s", OpenAleaRunner.SCRIPT_PATH)
            return {
                "success": False,
                "error": "Execution environment not properly configured"
            }

        except Exception as e:
            logging.exception("Unexpected error during node execution")
            return {
                "success": False,
                "error": str(e)
            }
