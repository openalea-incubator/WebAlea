from unittest import TestCase

from model.openalea.visualizer.utils.payload_extractors import parse_visualization_payload


class TestPayloadExtractors(TestCase):
    def test_inline_scene(self):
        payload = {"scene": {"objects": [{"id": 1}]}}
        scene, ref = parse_visualization_payload(payload)
        self.assertIsNotNone(scene)
        self.assertEqual(scene.get("objects")[0]["id"], 1)
        self.assertIsNone(ref)

    def test_inline_objects(self):
        payload = {"objects": [{"id": 2}]}
        scene, ref = parse_visualization_payload(payload)
        self.assertIsNotNone(scene)
        self.assertEqual(scene.get("objects")[0]["id"], 2)
        self.assertIsNone(ref)

    def test_outputs_scene(self):
        payload = {
            "outputs": [
                {"value": {"__type__": "plantgl_scene", "scene": {"objects": [{"id": 3}]}}}
            ]
        }
        scene, ref = parse_visualization_payload(payload)
        self.assertIsNotNone(scene)
        self.assertEqual(scene.get("objects")[0]["id"], 3)
        self.assertIsNone(ref)

    def test_outputs_ref(self):
        payload = {
            "outputs": [
                {"value": {"__type__": "plantgl_scene_ref", "__ref__": "abc", "__meta__": {"shape_count": 2}}}
            ]
        }
        scene, ref = parse_visualization_payload(payload)
        self.assertIsNone(scene)
        self.assertIsNotNone(ref)
        self.assertEqual(ref.get("ref"), "abc")
        self.assertEqual(ref.get("expectedShapeCount"), 2)

    def test_scene_ref_override(self):
        payload = {
            "scene_ref": "xyz",
            "scene_ref_expected_shape_count": 5,
            "outputs": [
                {"value": {"__type__": "plantgl_scene_ref", "__ref__": "abc", "__meta__": {"shape_count": 2}}}
            ]
        }
        scene, ref = parse_visualization_payload(payload)
        self.assertIsNone(scene)
        self.assertEqual(ref.get("ref"), "xyz")
        self.assertEqual(ref.get("expectedShapeCount"), 5)
