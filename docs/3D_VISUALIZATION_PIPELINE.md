# 3D Visualization Pipeline (Workflow → Scene → Render)

This document explains, step by step, how the app executes a workflow node, extracts 3D data, serializes it, and renders it in the browser.

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
1. The endpoint converts input list → dict `{name: value}`.
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
- `serialize_scene()` in `webAleaBack/model/openalea/visualizer/serialize.py` creates a scene JSON:
  - Iterates shapes
  - For each shape, converts geometry to meshes/lines via `mesh_from_geometry()`
  - Extracts material color and opacity

**Geometry conversion**
- `mesh_from_geometry()` in `webAleaBack/model/openalea/visualizer/plantgl.py`:
  - Curves → `line` with vertices
  - Surfaces/solids → `mesh` with vertices + indices

**Key files**
- `webAleaBack/model/openalea/runner/runnable/run_workflow.py`
- `webAleaBack/model/openalea/visualizer/serialize.py`
- `webAleaBack/model/openalea/visualizer/plantgl.py`


## 4) Results stored in the UI (Frontend)

**Event handler**
- When a node finishes, `WorkflowEngine` emits `node-result`.
- `handleNodeResult()` updates `node.data.outputs` in the UI state.

**Key files**
- `webAleaFront/src/features/workspace/handlers/workflowEventHandlers.js`


## 5) User triggers 3D rendering (Frontend)

**UI action**
- In the sidebar, `NodeResultRender` lets the user click “Launch Render”.

**Data sent**
- The frontend sends `node.data.outputs` to the visualizer API.

**Key files**
- `webAleaFront/src/features/nodes/ui/sidebar_detail/NodeResultRender.jsx`
- `webAleaFront/src/api/visualizerAPI.js`


## 6) Visualizer API extracts a scene (Backend)

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


## 7) Scene is rendered in Three.js (Frontend)

**Modal lifecycle**
- `VisualizerModal` mounts and calls `buildSceneFromJSON(sceneJSON, mountRef)`.

**Scene construction**
- `SceneBuilder` creates:
  - `THREE.Scene`
  - `THREE.PerspectiveCamera`
  - `THREE.WebGLRenderer`
  - `OrbitControls`
- It separates static meshes from animated objects.
- Static meshes are merged by material for performance.
- Non-mesh objects go through `SceneFactory`.

**Factories**
- `SceneFactory.buildObjectNode()` recursively builds objects
- `meshFactory` builds a `THREE.Mesh`
- `lineFactory` builds `THREE.Line`
- `textFactory` builds text meshes

**Key files**
- `webAleaFront/src/features/visualizer/VisualizerModal.jsx`
- `webAleaFront/src/features/visualizer/SceneBuilder.jsx`
- `webAleaFront/src/features/visualizer/SceneFactory.jsx`
- `webAleaFront/src/features/visualizer/factories/meshFactory.jsx`
- `webAleaFront/src/features/visualizer/factories/lineFactory.jsx`
- `webAleaFront/src/features/visualizer/factories/textFactory.jsx`


## 8) End-to-end summary (short)

1. Workflow executes → outputs produced by OpenAlea.
2. PlantGL outputs are serialized to JSON scenes.
3. Node outputs stored in UI state.
4. User requests render → outputs sent to visualizer.
5. Backend extracts scene JSON.
6. Frontend builds a Three.js scene and renders it.


## Notes / Extension points

- If you want automatic rendering after execution, trigger `fetchNodeScene()` on `node-result`.
- If you want other 3D formats, extend `serialize_value()` + `visualizer.py` extraction logic.
- If you need richer materials/lights, expand `serialize_scene()` and the Three.js factories.
