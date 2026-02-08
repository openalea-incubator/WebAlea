# 3D Visualization Pipeline (Workflow -> Scene -> Render)

This document provides the full technical overview of the 3D visualization system: from workflow execution, to backend serialization and caching, to frontend rendering in Three.js.

## 1) Workflow execution starts (Frontend)

**Entry point**
- `FlowContext.executeWorkflow()` in `webAleaFront/src/features/workspace/providers/FlowContext.jsx` builds the workflow model and starts the engine.
- It calls `buildGraphModel()` to produce a clean graph for execution (custom nodes only).

**Key files**
- `webAleaFront/src/features/workspace/providers/FlowContext.jsx`
- `webAleaFront/src/features/workspace/model/WorkflowGraph.jsx`
- `webAleaFront/src/features/workspace/engine/WorkflowEngine.jsx`

**What happens**
1. `buildGraphModel()` clones inputs/outputs and filters edges to custom nodes.
2. `WorkflowEngine.start()` validates the graph, initializes state, and schedules ready nodes.
3. Each node executes either locally (primitive) or via backend if it has `packageName` + `nodeName`.

## 2) OpenAlea node execution (Backend)

**Frontend API call**
- `executeNode()` in `webAleaFront/src/api/runnerAPI.js` posts to the runner API.

**Backend endpoint**
- `POST /execute` in `webAleaBack/api/v1/endpoints/runner.py`

**Execution flow**
1. The endpoint converts input list -> dict `{name: value}`.
2. It calls `OpenAleaRunner.execute_node(...)` which ultimately runs `run_workflow.py` in a subprocess.
3. `run_workflow.execute_node()` instantiates the node and runs `node.eval()`.
4. Each output is serialized with `serialize_value()`.

**Key files**
- `webAleaFront/src/api/runnerAPI.js`
- `webAleaBack/api/v1/endpoints/runner.py`
- `webAleaBack/model/openalea/runner/runnable/run_workflow.py`

## 3) Serialization of 3D data (Backend)

**Where it happens**
- `serialize_value()` in `webAleaBack/model/openalea/runner/runnable/run_workflow.py`

**Logic**
- If the output is PlantGL (`Scene`, `Shape`, or `Geometry`), it is converted to a JSON scene with a marker:
  ```json
  {"__type__": "plantgl_scene", "scene": { ... }}
  ```
- Otherwise, it is serialized as primitive types / lists / dicts.

**PlantGL JSON building**
- `serialize_scene()` in `webAleaBack/model/openalea/visualizer/utils/serialize.py` creates a scene JSON by iterating shapes, converting geometry to meshes/lines via `mesh_from_geometry()`, and extracting material color and opacity.

**Geometry conversion**
- `mesh_from_geometry()` in `webAleaBack/model/openalea/visualizer/utils/plantgl.py` maps curves to `line` with vertices, and surfaces/solids to `mesh` with vertices + indices.

**Key files**
- `webAleaBack/model/openalea/runner/runnable/run_workflow.py`
- `webAleaBack/model/openalea/visualizer/utils/serialize.py`
- `webAleaBack/model/openalea/visualizer/utils/plantgl.py`

## 4) Backend cache strategy (important)

**Why it exists**
- PlantGL scenes can be very large (many vertices/indices). Serializing them inline for every execution is expensive in RAM and HTTP payload size.
- The backend therefore prefers a cache-first, ref-based flow to keep runner responses small and enable fast re-rendering.

**Two complementary caches**
- **Object cache** (pickle). Stores the raw PlantGL object serialized as `<ref>.pkl`. Used as a fallback if JSON serialization fails or if JSON was not precomputed.
- **Scene JSON cache**. Stores the already-serialized scene JSON as `<ref>.scene.json`. Used for very fast visualizer responses on rerender.

**Where it happens**
- In `serialize_value(...)`, PlantGL outputs are handled by `_serialize_plantgl_scene(...)`.
- The strategy is:
  1. Try `serialize_scene(...)` and immediately write scene JSON to cache (preferred).
  2. If JSON fails, fallback to object cache (`.pkl`).
  3. As a final fallback, inline JSON is returned (worst-case).

**Response types emitted by the runner**
- `plantgl_scene_json_ref` (preferred; points to `.scene.json`)
- `plantgl_scene_ref` (fallback; points to `.pkl`)
- `plantgl_scene` (inline JSON; last resort)

**Visualizer cache resolution order**
1. If the payload already contains a scene (`scene` / `objects`), return it.
2. Else, if a `scene_ref` exists, try `cache_load_scene_json(ref)` (fast path). If miss, load object cache, serialize, then persist `.scene.json`.

**Why this matters**
- The cache reduces backend memory spikes and drastically reduces response size.
- It also enables fast rerender of the same node output without recomputing or reserializing.

**Cache configuration**
- Default cache dir is `/tmp/webalea_object_cache` (can be overridden).
- TTL cleanup is controlled by `OPENALEA_CACHE_TTL_SECONDS`.
- Cache location can be overridden via `OPENALEA_CACHE_DIR`.

**Relevant backend files**
- `webAleaBack/model/openalea/cache/object_cache.py`
- `webAleaBack/model/openalea/visualizer/utils/visualizer_utils.py`
- `webAleaBack/api/v1/endpoints/visualizer.py`

## 5) Results stored in the UI (Frontend)

**Event handler**
- When a node finishes, `WorkflowEngine` emits `node-result`.
- `handleNodeResult()` updates `node.data.outputs` in the UI state.

**Key files**
- `webAleaFront/src/features/workspace/handlers/workflowEventHandlers.js`

## 6) User triggers 3D rendering (Frontend)

**UI action**
- In the sidebar, `NodeResultRender` lets the user click "Launch Render".

**Data sent**
- The frontend sends `node.data.outputs` to the visualizer API.

**Key files**
- `webAleaFront/src/features/nodes/ui/sidebar_detail/NodeResultRender.jsx`
- `webAleaFront/src/api/visualizerAPI.js`

## 7) Frontend visualizer flow

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

## 8) Visualizer API extracts a scene (Backend)

**Endpoint**
- `POST /visualize` in `webAleaBack/api/v1/endpoints/visualizer.py`

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
- If the expected `shape_count` (from `__meta__`) does not match the produced `object_count`,
  the backend logs a mismatch and can return a `warning`.

## 9) Scene is rendered in Three.js (Frontend)

**Modal lifecycle**
- `VisualizerModal` mounts and calls `buildSceneFromJSON(sceneJSON, mountRef)`.

**Scene construction (core modules)**
- `SceneBuilder` orchestrates the render pipeline and delegates to core modules:
  - `core/sceneSetup.js` (scene, camera, renderer, controls)
  - `core/objectPipeline.js` (object grouping + mesh merging)
  - `core/lighting.js` (default lights)
  - `core/framing.js` (fit camera to bounds)
  - `core/resize.js` (resize handler)
  - `core/animation.js` (render loop)
  - `core/dispose.js` (cleanup)

**Rendering system specifics (important)**
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
  - `features/visualizer/factories/meshFactory.jsx`
  - `features/visualizer/factories/lineFactory.jsx`
  - `features/visualizer/factories/textFactory.jsx`

**TextFactory details**
- Caches text textures by `(text, font, color, background, padding, lineHeight)`.
- Supports multi-line text, font options, opacity, background, and transform overrides.

**Key files**
- `webAleaFront/src/features/visualizer/VisualizerModal.jsx`
- `webAleaFront/src/features/visualizer/SceneBuilder.jsx`
- `webAleaFront/src/features/visualizer/SceneFactory.jsx`
- `webAleaFront/src/features/visualizer/core/*`
- `webAleaFront/src/features/visualizer/utils/*`
- `webAleaFront/src/features/visualizer/factories/*`

## 10) End-to-end summary (short)

1. Workflow executes -> outputs produced by OpenAlea.
2. PlantGL outputs are serialized to JSON scenes (cache-first).
3. Node outputs stored in UI state.
4. User requests render -> outputs sent to visualizer.
5. Backend extracts scene JSON and uses cache if possible.
6. Frontend builds a Three.js scene and renders it.

## Notes / Extension points

- If you want automatic rendering after execution, trigger `fetchNodeScene()` (or the hook) on `node-result`.
- If you want other 3D formats, extend `serialize_value()` + `visualizer.py` extraction logic.
- If you need richer materials/lights, expand `serialize_scene()` and the Three.js factories.
