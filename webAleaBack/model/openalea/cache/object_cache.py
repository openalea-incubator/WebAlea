import json
import logging
import os
import pickle
import uuid
from pathlib import Path


DEFAULT_CACHE_DIR = "/tmp/webalea_object_cache" # Path where cached objects are stored. Can be overridden by setting the OPENALEA_CACHE_DIR environment variable.
DEFAULT_TTL_SECONDS = 3600 # Time-to-live for cached objects in seconds. 


def get_cache_dir() -> Path:
    cache_dir = os.getenv("OPENALEA_CACHE_DIR", DEFAULT_CACHE_DIR)
    path = Path(cache_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_cache_ttl_seconds() -> int:
    raw = os.getenv("OPENALEA_CACHE_TTL_SECONDS")
    if raw is None:
        return DEFAULT_TTL_SECONDS
    try:
        return max(0, int(raw))
    except ValueError:
        return DEFAULT_TTL_SECONDS


def _cache_path(ref_id: str) -> Path:
    safe_id = ref_id.replace("/", "_")
    return get_cache_dir() / f"{safe_id}.pkl"


def _scene_json_path(ref_id: str) -> Path:
    safe_id = ref_id.replace("/", "_")
    return get_cache_dir() / f"{safe_id}.scene.json"


def cache_store(value) -> str:
    ref_id = uuid.uuid4().hex
    path = _cache_path(ref_id)
    with open(path, "wb") as f:
        pickle.dump(value, f)
    logging.info("Cache store object ref=%s path=%s", ref_id, path)
    return ref_id


def cache_load(ref_id: str):
    path = _cache_path(ref_id)
    if not path.exists():
        raise FileNotFoundError(f"Cached object not found: {ref_id}")
    with open(path, "rb") as f:
        value = pickle.load(f)
    logging.info("Cache load object ref=%s path=%s", ref_id, path)
    return value


def cache_store_scene_json(ref_id: str, scene_json: dict) -> None:
    path = _scene_json_path(ref_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(scene_json, f)
    object_count = len(scene_json.get("objects", [])) if isinstance(scene_json, dict) else -1
    logging.info("Cache store scene json ref=%s objects=%s path=%s", ref_id, object_count, path)


def cache_store_scene_json_new(scene_json: dict) -> str:
    ref_id = uuid.uuid4().hex
    cache_store_scene_json(ref_id, scene_json)
    return ref_id


def cache_load_scene_json(ref_id: str) -> dict | None:
    path = _scene_json_path(ref_id)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        scene_json = json.load(f)
    object_count = len(scene_json.get("objects", [])) if isinstance(scene_json, dict) else -1
    logging.info("Cache load scene json ref=%s objects=%s path=%s", ref_id, object_count, path)
    return scene_json


def cache_cleanup(ttl_seconds: int | None = None) -> int:
    ttl = get_cache_ttl_seconds() if ttl_seconds is None else ttl_seconds
    if ttl <= 0:
        return 0

    cache_dir = get_cache_dir()
    removed = 0
    from time import time
    now = time()

    for path in list(cache_dir.glob("*.pkl")) + list(cache_dir.glob("*.scene.json")):
        try:
            mtime = path.stat().st_mtime
        except OSError:
            continue

        if (now - mtime) > ttl:
            try:
                path.unlink()
                removed += 1
            except OSError:
                continue

    if removed > 0:
        logging.info("Cache cleanup removed=%d ttl=%d", removed, ttl)
    return removed
