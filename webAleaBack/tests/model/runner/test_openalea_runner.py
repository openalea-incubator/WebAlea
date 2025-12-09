"""This module in responsible for testing the OpenAleaRunner class"""
import logging
import unittest

from model.openalea.openalea_runner import OpenAleaRunner
from openalea.core.dataflow import DataFlow

class TestOpenAleaRunner(unittest.TestCase):
    """Tests the OpenAleaRunner class"""

    def test_init_workflow_dataflow(self):
        """Tests the _init_workflow method for dataflow"""
        # known workflow type
        workflow = OpenAleaRunner._init_workflow("dataflow")
        self.assertIsInstance(workflow, DataFlow)
        # unknown workflow type
        workflow = OpenAleaRunner._init_workflow("unknown_type")
        self.assertIsInstance(workflow, DataFlow)

    def test_run(self):
        """Tests the run method"""
        node_info = {
            "package": "openalea.core",
            "name": "Constant",
            "params": {"value": 42}
        }
        result = OpenAleaRunner.run("dataflow", node_info)
        logging.info("Workflow run result: %s", result)
