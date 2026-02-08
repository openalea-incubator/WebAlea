from unittest import TestCase
from unittest import mock

from model.openalea.runner.utils import openalea_runner_helpers as helpers


class TestOpenAleaRunnerHelpers(TestCase):
    def test_build_node_info(self):
        data = helpers.build_node_info("openalea.math", "addition", {"a": 1, "b": 2})
        self.assertEqual(data["package_name"], "openalea.math")
        self.assertEqual(data["node_name"], "addition")
        self.assertEqual(data["inputs"], {"a": 1, "b": 2})

    def test_summarize_outputs(self):
        outputs = [
            {"index": 0, "name": "out", "type": "Scene", "value": {"__type__": "plantgl_scene_ref", "__ref__": "abc", "__meta__": {"shape_count": 3}}},
            {"index": 1, "name": "x", "type": "int", "value": 5},
        ]
        summary = helpers.summarize_outputs(outputs)
        self.assertEqual(summary[0]["sceneRef"], "abc")
        self.assertEqual(summary[0]["sceneShapeCount"], 3)
        self.assertIsNone(summary[1]["sceneRef"])

    def test_parse_subprocess_response_invalid_json(self):
        response = helpers.parse_subprocess_response("not-json")
        self.assertFalse(response["success"])
        self.assertIn("Invalid JSON response", response["error"])

    def test_parse_subprocess_response_valid_json(self):
        stdout = '{"success": true, "outputs": [{"index": 0, "name": "out", "type": "int", "value": 1}], "error": null}'
        with mock.patch("model.openalea.runner.utils.openalea_runner_helpers.logging") as mock_logging:
            response = helpers.parse_subprocess_response(stdout)
            self.assertTrue(response["success"])
            mock_logging.info.assert_called()

    def test_parse_subprocess_response_empty(self):
        response = helpers.parse_subprocess_response("")
        self.assertIsNone(response)
