# WebAlea - Options de Rendu 3D

> Documentation générée le 30/12/2024

## Table des matières

1. [Introduction](#introduction)
2. [Option 1 : Three.js / React Three Fiber](#option-1--threejs--react-three-fiber)
3. [Option 2 : PlantGL](#option-2--plantgl)
4. [Comparatif](#comparatif)
5. [Recommandation](#recommandation)
6. [Implémentation suggérée](#implémentation-suggérée)

---

## Introduction

L'objectif est d'intégrer un rendu 3D dans WebAlea pour visualiser les résultats des workflows OpenAlea, notamment pour la modélisation des plantes. Deux options principales sont envisagées :

1. **Three.js / React Three Fiber** - Solution web standard
2. **PlantGL** - Bibliothèque native OpenAlea

---

## Option 1 : Three.js / React Three Fiber

### Description

Three.js est la bibliothèque JavaScript de référence pour le rendu 3D dans le navigateur. React Three Fiber (R3F) est un wrapper React déclaratif pour Three.js.

### Technologies

| Package | Version | Description |
|---------|---------|-------------|
| `three` | ^0.160.0 | Moteur 3D WebGL |
| `@react-three/fiber` | ^8.15.0 | Wrapper React pour Three.js |
| `@react-three/drei` | ^9.92.0 | Helpers et composants utiles |
| `@react-three/postprocessing` | ^2.15.0 | Effets post-traitement |

### Avantages

| Avantage | Description |
|----------|-------------|
| **Documentation abondante** | Communauté massive, nombreux tutoriels |
| **Performance** | Optimisé pour le web, WebGL2 |
| **Intégration React native** | S'intègre parfaitement avec l'architecture existante |
| **Écosystème riche** | Loaders, contrôles, effets, physics |
| **Maintenance active** | Mises à jour régulières, bugs corrigés rapidement |
| **Formats standards** | Support GLTF, OBJ, FBX, etc. |

### Inconvénients

| Inconvénient | Description |
|--------------|-------------|
| **Conversion nécessaire** | Les données PlantGL doivent être converties |
| **Pas de support L-System natif** | Doit implémenter la logique de parsing |
| **Courbe d'apprentissage** | API Three.js complexe |

### Exemple d'intégration

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

function PlantViewer({ plantData }) {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <PlantMesh data={plantData} />
      <OrbitControls />
      <Environment preset="sunset" />
    </Canvas>
  );
}

function PlantMesh({ data }) {
  // Conversion des données PlantGL vers Three.js geometry
  const geometry = useMemo(() => {
    return convertPlantGLToThree(data);
  }, [data]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="green" />
    </mesh>
  );
}
```

### Installation

```bash
cd webAleaFront
npm install three @react-three/fiber @react-three/drei
```

---

## Option 2 : PlantGL

### Description

PlantGL est la bibliothèque de visualisation 3D native d'OpenAlea, spécialement conçue pour la modélisation des plantes et les L-Systems.

### Technologies

| Package | Version | Description |
|---------|---------|-------------|
| `openalea.plantgl` | 3.x | Bibliothèque C++/Python |
| `pgljupyter` | latest | Widget Jupyter pour PlantGL |

### Avantages

| Avantage | Description |
|----------|-------------|
| **Intégration native OpenAlea** | Données directement utilisables |
| **Support L-System** | Interprétation turtle graphics native |
| **Primitives botaniques** | Cylindres, cônes, surfaces NURBS optimisées |
| **Précision scientifique** | Conçu pour la recherche en botanique |

### Inconvénients

| Inconvénient | Description |
|--------------|-------------|
| **Pas de support web natif** | Conçu pour desktop Python |
| **pgljupyter limité** | Widget Jupyter, pas React |
| **Documentation sparse** | Peu de ressources en ligne |
| **Dépendances lourdes** | Nécessite compilation C++ |
| **Intégration complexe** | Pas de binding JavaScript direct |

### Architecture d'intégration possible

```
Frontend React                    Backend Python
     │                                  │
     │  WebSocket/REST                  │
     ▼                                  ▼
┌─────────────┐               ┌──────────────────┐
│ Three.js    │◄──── JSON ────│ PlantGL Scene    │
│ Renderer    │               │ Serializer       │
└─────────────┘               └──────────────────┘
```

### Sérialisation PlantGL vers JSON

```python
from openalea.plantgl.all import *
import json

def plantgl_to_json(scene):
    """Convertit une scène PlantGL en JSON pour Three.js"""
    meshes = []

    for shape in scene:
        geometry = shape.geometry

        if isinstance(geometry, TriangleSet):
            meshes.append({
                'type': 'triangles',
                'vertices': [list(v) for v in geometry.pointList],
                'indices': [list(t) for t in geometry.indexList],
                'normals': [list(n) for n in geometry.normalList] if geometry.normalList else None
            })
        elif isinstance(geometry, Cylinder):
            meshes.append({
                'type': 'cylinder',
                'radius': geometry.radius,
                'height': geometry.height
            })
        # ... autres primitives

    return json.dumps({'meshes': meshes})
```

---

## Comparatif

| Critère | Three.js/R3F | PlantGL |
|---------|--------------|---------|
| **Facilité d'intégration** | Excellente | Difficile |
| **Performance web** | Excellente | Moyenne (via sérialisation) |
| **Qualité visuelle** | Excellente | Bonne |
| **Support L-System** | À implémenter | Natif |
| **Documentation** | Abondante | Limitée |
| **Maintenance** | Active | Modérée |
| **Courbe d'apprentissage** | Moyenne | Élevée |
| **Taille bundle** | ~500KB | N/A (backend) |
| **Temps d'implémentation** | 2-3 semaines | 4-6 semaines |

### Score global

| Option | Score /10 | Justification |
|--------|-----------|---------------|
| **Three.js/R3F** | **8.5** | Intégration facile, écosystème mature, performance |
| **PlantGL** | **6.0** | Support natif mais intégration web complexe |

---

## Recommandation

### Approche hybride recommandée

**Utiliser Three.js/React Three Fiber pour le rendu** avec un **convertisseur PlantGL → Three.js côté backend**.

```
┌─────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    JSON     ┌──────────────────────────┐  │
│  │   Frontend   │◄────────────│      Backend Python      │  │
│  │              │             │                          │  │
│  │  Three.js    │             │  OpenAlea Workflow       │  │
│  │  R3F Canvas  │             │        ↓                 │  │
│  │  Controls    │             │  PlantGL Scene           │  │
│  │              │             │        ↓                 │  │
│  └──────────────┘             │  PlantGL → JSON          │  │
│                               │  Serializer              │  │
│                               └──────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Justification

1. **Three.js** gère le rendu WebGL optimisé
2. **PlantGL** reste utilisé côté backend pour l'exécution OpenAlea
3. **Convertisseur** transforme les scènes PlantGL en format JSON compatible Three.js
4. **Séparation des responsabilités** claire et maintenable

---

## Implémentation suggérée

### Phase 1 : Infrastructure (1 semaine)

#### 1.1 Installation des dépendances

```bash
npm install three @react-three/fiber @react-three/drei
```

#### 1.2 Création du composant Viewer3D

```
webAleaFront/src/features/viewer3d/
├── components/
│   ├── Viewer3D.jsx           # Canvas principal
│   ├── PlantMesh.jsx          # Rendu mesh plante
│   ├── SceneControls.jsx      # Contrôles caméra
│   └── LoadingIndicator.jsx   # Indicateur chargement
├── hooks/
│   ├── usePlantGeometry.js    # Conversion données → geometry
│   └── useSceneState.js       # État de la scène
├── utils/
│   ├── plantglConverter.js    # Conversion JSON → Three.js
│   └── geometryHelpers.js     # Helpers géométriques
└── index.js
```

### Phase 2 : Backend Serializer (1 semaine)

#### 2.1 Endpoint de rendu

```python
# webAleaBack/api/v1/endpoints/manager.py

@router.post("/render/scene")
async def render_scene(request: RenderRequest):
    """Exécute un workflow et retourne la scène 3D sérialisée"""
    result = await execute_workflow(request.workflow)

    if has_plantgl_scene(result):
        scene_json = serialize_plantgl_scene(result.scene)
        return {"success": True, "scene": scene_json}

    return {"success": True, "data": result}
```

#### 2.2 Sérialiseur PlantGL

```python
# webAleaBack/model/openalea/serializers/plantgl_serializer.py

class PlantGLSerializer:
    """Convertit une scène PlantGL en JSON pour Three.js"""

    def serialize(self, scene) -> dict:
        return {
            'meshes': [self._serialize_shape(s) for s in scene],
            'metadata': self._extract_metadata(scene)
        }

    def _serialize_shape(self, shape):
        geometry = shape.geometry
        material = shape.appearance

        return {
            'geometry': self._serialize_geometry(geometry),
            'material': self._serialize_material(material),
            'transform': self._get_transform(shape)
        }

    def _serialize_geometry(self, geom):
        if isinstance(geom, TriangleSet):
            return self._triangleset_to_json(geom)
        elif isinstance(geom, Cylinder):
            return self._cylinder_to_json(geom)
        # ... autres primitives
```

### Phase 3 : Intégration UI (1 semaine)

#### 3.1 Composant Viewer3D

```jsx
// webAleaFront/src/features/viewer3d/features/Viewer3D.jsx

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import PlantMesh from './PlantMesh';

export default function Viewer3D({ sceneData, isLoading }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />

          {sceneData && <PlantMesh data={sceneData} />}

          <Grid infiniteGrid />
          <OrbitControls makeDefault />
          <Environment preset="park" background blur={0.5} />
        </Suspense>
      </Canvas>

      {isLoading && <LoadingOverlay />}
    </div>
  );
}
```

#### 3.2 Intégration dans l'onglet View

```jsx
// webAleaFront/src/features/nodes/ui/sidebar_detail/NodeDetailSection.jsx

case "view":
  return (
    <div style={{ height: "100%" }}>
      <Viewer3D
        sceneData={executionResult?.scene}
        isLoading={isExecuting}
      />
    </div>
  );
```

### Phase 4 : Optimisations (continue)

- Instanced rendering pour les éléments répétitifs
- Level of Detail (LOD) pour grandes scènes
- Web Workers pour parsing JSON
- Mise en cache des géométries

---

## Ressources

### Three.js / React Three Fiber

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Three.js Examples](https://threejs.org/examples/)

### PlantGL

- [PlantGL Documentation](https://plantgl.readthedocs.io/)
- [OpenAlea PlantGL GitHub](https://github.com/openalea/plantgl)
- [L-Py Documentation](https://lpy.readthedocs.io/)

---

*Document suivant : [04_ROADMAP_OBJECTIFS.md](./04_ROADMAP_OBJECTIFS.md)*
