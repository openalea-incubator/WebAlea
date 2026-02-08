# Runner (OpenAlea) - Role and Data Formats

## Module role
This module executes OpenAlea nodes in a subprocess, resolves cached values (`__ref__`), and serializes outputs to JSON for the frontend.

## Key files
- `openalea_runner.py`: launches the subprocess and parses the response.
- `runnable/run_workflow.py`: executes a node, applies inputs, serializes outputs.
- `utils/workflow_helpers.py`: helpers for PackageManager, inputs/outputs, names.
- `utils/input_resolver.py`: resolves `__ref__` values and recurses structures.
- `utils/serialization.py`: serialization logic (PlantGL + standard types).

## Input format (backend internal)
The subprocess `run_workflow.py` expects:
```json
{
  "package_name": "openalea.math",
  "node_name": "addition",
  "inputs": { "a": 2, "b": 3 }
}
```

The runner endpoint converts a list of inputs into a dict `{name: value}` before calling the subprocess.

## Input resolution (cache)
If an input is a dict with `__ref__`:
- `__type__ = plantgl_scene_json_ref` loads the scene JSON cache.
- otherwise loads the pickled object cache.

Lists/tuples/dicts are resolved recursively.

## Output format (to frontend)
Each output is:
```json
{
  "index": 0,
  "name": "result",
  "type": "int",
  "value": 5
}
```

### PlantGL (scene) outputs
`value` becomes a ref payload:
```json
{
  "__type__": "plantgl_scene_json_ref",
  "__ref__": "6d51c8994f9f4b4cbca9531f014367ee",
  "__meta__": { "shape_count": 6, "object_count": 6 }
}
```
Fallbacks:
- `plantgl_scene_ref` (pickle)
- `plantgl_scene` (inline JSON scene)

### Unknown objects
If a type cannot be serialized, it is cached and returned as a reference:
```json
{
  "__type__": "package.Class",
  "__ref__": "uuid",
  "summary": "repr(obj)"
}
```

## Backend cache
Heavy objects are stored via `object_cache.py`:
- object cache: `<ref>.pkl`
- scene JSON cache: `<ref>.scene.json`

Useful environment variables:
- `OPENALEA_CACHE_DIR`
- `OPENALEA_CACHE_TTL_SECONDS`
