# Visualizer - Role and Data Formats

## Module role
This module transforms OpenAlea (PlantGL) results into Three.js-compatible scene JSON, using a server cache to keep payloads small.

## Key files
- `utils/visualizer_service.py`: scene resolution (inline/ref/raw) + standard response.
- `utils/payload_extractors.py`: extract `scene` / `scene_ref` / `outputs`.
- `utils/visualizer_utils.py`: PlantGL -> JSON conversion.
- `utils/serialize.py`: scene/shape serialization.
- `utils/plantgl.py`: geometry -> mesh/line conversion.

## Expected input formats (backend request)
The frontend sends `visualization_data` depending on the situation:

### 1) Inline scene already serialized
```json
{
  "scene": { "objects": [ ... ] }
}
```
or
```json
{
  "objects": [ ... ]
}
```

### 2) Scene reference (cache)
```json
{
  "scene_ref": "6d51c8994f9f4b4cbca9531f014367ee",
  "scene_ref_expected_shape_count": 6,
  "outputs": [
    {
      "value": {
        "__type__": "plantgl_scene_json_ref",
        "__ref__": "6d51c8994f9f4b4cbca9531f014367ee",
        "__meta__": { "shape_count": 6, "object_count": 6 }
      }
    }
  ]
}
```

### 3) Scene embedded in outputs (fallback)
```json
{
  "outputs": [
    {
      "value": { "__type__": "plantgl_scene", "scene": { "objects": [ ... ] } }
    }
  ]
}
```

### 4) Raw PlantGL object
```json
{ "raw": "<PlantGL object>" }
```

## Response format (to frontend)
```json
{
  "nodeId": "n123",
  "success": true,
  "cacheHit": true,
  "scene": { "objects": [ ... ] },
  "warning": "Scene contains no objects."
}
```

## Scene JSON schema (Three.js)
Each item in `scene.objects`:
```json
{
  "id": "uuid",
  "objectType": "mesh | line | text | group",
  "geometry": {
    "type": "mesh",
    "vertices": [[x,y,z], ...],
    "indices": [[i,j,k], ...]
  },
  "material": { "color": [r,g,b], "opacity": 1.0 },
  "transform": { "position": [0,0,0], "rotation": [0,0,0], "scale": [1,1,1] }
}
```

## Backend cache
The visualizer tries the JSON cache first:
- `<ref>.scene.json` (fast)
If missing, it loads the object cache, serializes it, and persists the scene JSON.

Useful environment variables:
- `OPENALEA_CACHE_DIR`
- `OPENALEA_CACHE_TTL_SECONDS`
