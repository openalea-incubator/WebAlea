# Visualizer (Frontend)

## Role
Render 3D scenes (Three.js) from the backend visualizer payload. The UI opens in a modal and the scene lifecycle is managed by a dedicated hook.

## Entry Points
- `SceneBuilder.jsx`: orchestrates scene creation, render loop, resize, and cleanup.
- `SceneFactory.jsx`: maps `objectType` to object factories.
- `hooks/useVisualizerScene.js`: fetches scene data and exposes UI state.
- `services/visualizerService.js`: backend calls and payload normalization.

## Core Building Blocks
- `core/`: Three.js setup, animation loop, framing, resize, dispose.
- `factories/`: mesh, line, and text object builders.
- `utils/`: geometry and transform helpers.

## Expected Scene JSON (from backend)
```json
{
  "objects": [
    {
      "objectType": "mesh",
      "geometry": { "type": "mesh", "vertices": [], "indices": [] },
      "material": { "color": [1, 1, 1], "opacity": 1 },
      "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }
    }
  ]
}
```
