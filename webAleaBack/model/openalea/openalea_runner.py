"""This module is ressponsible for running openalea workflows"""
import subprocess
import json
import logging

class OpenAleaRunner:
    """
    this class is responsible for running openAlea workflows
    """
    run_workflow_script = "model/openalea/runnable/run_workflow.py"

    @staticmethod
    def run(workflow_type: str, nodes_info: list[dict]) -> dict:
        """runs an openalea workflow

        Args:
            workflow_type (str): the type of workflow to run
            nodes_info (list[dict]): the list of nodes information

        Returns:
            dict: the serialized workflow result
        """
        logging.info("Running openalea workflow of type '%s'", workflow_type)
        # prepare command to run the external script
        command = ["python3", OpenAleaRunner.run_workflow_script, workflow_type]
        # add nodes info as json string argument
        nodes_info_json = json.dumps(nodes_info)
        command.append(nodes_info_json)
        # run the subprocess to execute the workflow
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            text=True,
            check=True,
        )
        logging.info("Workflow subprocess completed.")
        # parse output as JSON
        try:
            workflow_result = json.loads(result.stdout)
        except json.JSONDecodeError:
            logging.error("Failed to parse workflow result output: %s", result.stdout)
            workflow_result = {}
        return workflow_result
