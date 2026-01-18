"""Run OpenAlea node execution via subprocess."""
import subprocess
import json
import logging
import os

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
        """
        Execute a single OpenAlea node.

        Args:
            package_name: OpenAlea package name (e.g., "openalea.math")
            node_name: Node name within the package (e.g., "addition")
            inputs: Dict of input values {name: value} or {index: value}
            timeout: Execution timeout in seconds

        Returns:
            Dict with: {success: bool, outputs: [{index, name, value, type}, ...]}
            Or: {success: False, error: str}
        """
        logging.info(
            "OpenAleaRunner: Executing '%s.%s' with inputs: %s",
            package_name, node_name, inputs
        )

        # Build node info for subprocess
        node_info = {
            "package_name": package_name,
            "node_name": node_name,
            "inputs": inputs
        }

        try:
            result = subprocess.run(
                ["python3", OpenAleaRunner.SCRIPT_PATH, json.dumps(node_info)],
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )

            # Log stderr if any (for debugging)
            if result.stderr:
                logging.warning("Subprocess stderr: %s", result.stderr)

            # Parse stdout as JSON
            if result.stdout:
                try:
                    response = json.loads(result.stdout)
                    logging.info("OpenAleaRunner: Execution result: %s", response)
                    return response
                except json.JSONDecodeError as e:
                    logging.error("Failed to decode JSON response: %s", e)
                    return {
                        "success": False,
                        "error": f"Invalid JSON response: {result.stdout[:200]}"
                    }

            # No output
            return {
                "success": False,
                "error": "No output from subprocess"
            }

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
