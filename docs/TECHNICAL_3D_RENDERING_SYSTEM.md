# Technical Documentation - 3D Rendering System (Backend + Frontend)

## 1. Scope
This document explains the WebAlea 3D rendering module end to end:
- executing an OpenAlea node that produces a PlantGL scene,
- serialization and server cache,
- visualization API,
- Three.js reconstruction on the frontend.

It is intended for developers taking over the project.

---

## 2. Architecture overview

### 2.1 High-level pipeline
1. A node is executed via `POST /api/v1/runner/execute`.
2. The runner subprocess (`run_workflow.py`) serializes outputs.
3. If the output is PlantGL (`Scene`, `Shape`, `Geometry`), it returns a cache reference (`__ref__`) rather than full JSON.
4. The frontend stores this output in the node (`node.data.outputs`).
5. On "Launch Render", the frontend calls `POST /api/v1/visualizer/visualize` with `scene_ref` and/or `outputs`.
6. The backend visualizer:
   - tries the scene JSON cache first,
   - otherwise loads the cached object, serializes it, and persists the scene JSON.
7. The frontend receives `{ scene: { objects: [...] } }` and builds the Three.js scene.

### 2.2 Key files

Backend:
- `webAleaBack/api/v1/endpoints/runner.py`
- `webAleaBack/model/openalea/runner/openalea_runner.py`
- `webAleaBack/model/openalea/runner/runnable/run_workflow.py`
- `webAleaBack/model/openalea/cache/object_cache.py`
- `webAleaBack/api/v1/endpoints/visualizer.py`
- `webAleaBack/model/openalea/visualizer/utils/serialize.py`
- `webAleaBack/model/openalea/visualizer/utils/visualizer_utils.py`

Frontend:
- `webAleaFront/src/api/runnerAPI.js`
- `webAleaFront/src/api/visualizerAPI.js`
- `webAleaFront/src/features/workspace/engine/WorkflowEngine.jsx`
- `webAleaFront/src/features/workspace/providers/FlowContext.jsx`
- `webAleaFront/src/features/nodes/ui/sidebar_detail/NodeResultRender.jsx`
- `webAleaFront/src/features/visualizer/VisualizerModal.jsx`
- `webAleaFront/src/features/visualizer/SceneBuilder.jsx`
- `webAleaFront/src/features/visualizer/SceneFactory.jsx`
- `webAleaFront/src/features/visualizer/factories/meshFactory.jsx`

---

## 3. Backend flow in detail

### 3.1 Node execution API
Endpoint: `POST /api/v1/runner/execute`

The backend converts the input list into a dict `{input_name: value}` and calls `OpenAleaRunner.execute_node(...)`.

### 3.2 Subprocess execution
`openalea_runner.py` launches:
- `python3 model/openalea/runner/runnable/run_workflow.py '<node_info_json>'`

`run_workflow.py`:
- instantiates the OpenAlea node,
- injects inputs (with cache ref resolution if `__ref__`),
- executes `node.eval()`,
- serializes each output.

### 3.3 PlantGL output serialization
In `serialize_value(...)`:
- `Scene` / `Shape` / `Geometry` -> `_serialize_plantgl_scene(...)`
- strategy:
  1. try immediate JSON serialization (`serialize_scene`) + `cache_store_scene_json_new`
  2. fallback to object cache pickle (`cache_store`) on failure
  3. final fallback: inline scene JSON

Types emitted by the runner for a scene:
- `plantgl_scene_json_ref` (preferred)
- `plantgl_scene_ref` (pickle fallback)
- `plantgl_scene` (inline fallback)

### 3.4 Server cache
`object_cache.py`:
- object cache: `<cache_dir>/<ref>.pkl`
- scene JSON cache: `<cache_dir>/<ref>.scene.json`
- default directory: `/tmp/webalea_object_cache`
- TTL cleanup via `cache_cleanup()` (default 3600s)

Useful variables:
- `OPENALEA_CACHE_DIR`
- `OPENALEA_CACHE_TTL_SECONDS`

### 3.5 Visualizer endpoint
Endpoint: `POST /api/v1/visualizer/visualize`

Resolution order in `visualizer.py`:
1. inline scene already in payload (`scene`/`objects`/output type `plantgl_scene`),
2. extract `scene_ref` (or from outputs),
3. try `cache_load_scene_json(ref)` (fast hit),
4. otherwise `cache_load(ref)` + `json_from_result(...)` + `cache_store_scene_json(ref, scene)`,
5. standard response `{ nodeId, success, scene, cacheHit }`.

If `scene.objects.length === 0`, the backend adds `warning: "Scene contains no objects."`.

---

## 4. Frontend flow in detail

### 4.1 Workflow execution and outputs storage
`WorkflowEngine` executes nodes via `runnerAPI`.
Outputs are then injected into the node state via `FlowContext.updateNodeOutputs(...)`.

### 4.2 Render request
`NodeResultRender.jsx`:
- gets the current node,
- reads `node.data.outputs`,
- finds an output with:
  - `value.__type__` in `{plantgl_scene_ref, plantgl_scene_json_ref}`
  - `value.__ref__`
- calls `fetchNodeScene(...)` with:
  - `scene_ref`
  - `scene_ref_expected_shape_count` (if metadata available)
  - `outputs`

### 4.3 Modal display and scene build
`VisualizerModal`:
- opens the modal,
- calls `buildSceneFromJSON(sceneJSON, mountRef)`,
- handles cleanup via `dispose()`.

`SceneBuilder`:
- sets up Three.js scene/camera/renderer,
- creates objects via `buildObjectNode(...)`,
- merges static meshes by material (reduce draw calls),
- auto-frames the camera via bounding box,
- runs animation loop only if objects are animated.

---

## 5. JSON contracts (expected formats)

## 5.1 Runner execute request (frontend -> backend)
```json
{
  "node_id": "n123-openalea.math::addition",
  "package_name": "openalea.math",
  "node_name": "addition",
  "inputs": [
    { "id": "port_0", "name": "a", "type": "float", "value": 2 },
    { "id": "port_1", "name": "b", "type": "float", "value": 3 }
  ]
}
```

## 5.2 Runner execute response (backend -> frontend)
Example scene via JSON cache reference:
```json
{
  "success": true,
  "node_id": "n3205-weberpenn::weber and penn",
  "outputs": [
    {
      "index": 0,
      "name": "out",
      "type": "Scene",
      "value": {
        "__type__": "plantgl_scene_json_ref",
        "__ref__": "6d51c8994f9f4b4cbca9531f014367ee",
        "__meta__": {
          "shape_count": 6,
          "object_count": 6
        }
      }
    }
  ],
  "error": null
}
```

## 5.3 Visualizer request (frontend -> backend)
```json
{
  "node_id": "n3205-weberpenn::weber and penn",
  "visualization_data": {
    "scene_ref": "6d51c8994f9f4b4cbca9531f014367ee",
    "scene_ref_expected_shape_count": 6,
    "outputs": [
      {
        "index": 0,
        "name": "out",
        "type": "Scene",
        "value": {
          "__type__": "plantgl_scene_json_ref",
          "__ref__": "6d51c8994f9f4b4cbca9531f014367ee",
          "__meta__": {
            "shape_count": 6,
            "object_count": 6
          }
        }
      }
    ]
  }
}
```

## 5.4 Visualizer response (backend -> frontend)
```json
{
  "nodeId": "n3205-weberpenn::weber and penn",
  "success": true,
  "cacheHit": true,
  "scene": {
    "objects": [
      {
        "id": "f3c4e6c6-1f6a-4f44-8c4d-b0fdbf07b1c1",
        "objectType": "mesh",
        "geometry": {
          "type": "mesh",
          "vertices": [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
          "indices": [[0, 1, 2]]
        },
        "material": {
          "color": [0.7, 0.5, 0.3],
          "opacity": 1.0
        },
        "transform": {
          "position": [0, 0, 0],
          "rotation": [0, 0, 0],
          "scale": [1, 1, 1]
        }
      }
    ]
  }
}
```

---

## 6. Scene object schema (frontend expectation)

`scene`:
- `objects: Array<ObjectNode>`

`ObjectNode`:
- `id: string`
- `objectType: "mesh" | "line" | "text" | "group"`
- `geometry` (for `mesh`)
- `material` (optional)
- `transform` (optional)
- `children` (optional, tree)
- `animation` (optional)

`geometry` for mesh:
- `type: "mesh"`
- `vertices: number[][]` (triplets xyz)
- `indices?: number[][]` (triplets indices triangle)

---

## 7. Performance model and design choices

## 7.1 Why ref-based cache
Without cache, serializing huge scenes (vertices/indices) on each run:
- increases backend latency,
- increases backend RAM,
- inflates HTTP payload size.

Current design:
- runner returns a lightweight ref,
- visualizer builds/serves scene JSON on demand,
- scene JSON cache is reusable for re-render.

## 7.2 Frontend optimizations
- convert to `Float32Array` / `Uint32Array` without intermediate flatten,
- merge static meshes by material,
- animation loop enabled only when needed.

---

## 8. Logging and observability

Important backend logs:
- runner:
  - `OpenAleaRunner: Execution result ... sceneRef ... sceneShapeCount ...`
- visualizer:
  - `Visualizer request ...`
  - `Visualizer extracted scene_ref ...`
  - `Visualizer scene JSON cache hit ...`
  - `Visualizer scene generated from ref ...`
  - `Visualizer mismatch ... expected_shape_count ... object_count ...`

Frontend logs:
- `NodeResultRender`:
  - payload summary (`sceneRef`, outputSummary)
  - scene ready (`cacheHit`, `warning`, `objects`)
- `visualizerAPI`:
  - POST summary (keys, outputCount, hasSceneRef)

---

## 9. Troubleshooting guide

## 9.1 Case: "Scene contains no objects."
Check:
1. `sceneShapeCount` in runner logs > 0?
2. `visualizer` reports expected vs object_count mismatch?
3. PlantGL serialization (`serialize_scene`) returns objects?

If `shape_count > 0` but `object_count = 0`:
- suspect geometry conversion (`mesh_from_geometry`) or unsupported geometries.

## 9.2 Case: empty modal on frontend
Check:
- `sceneData.success === true`
- `scene.objects` exists and is not empty
- recognized `objectType` values (`mesh`, `line`, `text`, `group`)

## 9.3 Case: cache errors
- verify `OPENALEA_CACHE_DIR` is writable,
- verify presence of `.pkl` / `.scene.json` files,
- verify TTL cleanup is not too aggressive.

## 9.4 Case: backend unavailable (ERR_EMPTY_RESPONSE)
Check backend container health and Python dependencies (e.g., `anyio` / FastAPI / Starlette env).

---

## 10. Extension points

- Add new `objectType`:
  - backend: extend `serialize_scene` / `mesh_from_geometry`,
  - frontend: add a factory in `SceneFactory`.
- Add advanced materials support (textures, PBR).
- Add a scene streaming endpoint (chunking) for very large scenes.

---

## 11. Suggested validation checklist (dev)

1. Execute a simple node (`openalea.math.addition`) -> scalar output OK.
2. Execute a PlantGL scene node -> output `plantgl_scene_json_ref` or `plantgl_scene_ref`.
3. Call visualizer with `scene_ref` -> `success=true`, coherent `scene.objects`.
4. Reopen render on same node -> check `cacheHit=true` possible.
5. Switch nodes -> check frontend cache reset (`NodeResultRender`).
