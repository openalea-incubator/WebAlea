# Technical Documentation - 3D Rendering System (Backend + Frontend)

## 1. Scope
Ce document explique le module de rendu 3D de WebAlea de bout en bout:
- execution d'un node OpenAlea produisant une scene PlantGL,
- serialisation/cache serveur,
- API de visualisation,
- reconstruction Three.js cote frontend.

Il est destine a des developpeurs reprenant le projet.

---

## 2. Architecture overview

### 2.1 Pipeline haut niveau
1. Un node est execute via `POST /api/v1/runner/execute`.
2. Le runner subprocess (`run_workflow.py`) serialise les outputs.
3. Si output PlantGL (`Scene`, `Shape`, `Geometry`), il renvoie une reference cache (`__ref__`) plutot que le JSON complet.
4. Le front stocke cet output dans le node (`node.data.outputs`).
5. Au clic "Launch Render", le front appelle `POST /api/v1/visualizer/visualize` avec `scene_ref` et/ou `outputs`.
6. Le visualizer backend:
   - tente d'abord cache JSON scene,
   - sinon charge l'objet cache, serialise, puis persiste le JSON scene.
7. Le front recoit `{ scene: { objects: [...] } }`, puis construit la scene Three.js.

### 2.2 Fichiers cles

Backend:
- `webAleaBack/api/v1/endpoints/runner.py`
- `webAleaBack/model/openalea/runner/openalea_runner.py`
- `webAleaBack/model/openalea/runner/runnable/run_workflow.py`
- `webAleaBack/model/openalea/cache/object_cache.py`
- `webAleaBack/api/v1/endpoints/visualizer.py`
- `webAleaBack/model/openalea/visualizer/serialize.py`
- `webAleaBack/model/openalea/visualizer/visualizer_utils.py`

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

Le backend transforme la liste d'inputs en dictionnaire `{input_name: value}` puis appelle `OpenAleaRunner.execute_node(...)`.

### 3.2 Subprocess execution
`openalea_runner.py` lance:
- `python3 model/openalea/runner/runnable/run_workflow.py '<node_info_json>'`

`run_workflow.py`:
- instancie le node OpenAlea,
- injecte les inputs (avec resolution de refs cache si `__ref__`),
- execute `node.eval()`,
- serialise chaque output.

### 3.3 Serialisation des outputs PlantGL
Dans `serialize_value(...)`:
- `Scene` / `Shape` / `Geometry` -> `_serialize_plantgl_scene(...)`
- stratégie:
  1. essayer serialisation JSON immediate (`serialize_scene`) + `cache_store_scene_json_new`
  2. fallback cache objet pickle (`cache_store`) si echec
  3. fallback final inline scene JSON

Types envoyes par le runner pour une scene:
- `plantgl_scene_json_ref` (preferentiel)
- `plantgl_scene_ref` (fallback objet pickle)
- `plantgl_scene` (fallback inline)

### 3.4 Cache serveur
`object_cache.py`:
- cache objet: `<cache_dir>/<ref>.pkl`
- cache scene json: `<cache_dir>/<ref>.scene.json`
- dossier par defaut: `/tmp/webalea_object_cache`
- TTL cleanup via `cache_cleanup()` (defaut 3600s)

Variables utiles:
- `OPENALEA_CACHE_DIR`
- `OPENALEA_CACHE_TTL_SECONDS`

### 3.5 Endpoint visualizer
Endpoint: `POST /api/v1/visualizer/visualize`

Ordre de resolution dans `visualizer.py`:
1. scene inline deja presente dans payload (`scene`/`objects`/output type `plantgl_scene`),
2. extraction `scene_ref` (ou depuis outputs),
3. tentative `cache_load_scene_json(ref)` (hit rapide),
4. sinon `cache_load(ref)` + `json_from_result(...)` + `cache_store_scene_json(ref, scene)`,
5. reponse standard `{ nodeId, success, scene, cacheHit }`.

Si `scene.objects.length === 0`, backend ajoute `warning: "Scene contains no objects."`.

---

## 4. Frontend flow in detail

### 4.1 Execution workflow et stockage outputs
`WorkflowEngine` execute les nodes via `runnerAPI`.
Les outputs sont ensuite injectes dans le state node via `FlowContext.updateNodeOutputs(...)`.

### 4.2 Demande de rendu
`NodeResultRender.jsx`:
- recupere le node courant,
- lit `node.data.outputs`,
- cherche output avec:
  - `value.__type__` in `{plantgl_scene_ref, plantgl_scene_json_ref}`
  - `value.__ref__`
- appelle `fetchNodeScene(...)` avec:
  - `scene_ref`
  - `scene_ref_expected_shape_count` (si meta dispo)
  - `outputs`

### 4.3 Affichage modal et build scene
`VisualizerModal`:
- ouvre modal,
- appelle `buildSceneFromJSON(sceneJSON, mountRef)`,
- gere cleanup `dispose()`.

`SceneBuilder`:
- setup Three.js scene/camera/renderer,
- creation objets via `buildObjectNode(...)`,
- merge des meshes statiques par materiau (reduire draw calls),
- framing camera automatique via bounding box,
- loop animation seulement si objets animes.

---

## 5. JSON contracts (formats attendus)

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
Exemple scene via reference JSON cache:
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
- `geometry` (pour `mesh`)
- `material` (optionnel)
- `transform` (optionnel)
- `children` (optionnel, arbre)
- `animation` (optionnel)

`geometry` pour mesh:
- `type: "mesh"`
- `vertices: number[][]` (triplets xyz)
- `indices?: number[][]` (triplets indices triangle)

---

## 7. Performance model and design choices

## 7.1 Pourquoi le cache ref-based
Sans cache, serialiser des scenes massives (vertices/indices) a chaque execution:
- augmente latence backend,
- augmente RAM backend,
- gonfle payload HTTP.

Le design actuel:
- runner renvoie une ref legere,
- visualizer construit/sert le JSON scene a la demande,
- cache JSON scene reutilisable sur rerender.

## 7.2 Optimisations frontend
- conversion vers `Float32Array` / `Uint32Array` sans flatten intermediaire,
- merge de meshes statiques par materiau,
- animation loop active seulement si necessaire.

---

## 8. Logging and observability

Logs backend importants:
- runner:
  - `OpenAleaRunner: Execution result ... sceneRef ... sceneShapeCount ...`
- visualizer:
  - `Visualizer request ...`
  - `Visualizer extracted scene_ref ...`
  - `Visualizer scene JSON cache hit ...`
  - `Visualizer scene generated from ref ...`
  - `Visualizer mismatch ... expected_shape_count ... object_count ...`

Logs frontend:
- `NodeResultRender`:
  - payload summary (`sceneRef`, outputSummary)
  - scene ready (`cacheHit`, `warning`, `objects`)
- `visualizerAPI`:
  - POST summary (keys, outputCount, hasSceneRef)

---

## 9. Troubleshooting guide

## 9.1 Cas: "Scene contains no objects."
Verifier:
1. `sceneShapeCount` dans log runner > 0 ?
2. `visualizer` signale mismatch attendu vs object_count ?
3. serialisation PlantGL (`serialize_scene`) retourne bien des objects ?

Si `shape_count > 0` mais `object_count = 0`:
- suspecter conversion geometrie (`mesh_from_geometry`) ou geometries non supportees.

## 9.2 Cas: modal vide cote front
Verifier:
- `sceneData.success === true`
- `scene.objects` existe et non vide
- `objectType` reconnus (`mesh`, `line`, `text`, `group`)

## 9.3 Cas: erreurs cache
- verifier `OPENALEA_CACHE_DIR` accessible en ecriture,
- verifier presence des fichiers `.pkl` / `.scene.json`,
- verifier TTL cleanup pas trop agressif.

## 9.4 Cas: backend indisponible (ERR_EMPTY_RESPONSE)
Verifier la sante du container backend et les dependances Python (ex: `anyio`/FastAPI/Starlette env).

---

## 10. Extension points

- Ajouter de nouveaux `objectType`:
  - backend: enrichir `serialize_scene` / `mesh_from_geometry`,
  - frontend: ajouter factory dans `SceneFactory`.
- Ajouter support materiaux avancees (textures, PBR).
- Ajouter endpoint de streaming scene (chunking) pour scenes extremement volumineuses.

---

## 11. Suggested validation checklist (dev)

1. Executer un node simple (`openalea.math.addition`) -> output scalar OK.
2. Executer un node scene PlantGL -> output `plantgl_scene_json_ref` ou `plantgl_scene_ref`.
3. Appeler visualizer avec `scene_ref` -> `success=true`, `scene.objects` coherent.
4. Rouvrir rendu sur meme node -> verifier `cacheHit=true` possible.
5. Changer de node -> verifier reset cache front (`NodeResultRender`).

