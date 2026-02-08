# 3D Visualization Pipeline (Workflow -> Scene -> Render)

This document is the single source of truth for the WebAlea 3D rendering system (backend + frontend):
- OpenAlea node execution that produces PlantGL scenes,
- serialization and caching on the backend,
- visualization API contracts,
- Three.js reconstruction and rendering on the frontend.

---

## 1) Architecture overview

### 1.1 High-level pipeline
1. A node is executed via `POST /api/v1/runner/execute`.
2. The runner subprocess (`run_workflow.py`) serializes outputs.
3. If the output is PlantGL (`Scene`, `Shape`, `Geometry`), the runner returns a cache reference rather than full JSON.
4. The frontend stores outputs in `node.data.outputs`.
5. On "Launch Render", the frontend calls `POST /api/v1/visualizer/visualize` with `scene_ref` and/or `outputs`.
6. The backend visualizer:
   - tries the scene JSON cache first,
   - otherwise loads the cached object, serializes it, and persists the scene JSON.
7. The frontend receives `{ scene: { objects: [...] } }` and builds the Three.js scene.

### 1.2 Key files

Backend:
- `webAleaBack/api/v1/endpoints/runner.py`
- `webAleaBack/model/openalea/runner/openalea_runner.py`
- `webAleaBack/model/openalea/runner/runnable/run_workflow.py`
- `webAleaBack/model/openalea/cache/object_cache.py`
- `webAleaBack/api/v1/endpoints/visualizer.py`
- `webAleaBack/model/openalea/visualizer/utils/serialize.py`
- `webAleaBack/model/openalea/visualizer/utils/visualizer_utils.py`
- `webAleaBack/model/openalea/visualizer/utils/plantgl.py`

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

## 2) Workflow execution (Frontend)

**Entry point**
- `FlowContext.executeWorkflow()` builds the workflow model and starts the engine.
- It calls `buildGraphModel()` to produce a clean graph for execution (custom nodes only).

**What happens**
1. `buildGraphModel()` clones inputs/outputs and filters edges to custom nodes.
2. `WorkflowEngine.start()` validates the graph, initializes state, and schedules ready nodes.
3. Each node executes either locally (primitive) or via backend if it has `packageName` + `nodeName`.

---

## 3) OpenAlea node execution (Backend)

**Frontend API call**
- `executeNode()` in `webAleaFront/src/api/runnerAPI.js` posts to the runner API.

**Backend endpoint**
- `POST /api/v1/runner/execute`

**Execution flow**
1. The endpoint converts input list -> dict `{input_name: value}`.
2. It calls `OpenAleaRunner.execute_node(...)` which runs `run_workflow.py` in a subprocess.
3. `run_workflow.execute_node()` instantiates the node and runs `node.eval()`.
4. Each output is serialized with `serialize_value()`.

---

## 4) Serialization of 3D data (Backend)

**Where it happens**
- `serialize_value()` in `webAleaBack/model/openalea/runner/runnable/run_workflow.py`

**Logic**
- If the output is PlantGL (`Scene`, `Shape`, `Geometry`), it is converted to a JSON scene with a marker:
  ```json
  {"__type__": "plantgl_scene", "scene": { "objects": [...] }}
  ```
- Otherwise, it is serialized as primitive types / lists / dicts.

**PlantGL JSON building**
- `serialize_scene()` in `webAleaBack/model/openalea/visualizer/utils/serialize.py` iterates shapes, converts geometry to meshes/lines via `mesh_from_geometry()`, and extracts material color and opacity.

**Geometry conversion**
- `mesh_from_geometry()` in `webAleaBack/model/openalea/visualizer/utils/plantgl.py` maps curves to `line` with vertices, and surfaces/solids to `mesh` with vertices + indices.

---

## 5) Backend cache strategy (important)

**Why it exists**
- PlantGL scenes can be very large (many vertices/indices). Serializing them inline for every execution is expensive in RAM and HTTP payload size.
- The backend therefore prefers a cache-first, ref-based flow to keep runner responses small and enable fast re-rendering.

**Two complementary caches**
- **Object cache** (pickle). Stores the raw PlantGL object serialized as `<ref>.pkl`.
- **Scene JSON cache**. Stores the already-serialized scene JSON as `<ref>.scene.json`.

**Serialization strategy**
1. Try `serialize_scene(...)` and immediately write scene JSON to cache (preferred).
2. If JSON fails, fallback to object cache (`.pkl`).
3. As a final fallback, inline JSON is returned (worst-case).

**Runner output types for a scene**
- `plantgl_scene_json_ref` (preferred; points to `.scene.json`)
- `plantgl_scene_ref` (fallback; points to `.pkl`)
- `plantgl_scene` (inline JSON; last resort)

**Visualizer cache resolution order**
1. If payload already contains a scene (`scene` / `objects`), return it.
2. Else, if a `scene_ref` exists, try `cache_load_scene_json(ref)` (fast path).
3. If miss, load object cache, serialize, then persist `.scene.json`.

**Cache configuration**
- Default cache dir is `/tmp/webalea_object_cache` (override via `OPENALEA_CACHE_DIR`).
- TTL cleanup via `OPENALEA_CACHE_TTL_SECONDS`.

---

## 6) Results stored in the UI (Frontend)

**Event handler**
- When a node finishes, `WorkflowEngine` emits `node-result`.
- `handleNodeResult()` updates `node.data.outputs` in the UI state.

**Key files**
- `webAleaFront/src/features/workspace/handlers/workflowEventHandlers.js`

---

## 7) User triggers 3D rendering (Frontend)

**UI action**
- In the sidebar, `NodeResultRender` lets the user click "Launch Render".

**Data sent**
- The frontend sends `node.data.outputs` to the visualizer API.

**Key files**
- `webAleaFront/src/features/nodes/ui/sidebar_detail/NodeResultRender.jsx`
- `webAleaFront/src/api/visualizerAPI.js`

---

## 8) Frontend visualizer flow

**Orchestration**
- `NodeResultRender` is UI-only and delegates logic to `useVisualizerScene`.
- The hook:
  - extracts scene refs and builds payloads,
  - calls the backend visualizer,
  - parses the response,
  - manages cache and modal state.

**Core files**
- `webAleaFront/src/features/visualizer/hooks/useVisualizerScene.js`
- `webAleaFront/src/features/visualizer/services/visualizerService.js`
- `webAleaFront/src/api/visualizerAPI.js`

**Key helpers (service layer)**
- `extractSceneRef(outputs)`
- `buildVisualizationData(outputs)`
- `buildOutputSummary(outputs)`
- `parseSceneData(sceneData)`

**Local cache behavior**
- The hook caches the parsed scene JSON per node so a second render is instant.
- If the selected node changes, the cache is cleared.

**Debug logging**
- All visualizer logs are gated via `debugLog`.
- Enable with `VITE_VISUALIZER_DEBUG=true`.

---

## 9) Visualizer API extracts a scene (Backend)

**Endpoint**
- `POST /api/v1/visualizer/visualize`

**Extraction logic**
The backend tries, in order:
1. `visualization_data.scene` (already serialized)
2. `visualization_data.objects` (raw scene object list)
3. `visualization_data.outputs[*].value` if it contains a `__type__ = plantgl_scene` marker
4. `visualization_data.raw` (if a raw PlantGL object was passed)

It returns:
```json
{ "success": true, "scene": { "objects": [...] } }
```

**Cache-related fields**
- The visualizer response can include `cacheHit` to indicate whether the JSON cache was used.
- If the expected `shape_count` (from `__meta__`) does not match the produced `object_count`, the backend logs a mismatch and can return a `warning`.

---

## 10) Scene is rendered in Three.js (Frontend)

**Modal lifecycle**
- `VisualizerModal` mounts and calls `buildSceneFromJSON(sceneJSON, mountRef)`.

**Scene construction (core modules)**
- `core/sceneSetup.js` (scene, camera, renderer, controls)
- `core/objectPipeline.js` (object grouping + mesh merging)
- `core/lighting.js` (default lights)
- `core/framing.js` (fit camera to bounds)
- `core/resize.js` (resize handler)
- `core/animation.js` (render loop)
- `core/dispose.js` (cleanup)

**Rendering specifics**
- **TypedArray conversion**: shared in `utils/geometry.js` to avoid repeated allocations.
- **Mesh merging**: static meshes are grouped by material to reduce draw calls.
- **Transform handling**: centralized in `utils/transforms.js` and applied consistently.
- **Bounding box framing**: camera framing is computed from scene bounds for consistent initial view.
- **Animation loop**: only enabled if animated objects exist, otherwise a single render is performed.

**Object types supported**
- `mesh` -> `THREE.Mesh`
- `line` -> `THREE.Line`
- `text` -> sprite-based text (via factory + cached textures)
- `group` -> `THREE.Group` (recursive children)

**Factories**
- `SceneFactory` uses a registry of factories (no switch/case).
- Factories live in:
  - `webAleaFront/src/features/visualizer/factories/meshFactory.jsx`
  - `webAleaFront/src/features/visualizer/factories/lineFactory.jsx`
  - `webAleaFront/src/features/visualizer/factories/textFactory.jsx`

---

## 11) JSON contracts (expected formats)

### 11.1 Runner execute request (frontend -> backend)
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

### 11.2 Runner execute response (backend -> frontend)
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

### 11.3 Visualizer request (frontend -> backend)
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

### 11.4 Visualizer response (backend -> frontend)
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

## 12) Scene object schema (frontend expectation)

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

## 13) Performance model and design choices

### 13.1 Why ref-based cache
Without cache, serializing huge scenes (vertices/indices) on each run:
- increases backend latency,
- increases backend RAM,
- inflates HTTP payload size.

Current design:
- runner returns a lightweight ref,
- visualizer builds/serves scene JSON on demand,
- scene JSON cache is reusable for re-render.

### 13.2 Frontend optimizations
- convert to `Float32Array` / `Uint32Array` without intermediate flatten,
- merge static meshes by material,
- animation loop enabled only when needed.

---

## 14) Logging and observability

Important backend logs:
- runner: `OpenAleaRunner: Execution result ... sceneRef ... sceneShapeCount ...`
- visualizer: `Visualizer request ...`, `Visualizer extracted scene_ref ...`, `Visualizer scene JSON cache hit ...`, `Visualizer scene generated from ref ...`, `Visualizer mismatch ... expected_shape_count ... object_count ...`

Frontend logs:
- `NodeResultRender`: payload summary (`sceneRef`, outputSummary), scene ready (`cacheHit`, `warning`, `objects`)
- `visualizerAPI`: POST summary (keys, outputCount, hasSceneRef)

---

## 15) Troubleshooting

### 15.1 "Scene contains no objects."
Check:
1. `sceneShapeCount` in runner logs > 0?
2. `visualizer` reports expected vs object_count mismatch?
3. PlantGL serialization (`serialize_scene`) returns objects?

If `shape_count > 0` but `object_count = 0`:
- suspect geometry conversion (`mesh_from_geometry`) or unsupported geometries.

### 15.2 Empty modal on frontend
Check:
- `sceneData.success === true`
- `scene.objects` exists and is not empty
- recognized `objectType` values (`mesh`, `line`, `text`, `group`)

### 15.3 Cache errors
- verify `OPENALEA_CACHE_DIR` is writable,
- verify presence of `.pkl` / `.scene.json` files,
- verify TTL cleanup is not too aggressive.

### 15.4 Backend unavailable (ERR_EMPTY_RESPONSE)
Check backend container health and Python dependencies (e.g., `anyio` / FastAPI / Starlette env).

---

## 16) Extension points

- Add new `objectType`:
  - backend: extend `serialize_scene` / `mesh_from_geometry`,
  - frontend: add a factory in `SceneFactory`.
- Add advanced materials support (textures, PBR).
- Add a scene streaming endpoint (chunking) for very large scenes.

---

## 17) End-to-end summary (short)

1. Workflow executes -> outputs produced by OpenAlea.
2. PlantGL outputs are serialized to JSON scenes (cache-first).
3. Node outputs stored in UI state.
4. User requests render -> outputs sent to visualizer.
5. Backend extracts scene JSON and uses cache if possible.
6. Frontend builds a Three.js scene and renders it.
