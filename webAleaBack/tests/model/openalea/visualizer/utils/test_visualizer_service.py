from unittest import TestCase
from unittest import mock

from model.openalea.visualizer.utils import visualizer_service


class TestVisualizerService(TestCase):
    def test_resolve_inline_scene(self):
        payload = {"scene": {"objects": [{"id": 1}]}}
        response = visualizer_service.resolve_visualization("node-1", payload)
        self.assertTrue(response["success"])
        self.assertFalse(response.get("cacheHit"))
        self.assertEqual(response["scene"]["objects"][0]["id"], 1)

    def test_resolve_scene_ref_cache_hit(self):
        payload = {
            "outputs": [
                {"value": {"__type__": "plantgl_scene_json_ref", "__ref__": "abc"}}
            ]
        }
        with mock.patch("model.openalea.visualizer.utils.visualizer_service.cache_load_scene_json", return_value={"objects": [{"id": 2}]}):
            response = visualizer_service.resolve_visualization("node-2", payload)
            self.assertTrue(response["success"])
            self.assertTrue(response.get("cacheHit"))
            self.assertEqual(response["scene"]["objects"][0]["id"], 2)

    def test_resolve_scene_ref_cache_miss(self):
        payload = {
            "outputs": [
                {"value": {"__type__": "plantgl_scene_ref", "__ref__": "abc"}}
            ]
        }
        with mock.patch("model.openalea.visualizer.utils.visualizer_service.cache_load_scene_json", return_value=None), \
            mock.patch("model.openalea.visualizer.utils.visualizer_service.cache_load", return_value="raw"), \
            mock.patch("model.openalea.visualizer.utils.visualizer_service.json_from_result", return_value={"objects": [{"id": 3}]}), \
            mock.patch("model.openalea.visualizer.utils.visualizer_service.cache_store_scene_json") as cache_store:
            response = visualizer_service.resolve_visualization("node-3", payload)
            self.assertTrue(response["success"])
            self.assertFalse(response.get("cacheHit"))
            self.assertEqual(response["scene"]["objects"][0]["id"], 3)
            cache_store.assert_called_once()

    def test_resolve_raw_payload(self):
        payload = {"raw": "raw"}
        with mock.patch("model.openalea.visualizer.utils.visualizer_service.json_from_result", return_value={"objects": [{"id": 4}]}):
            response = visualizer_service.resolve_visualization("node-4", payload)
            self.assertTrue(response["success"])
            self.assertEqual(response["scene"]["objects"][0]["id"], 4)
