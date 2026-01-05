# WebAlea - État Actuel du Projet

> Documentation générée le 30/12/2024

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Backend](#architecture-backend)
3. [Architecture Frontend](#architecture-frontend)
4. [Intégration OpenAlea](#intégration-openalea)
5. [Système d'exécution](#système-dexécution)
6. [Points forts](#points-forts)
7. [Limitations actuelles](#limitations-actuelles)

---

## Vue d'ensemble

WebAlea est une application web de workflow visuel basée sur OpenAlea, permettant de créer et exécuter des pipelines de traitement de données scientifiques, notamment pour la modélisation des plantes.

### Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 19, Vite, @xyflow/react (ReactFlow), Material-UI, Bootstrap |
| **Backend** | FastAPI, Python 3.10-3.12, Pydantic |
| **Intégration** | OpenAlea Core, Conda (openalea3 channel) |
| **Persistance** | localStorage (frontend), fichiers JSON |

### Structure du Projet

```
WebAlea/
├── webAleaBack/                 # Backend FastAPI
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   └── manager.py       # 8 endpoints API
│   │   └── router.py
│   ├── model/
│   │   ├── openalea/
│   │   │   ├── inspector/       # Introspection packages
│   │   │   └── runnable/        # Scripts subprocess
│   │   └── utils/
│   │       └── conda_utils.py   # Gestion Conda
│   ├── core/config.py           # Configuration
│   └── main.py                  # App FastAPI
│
├── webAleaFront/                # Frontend React
│   ├── src/
│   │   ├── api/                 # Couche API
│   │   │   └── managerAPI.js
│   │   ├── service/             # Logique métier
│   │   │   └── PackageService.js
│   │   ├── features/
│   │   │   ├── workspace/       # Éditeur workflow
│   │   │   ├── package-manager/ # Gestion packages
│   │   │   ├── nodes/           # Composants nodes
│   │   │   ├── toolbar/         # Barre d'outils
│   │   │   └── logger/          # Console log
│   │   └── App.jsx
│   └── package.json
│
└── docs/                        # Documentation
```

---

## Architecture Backend

### Endpoints API

**Base URL:** `http://localhost:8000/api/v1/manager`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste tous les packages Conda du channel openalea3 |
| GET | `/latest` | Récupère les dernières versions des packages |
| GET | `/installed` | Liste les packages OpenAlea installés |
| GET | `/wralea` | Liste les packages avec nodes visuels (wralea) |
| GET | `/installed/{package_name}` | Récupère les définitions de nodes d'un package |
| POST | `/install` | Installe des packages dans l'environnement Conda |
| POST | `/execute/node` | Exécute un node OpenAlea unique |

### Modèles de Données (Pydantic)

```python
class PackageSpec(BaseModel):
    name: str
    version: Optional[str]

class InstallRequest(BaseModel):
    packages: List[PackageSpec]
    env_name: Optional[str]

class NodeExecutionInput(BaseModel):
    id: str
    name: str
    type: str
    value: Optional[Any]

class NodeExecutionRequest(BaseModel):
    node_id: str
    package_name: str
    node_name: str
    inputs: List[NodeExecutionInput]
```

### Isolation par Subprocess

Les opérations OpenAlea sont exécutées dans des processus Python séparés pour :
- Éviter les crashes de l'application principale
- Gérer les environnements Conda indépendamment
- Permettre le timeout des opérations longues

```
API Request → manager.py → OpenAleaInspector → subprocess → Script Python
                                                              ↓
                                                         PackageManager
                                                              ↓
                                                         JSON Response
```

---

## Architecture Frontend

### Hiérarchie des Composants

```
App
├── ToolBar                      # Export/Import/Run/Stop
│   ├── ButtonToolBar (x4)
│   └── ImportModal
├── PackageManager               # Sidebar gauche
│   ├── PanelModuleNode          # Packages OpenAlea (lazy load)
│   ├── PanelPrimitiveNode       # Float/String/Boolean
│   └── PanelInstallPackage      # Installation packages
├── Workspace                    # Canvas ReactFlow
│   ├── CustomNode               # Nodes OpenAlea
│   │   └── CustomHandle
│   ├── FloatNode                # Node primitif
│   ├── StringNode               # Node primitif
│   └── BoolNode                 # Node primitif
├── NodeDetailSection            # Panel détail (droite)
│   ├── NodeParameters           # Éditeur inputs/outputs
│   │   ├── NodeInputFloat
│   │   ├── NodeInputString
│   │   ├── NodeInputBoolean
│   │   └── NodeInputEnum
│   └── NodeDescription
└── ConsoleLog                   # Logs d'exécution
```

### Gestion d'État (FlowContext)

**Fichier:** `src/features/workspace/providers/FlowContext.jsx`

Le FlowContext centralise l'état de l'application :

```javascript
const contextValue = {
  nodes,              // Array des nodes ReactFlow
  edges,              // Array des connexions
  currentNode,        // Node sélectionné
  onNodesChange,      // Handler modifications nodes
  onEdgesChange,      // Handler modifications edges
  onConnect,          // Handler connexions (avec vérification type)
  addNode,            // Ajouter un node
  deleteNode,         // Supprimer un node
  updateNode,         // Modifier un node
  setNodesAndEdges,   // Import workflow complet
  onNodeExecute,      // Exécuter un node
  engine,             // Instance WorkflowEngine
};
```

### Types de Nodes

| Type | Composant | Description |
|------|-----------|-------------|
| `custom` | CustomNode | Nodes OpenAlea avec inputs/outputs dynamiques |
| `float` | FloatNode | Input numérique |
| `string` | StringNode | Input texte |
| `boolean` | BoolNode | Input booléen |

### Mapping des Types d'Interface

```javascript
// OpenAlea Interface → Frontend Type
IFloat    → "float"
IInt      → "float"
IStr      → "string"
IBool     → "boolean"
IEnumStr  → "enum"
ISequence → "array"
IDict     → "object"
None      → "any"
```

---

## Intégration OpenAlea

### Découverte des Packages

```
1. fetchWraleaPackages() → GET /wralea
   ↓
2. entry_points(group="wralea") scan
   ↓
3. Liste des packages avec nodes visuels
```

### Introspection des Nodes

```
1. fetchPackageNodes(pkgName) → GET /installed/{pkgName}
   ↓
2. describe_openalea_package.py (subprocess)
   ↓
3. PackageManager().get(pkgName)
   ↓
4. Pour chaque NodeFactory:
   - serialize_node()
   - serialize_node_puts(inputs/outputs)
   - get_interface_type()
   - interface_to_type()
   ↓
5. JSON Response:
   {
     "package_name": "...",
     "nodes": {
       "NodeName": {
         "description": "...",
         "inputs": [{id, name, interface, type, optional, desc}],
         "outputs": [{id, name, interface, type, optional, desc}],
         "callable": "..."
       }
     },
     "has_wralea": true
   }
```

### Formats de Données Supportés

Le backend gère 3 formats de données OpenAlea :

1. **Objets avec attributs:** `put.name`, `put.interface`
2. **Dictionnaires Python:** `put['name']`, `put['interface']`
3. **Strings dict-like:** `"{'name': 'x', 'interface': IFloat}"`

---

## Système d'Exécution

### WorkflowEngine (Frontend)

**Fichier:** `src/features/workspace/engine/WorkflowEngine.jsx`

```javascript
class WorkflowEngine {
  start()           // Lance l'exécution depuis les root nodes
  executeNode(node) // Exécute un node unique
  onUpdate(cb)      // Enregistre un listener d'événements
  bindModel(graph)  // Lie le modèle de graphe
}
```

### Événements d'Exécution

| Événement | Payload | Description |
|-----------|---------|-------------|
| `node-start` | nodeId | Node commence l'exécution |
| `node-result` | {id, result} | Résultat disponible |
| `node-done` | nodeId | Exécution terminée |
| `node-error` | {id, error} | Erreur d'exécution |
| `stop` | - | Workflow arrêté |

### Flux d'Exécution Backend

```
POST /execute/node
    ↓
execute_single_node(request)
    ↓
OpenAleaRunner.run("dataflow", [node_info])
    ↓
subprocess: run_workflow.py
    ↓
PackageManager().init()
    ↓
workflow = DataFlow()
workflow.add_node(node_factory)
workflow.execute()
    ↓
serialize_workflow_response()
    ↓
JSON: {success, node_id, result}
```

---

## Points Forts

### Architecture

- **Séparation des responsabilités** : API / Business Logic / Utilities
- **Isolation subprocess** : Opérations OpenAlea isolées
- **Composants réutilisables** : Architecture React modulaire
- **Validation Pydantic** : Requêtes API validées automatiquement

### Fonctionnalités

- **Découverte packages** : Liste automatique des packages OpenAlea
- **Lazy loading** : Chargement à la demande des nodes
- **Vérification types** : Connexions validées par type
- **Persistance localStorage** : Sauvegarde automatique du workflow
- **Export/Import JSON** : Partage de workflows

### Qualité

- **Logging complet** : Niveaux configurables, fichier + console
- **Tests unitaires** : Mocking des dépendances externes
- **JSDoc** : Types documentés pour PackageService

---

## Limitations Actuelles

### Critique

| Limitation | Impact | Fichier |
|------------|--------|---------|
| **Exécution single-node only** | Workflows multi-nodes impossibles | `manager.py:154` |
| **Input values non injectés** | Valeurs frontend ignorées | `run_workflow.py` |
| **Edges non traités** | Connexions non utilisées | `manager.py:121-125` |
| **Pas de propagation données** | Outputs non transmis aux inputs | `WorkflowEngine.jsx` |

### Sécurité

| Problème | Sévérité |
|----------|----------|
| CORS `allow_origins=["*"]` | CRITIQUE |
| Pas d'authentification | CRITIQUE |
| Pas de rate limiting | MOYENNE |
| Secret key hardcodée | BASSE |

### Performance

| Problème | Impact |
|----------|--------|
| Subprocess à chaque requête | 600-1500ms overhead |
| Pas de cache packages | Recalcul systématique |
| Pas de timeout subprocess | Risque de blocage |
| localStorage à chaque changement | Potentiel ralentissement |

### Manquant

- Exécution asynchrone
- Gestion d'état workflow (queued, running, completed)
- Support multi-root nodes
- Rendu 3D des résultats
- Undo/Redo
- Validation cycles
- Recherche globale nodes

---

## Métriques du Code

| Composant | Fichiers | Lignes |
|-----------|----------|--------|
| Backend Python | ~15 | ~1,500 |
| Frontend JS/JSX | ~30 | ~3,000 |
| Tests | 5 | ~300 |
| CSS | ~5 | ~500 |

---

*Document suivant : [02_CORRECTIONS_AMELIORATIONS.md](./02_CORRECTIONS_AMELIORATIONS.md)*
