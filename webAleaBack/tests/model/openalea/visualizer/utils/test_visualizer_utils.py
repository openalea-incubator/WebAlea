from unittest import TestCase
from unittest import mock
import sys
import types

from model.openalea.visualizer.utils import visualizer_utils


class DummyScene:
    def add(self, _shape):
        return None


class DummyShape:
    pass


class TestVisualizerUtils(TestCase):
    def test_json_from_result_without_plantgl(self):
        result = visualizer_utils.json_from_result("value")
        self.assertIsInstance(result, dict)
        self.assertIn("error", result)

    def test_json_from_result_scene(self):
        fake_serialize_module = types.SimpleNamespace(
            serialize_scene=lambda _: {"objects": ["ok"]}
        )
        with mock.patch.object(visualizer_utils, "PLANTGL_AVAILABLE", True), \
            mock.patch.object(visualizer_utils, "Scene", DummyScene), \
            mock.patch.object(visualizer_utils, "Shape", DummyShape), \
            mock.patch.dict(sys.modules, {"model.openalea.visualizer.utils.serialize": fake_serialize_module}):
            result = visualizer_utils.json_from_result(DummyScene())
            self.assertEqual(result, {"objects": ["ok"]})

    def test_json_from_result_shape(self):
        fake_serialize_module = types.SimpleNamespace(
            serialize_scene=lambda _: {"objects": ["shape"]}
        )
        with mock.patch.object(visualizer_utils, "PLANTGL_AVAILABLE", True), \
            mock.patch.object(visualizer_utils, "Scene", DummyScene), \
            mock.patch.object(visualizer_utils, "Shape", DummyShape), \
            mock.patch.dict(sys.modules, {"model.openalea.visualizer.utils.serialize": fake_serialize_module}):
            result = visualizer_utils.json_from_result(DummyShape())
            self.assertEqual(result, {"objects": ["shape"]})
