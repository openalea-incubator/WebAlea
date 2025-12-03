"""This module is ressponsible for running openalea workflows"""
import logging

from openalea.core.pkgmanager import PackageManager
from openalea.core.dataflow import DataFlow

class OpenAleaRunner:
    """
    this class is responsible for running openAlea workflows
    """

    @staticmethod
    def _init_workflow(workflow_type: str):
        """initializes an openalea workflow

        Args:
            workflow_type (str): the type of workflow to initialize
        """
        logging.info("Initializing workflow of type: %s", workflow_type)
        workflow = None
        match workflow_type:
            case "dataflow":
                workflow = DataFlow()
            case _: # try dataflow as default
                workflow = DataFlow()
        return workflow

    @staticmethod
    def _add_node_to_workflow(pkg_manager, workflow, node_info: dict) -> None:
        """adds a node to an openalea workflow

        Args:
            workflow : the openalea workflow
            node_info (dict): the node information
        """
        # retrieve package and node
        package_name = node_info.get("package")
        node_name = node_info.get("name")
        # get package
        pkg = pkg_manager.get(package_name)
        if not pkg:
            logging.error("Package '%s' not found.", package_name)
            raise ValueError(f"Package '{package_name}' not found.")
        # get node factory from package
        node_factory = pkg.get(node_name)
        # add node to workflow
        logging.info("Adding node '%s' from package '%s' to workflow", node_name, package_name)
        if node_factory is None: # node not found
            logging.error(
                "Node '%s' not found in package '%s'.", node_name, package_name
            )
            raise ValueError(f"Node '{node_name}' not found in package '{package_name}'.")
        workflow.add_node(node_factory)

    @staticmethod
    def _serialize_workflow_response(workflow) -> dict:
        """serializes the workflow execution result into a dict

        Args:
            workflow : the openalea workflow

        Returns:
            dict: the serialized workflow result
        """
        logging.info("Serializing workflow execution result")
        result = {}
        for node in workflow.nodes:
            node_id = node.id
            node_outputs = {}
            for output_name, output_value in node.outputs.items():
                node_outputs[output_name] = str(output_value)
            result[node_id] = {
                "outputs": node_outputs
            }
        return result

    @staticmethod
    def run(workflow_type: str, node_info: dict) -> dict:
        """runs an openalea workflow

        Args:
            workflow_type (str): the workflow type
            node_info (dict): the node information
        """
        logging.info("Running OpenAlea workflow of type: %s", workflow_type)
        # init package manager
        pkg_manager = PackageManager()
        pkg_manager.init()
        # initialize workflow
        workflow = OpenAleaRunner._init_workflow(workflow_type)
        # add node to workflow
        OpenAleaRunner._add_node_to_workflow(pkg_manager, workflow, node_info)
        # execute workflow
        logging.info("Executing workflow...")
        workflow.execute()
        logging.info("Workflow execution completed.")
        # serialize results into a api response
        result = OpenAleaRunner._serialize_workflow_response(workflow)
        return result
