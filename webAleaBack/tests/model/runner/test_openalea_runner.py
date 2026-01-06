"""This module in responsible for testing the OpenAleaRunner class"""
import logging
import unittest

from model.openalea.openalea_runner import OpenAleaRunner

class TestOpenAleaRunner(unittest.TestCase):
    """Tests the OpenAleaRunner class"""

    def test_run(self):
        """Tests the run method"""
        node_info = {
            "package": "openalea.core",
            "name": "Constant",
            "params": {"value": 42}
        }
        result = OpenAleaRunner.run("dataflow", node_info)
        logging.info("Workflow run result: %s", result)
