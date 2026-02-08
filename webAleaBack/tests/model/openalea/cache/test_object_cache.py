import os
import tempfile
from unittest import TestCase

from model.openalea.cache import object_cache


class TestObjectCache(TestCase):
    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self._old_cache_dir = os.environ.get("OPENALEA_CACHE_DIR")
        os.environ["OPENALEA_CACHE_DIR"] = self._temp_dir.name

    def tearDown(self):
        if self._old_cache_dir is None:
            os.environ.pop("OPENALEA_CACHE_DIR", None)
        else:
            os.environ["OPENALEA_CACHE_DIR"] = self._old_cache_dir
        self._temp_dir.cleanup()

    def test_cache_store_and_load(self):
        value = {"a": 1, "b": 2}
        ref_id = object_cache.cache_store(value)
        loaded = object_cache.cache_load(ref_id)
        self.assertEqual(loaded, value)

    def test_scene_json_cache_roundtrip(self):
        scene = {"objects": [{"id": "x"}]}
        ref_id = object_cache.cache_store_scene_json_new(scene)
        loaded = object_cache.cache_load_scene_json(ref_id)
        self.assertEqual(loaded, scene)

    def test_cache_cleanup_removes_old_entries(self):
        value = {"a": 1}
        ref_id = object_cache.cache_store(value)
        path = object_cache._cache_path(ref_id)
        # Set modification time far in the past
        old_time = 0
        os.utime(path, (old_time, old_time))
        removed = object_cache.cache_cleanup(ttl_seconds=1)
        self.assertGreaterEqual(removed, 1)
        self.assertFalse(path.exists())
