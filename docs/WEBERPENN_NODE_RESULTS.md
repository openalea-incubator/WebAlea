# WeberPenn ? R?sultats d?ex?cution et visualisation

Ce document garde une trace simple des n?uds Weber?Penn test?s, de leur sortie **apr?s ex?cution**, et du **JSON de visualisation** quand applicable.

## Environnement
- Backend: conteneur `webalea-backend-1`
- Conda env: `webalea_env`
- Date de test: 2026-02-04

## 1) global parameters

**Ex?cution (runner `/api/v1/runner/execute`)**

Entr?e:
```json
{
  "node_id": "test_global",
  "package_name": "openalea.weberpenn",
  "node_name": "global parameters",
  "inputs": []
}
```

Sortie:
```json
{
  "success": true,
  "node_id": "test_global",
  "outputs": [
    {
      "index": 0,
      "name": "output_0",
      "value": {
        "shape_id": 0,
        "base_size": 0.1,
        "scale": 1,
        "scale_variance": 0.0,
        "order": 0,
        "ratio": 0.01,
        "ratio_power": 1,
        "leaves": 0,
        "leaf_scale": 1.0,
        "leaf_scale_x": 1.0,
        "lobes": null,
        "lobes_variance": null,
        "flare": null,
        "base_split": 0
      },
      "type": "dict"
    }
  ],
  "error": null
}
```

## 2) weber and penn (visualisation)

Pipeline utilis?e (Python c?t? backend):
- `global parameters`
- `order parameters` ?4 (order0..order3)
- `tree parameters`
- `weber and penn`

R?sultat brut apr?s `serialize_value(scene)`:
```json
{
  "__type__": "plantgl_scene",
  "scene": {
    "objects": [
      {
        "id": "985bd951-fd9f-4541-952a-fa9476f34510",
        "objectType": "mesh",
        "geometry": {
          "type": "mesh",
          "vertices": [[0.0, 0.005, 0.0], [-0.005, 0.0, 0.0], [0.0, -0.005, 0.0], [0.005, 0.0, 0.0]],
          "indices": [[0, 1, 2], [0, 2, 3]]
        },
        "material": {"color": [0.47058823529411764, 0.23529411764705882, 0.0392156862745098], "opacity": 1.0},
        "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}
      }
    ]
  }
}
```

Notes:
- Le JSON complet contient **beaucoup d?objets et de vertices**. Ici un extrait minimal est conserv? pour m?moire.
- Le type retourn? c?t? backend est bien un `Scene` PlantGL s?rialis?.

## 3) tree parameters (custom)

**Ex?cution (pipeline Python c?t? backend)**  
Entr?es personnalis?es (non-default) :
- `global parameters`: `shape_id=2 - Hemispherical`, `base_size=0.2`, `scale=1.4`, `scale_variance=0.15`, `order=2`, `ratio=0.05`, `ratio_power=1.8`, `leaves=1`, `leaf_scale=0.8`, `leaf_scale_x=1.2`, `lobes=2.0`, `lobes_variance=0.2`, `flare=0.3`, `base_split=1`
- `order parameters` ?4 (order0..order3) avec valeurs non-default (length/curve/angles/branches)

Sortie JSON (`tree_params.__dict__`) :
```json
{"shape_id": 2, "base_size": 0.2, "scale": [1.4, 0.15], "order": 2, "ratio": 0.05, "ratio_power": 1.8, "lobes": [2.0, 0.2], "flare": 0.3, "base_split": 1, "n_length": [[1.8, 0.2], [1.2, 0.1], [0.8, 0.15], [0.4, 0.1]], "n_seg_split": [0.1, 0.15, 0.2, 0.25], "n_split_angle": [[35.0, 5.0], [45.0, 8.0], [55.0, 10.0], [60.0, 12.0]], "n_down_angle": [[40.0, 5.0], [50.0, 6.0], [60.0, 8.0], [70.0, 10.0]], "n_curve": [[4, 15.0, 4.0, -3.0], [3, 20.0, 6.0, -2.0], [3, 25.0, 7.0, -1.0], [2, 30.0, 8.0, 0.0]], "n_rotate": [[50.0, 10.0], [70.0, 12.0], [90.0, 15.0], [110.0, 18.0]], "n_branches": [6, 5, 4, 3], "leaves": 1, "leaf_scale": 0.8, "leaf_scale_x": 1.2, "rotate": [0, 0, 0]}
```

