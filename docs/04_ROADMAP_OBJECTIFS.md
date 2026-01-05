# WebAlea - Roadmap et Objectifs

> Documentation générée le 30/12/2024

## Table des matières

1. [Objectifs finaux](#objectifs-finaux)
2. [État actuel vs Objectif](#état-actuel-vs-objectif)
3. [Roadmap détaillée](#roadmap-détaillée)
4. [Architecture cible](#architecture-cible)
5. [Spécifications techniques](#spécifications-techniques)
6. [Risques et mitigations](#risques-et-mitigations)

---

## Objectifs finaux

### Vision

Créer une plateforme web complète pour la modélisation visuelle de plantes via OpenAlea, avec :

1. **Exécution complète de workflows** multi-nodes
2. **Rendu 3D interactif** des résultats
3. **Support multi-root nodes** dans un même workflow
4. **Gestion robuste des erreurs** à tous les niveaux
5. **Exécution asynchrone et progressive** avec feedback temps réel

### Critères de succès

| Critère | Mesure |
|---------|--------|
| Exécution workflow | 100% des nodes exécutés dans l'ordre correct |
| Propagation données | Outputs transmis aux inputs connectés |
| Rendu 3D | Scènes PlantGL visualisées dans le navigateur |
| Temps réponse | < 2s pour nodes simples, feedback progressif pour longs |
| Robustesse | Aucun crash, erreurs gérées gracieusement |

---

## État actuel vs Objectif

| Fonctionnalité | État actuel | Objectif |
|----------------|-------------|----------|
| **Exécution single-node** | Fonctionnel | Maintenu |
| **Exécution multi-nodes** | Non implémenté | Fonctionnel |
| **Propagation données** | Non implémenté | Automatique |
| **Multi-root nodes** | Non supporté | Supporté |
| **Rendu 3D** | Absent | Three.js intégré |
| **Exécution async** | Bloquante | WebSocket temps réel |
| **Gestion erreurs** | Basique | Complète avec recovery |
| **Feedback progression** | Absent | Barre de progression + logs |

---

## Roadmap détaillée

### Phase 1 : Fondations du WorkflowEngine (Priorité: CRITIQUE)

#### 1.1 Analyse de dépendances et tri topologique

**Objectif** : Déterminer l'ordre d'exécution des nodes

**Fichiers à modifier** :
- `webAleaFront/src/features/workspace/engine/WorkflowEngine.jsx`

**Implémentation** :

```javascript
class WorkflowEngine {
  /**
   * Calcule l'ordre d'exécution via tri topologique (Kahn's algorithm)
   */
  computeExecutionOrder() {
    const inDegree = new Map();
    const adjacency = new Map();

    // Initialiser les structures
    this.nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    });

    // Calculer les degrés entrants
    this.edges.forEach(edge => {
      const targetId = edge.target;
      inDegree.set(targetId, inDegree.get(targetId) + 1);
      adjacency.get(edge.source).push(targetId);
    });

    // File des nodes sans dépendances (root nodes)
    const queue = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    // Tri topologique
    const executionOrder = [];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      executionOrder.push(nodeId);

      adjacency.get(nodeId).forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Détection de cycle
    if (executionOrder.length !== this.nodes.length) {
      throw new Error('Cycle détecté dans le workflow');
    }

    return executionOrder;
  }
}
```

#### 1.2 Propagation des données entre nodes

**Objectif** : Transmettre les outputs aux inputs connectés

```javascript
class WorkflowEngine {
  /**
   * Propage les résultats d'un node vers ses successeurs
   */
  propagateResults(sourceNodeId, results) {
    const outgoingEdges = this.edges.filter(e => e.source === sourceNodeId);

    outgoingEdges.forEach(edge => {
      const targetNode = this.nodes.find(n => n.id === edge.target);
      const sourceHandle = edge.sourceHandle; // output_0, output_1, etc.
      const targetHandle = edge.targetHandle; // input_0, input_1, etc.

      // Extraire l'index de l'output
      const outputIndex = parseInt(sourceHandle.replace('output_', ''));
      const outputValue = results[outputIndex];

      // Extraire l'index de l'input
      const inputIndex = parseInt(targetHandle.replace('input_', ''));

      // Mettre à jour l'input du node cible
      targetNode.data.inputs[inputIndex].value = outputValue;
      targetNode.data.inputs[inputIndex].fromConnection = true;
    });
  }
}
```

#### 1.3 Gestion des états d'exécution

**États des nodes** :

```javascript
const NodeExecutionState = {
  IDLE: 'idle',           // En attente
  QUEUED: 'queued',       // Dans la file d'attente
  RUNNING: 'running',     // En cours d'exécution
  COMPLETED: 'completed', // Terminé avec succès
  ERROR: 'error',         // Terminé avec erreur
  SKIPPED: 'skipped'      // Sauté (dépendance en erreur)
};
```

**Visualisation dans CustomNode** :

```jsx
function CustomNode({ data }) {
  const stateColors = {
    idle: '#fff',
    queued: '#fff3cd',
    running: '#cce5ff',
    completed: '#d4edda',
    error: '#f8d7da',
    skipped: '#e2e3e5'
  };

  return (
    <div style={{
      backgroundColor: stateColors[data.executionState || 'idle'],
      border: data.executionState === 'running' ? '2px solid #007bff' : '1px solid #ddd'
    }}>
      {/* ... */}
    </div>
  );
}
```

---

### Phase 2 : Backend Workflow Execution (Priorité: CRITIQUE)

#### 2.1 Nouveau endpoint d'exécution workflow

**Fichier** : `webAleaBack/api/v1/endpoints/manager.py`

```python
class WorkflowExecutionRequest(BaseModel):
    nodes: List[NodeDefinition]
    edges: List[EdgeDefinition]
    execution_mode: str = "sequential"  # ou "parallel"

class NodeDefinition(BaseModel):
    id: str
    package_name: str
    node_name: str
    inputs: List[NodeExecutionInput]

class EdgeDefinition(BaseModel):
    source: str
    source_handle: str
    target: str
    target_handle: str

@router.post("/execute/workflow")
async def execute_workflow(request: WorkflowExecutionRequest):
    """Exécute un workflow complet avec propagation des données"""

    runner = OpenAleaRunner()
    execution_order = compute_topological_order(request.nodes, request.edges)

    results = {}
    for node_id in execution_order:
        node = find_node(request.nodes, node_id)

        # Injecter les valeurs des connexions entrantes
        resolved_inputs = resolve_inputs(node, request.edges, results)

        # Exécuter le node
        result = await runner.execute_node(node, resolved_inputs)

        if not result.success:
            return {
                "success": False,
                "failed_node": node_id,
                "error": result.error,
                "partial_results": results
            }

        results[node_id] = result.outputs

    return {
        "success": True,
        "results": results
    }
```

#### 2.2 Script d'exécution workflow

**Fichier** : `webAleaBack/model/openalea/runnable/run_workflow.py`

```python
#!/usr/bin/env python
"""Exécute un workflow OpenAlea complet"""

import json
import sys
from openalea.core.pkgmanager import PackageManager

def execute_workflow(workflow_json: str):
    workflow = json.loads(workflow_json)

    pm = PackageManager()
    pm.init()

    # Créer le dataflow
    dataflow = DataFlow()

    # Ajouter les nodes
    node_instances = {}
    for node_def in workflow['nodes']:
        pkg = pm.get(node_def['package_name'])
        factory = pkg.get_factory(node_def['node_name'])
        instance = factory.instantiate()
        node_instances[node_def['id']] = instance
        dataflow.add_node(instance)

    # Créer les connexions
    for edge in workflow['edges']:
        source_node = node_instances[edge['source']]
        target_node = node_instances[edge['target']]
        source_port = int(edge['source_handle'].replace('output_', ''))
        target_port = int(edge['target_handle'].replace('input_', ''))

        dataflow.connect(source_node, source_port, target_node, target_port)

    # Injecter les valeurs d'entrée
    for node_def in workflow['nodes']:
        instance = node_instances[node_def['id']]
        for inp in node_def['inputs']:
            if inp.get('value') is not None and not inp.get('fromConnection'):
                instance.set_input(inp['index'], inp['value'])

    # Exécuter
    dataflow.evaluate()

    # Collecter les résultats
    results = {}
    for node_id, instance in node_instances.items():
        results[node_id] = {
            'outputs': [instance.get_output(i) for i in range(instance.get_nb_output())]
        }

    return results

if __name__ == '__main__':
    workflow_json = sys.argv[1]
    result = execute_workflow(workflow_json)
    print(json.dumps(result))
```

---

### Phase 3 : Exécution Asynchrone avec WebSocket (Priorité: HAUTE)

#### 3.1 Configuration WebSocket Backend

**Fichier** : `webAleaBack/api/v1/websocket/execution_ws.py`

```python
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect
import asyncio
import json

class ExecutionWebSocket:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        await websocket.accept()
        self.active_connections[execution_id] = websocket

    def disconnect(self, execution_id: str):
        if execution_id in self.active_connections:
            del self.active_connections[execution_id]

    async def send_progress(self, execution_id: str, message: dict):
        if execution_id in self.active_connections:
            await self.active_connections[execution_id].send_json(message)

execution_manager = ExecutionWebSocket()

@router.websocket("/ws/execute/{execution_id}")
async def websocket_execute(websocket: WebSocket, execution_id: str):
    await execution_manager.connect(websocket, execution_id)

    try:
        while True:
            data = await websocket.receive_json()

            if data['action'] == 'start':
                asyncio.create_task(
                    execute_workflow_async(execution_id, data['workflow'])
                )
            elif data['action'] == 'stop':
                # Annuler l'exécution
                cancel_execution(execution_id)

    except WebSocketDisconnect:
        execution_manager.disconnect(execution_id)

async def execute_workflow_async(execution_id: str, workflow: dict):
    """Exécute le workflow et envoie les mises à jour via WebSocket"""

    execution_order = compute_topological_order(workflow)

    for i, node_id in enumerate(execution_order):
        # Notifier le début
        await execution_manager.send_progress(execution_id, {
            'type': 'node_start',
            'node_id': node_id,
            'progress': i / len(execution_order)
        })

        # Exécuter
        result = await execute_node_async(node_id, workflow)

        # Notifier le résultat
        await execution_manager.send_progress(execution_id, {
            'type': 'node_complete' if result.success else 'node_error',
            'node_id': node_id,
            'result': result.data,
            'progress': (i + 1) / len(execution_order)
        })

        if not result.success:
            break

    # Notifier la fin
    await execution_manager.send_progress(execution_id, {
        'type': 'workflow_complete',
        'progress': 1.0
    })
```

#### 3.2 Client WebSocket Frontend

**Fichier** : `webAleaFront/src/features/workspace/engine/ExecutionClient.js`

```javascript
class ExecutionClient {
  constructor(onProgress, onComplete, onError) {
    this.ws = null;
    this.executionId = null;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  connect(executionId) {
    this.executionId = executionId;
    this.ws = new WebSocket(`ws://localhost:8000/api/v1/ws/execute/${executionId}`);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'node_start':
          this.onProgress({
            nodeId: message.node_id,
            status: 'running',
            progress: message.progress
          });
          break;

        case 'node_complete':
          this.onProgress({
            nodeId: message.node_id,
            status: 'completed',
            result: message.result,
            progress: message.progress
          });
          break;

        case 'node_error':
          this.onProgress({
            nodeId: message.node_id,
            status: 'error',
            error: message.error,
            progress: message.progress
          });
          break;

        case 'workflow_complete':
          this.onComplete(message);
          break;
      }
    };

    this.ws.onerror = (error) => {
      this.onError(error);
    };
  }

  startExecution(workflow) {
    this.ws.send(JSON.stringify({
      action: 'start',
      workflow: workflow
    }));
  }

  stopExecution() {
    this.ws.send(JSON.stringify({ action: 'stop' }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default ExecutionClient;
```

---

### Phase 4 : Intégration Three.js et Rendu 3D (Priorité: HAUTE)

> Voir document [03_OPTIONS_RENDU_3D.md](./03_OPTIONS_RENDU_3D.md) pour les détails complets.

#### 4.1 Structure des composants

```
webAleaFront/src/features/viewer3d/
├── components/
│   ├── Viewer3D.jsx
│   ├── PlantScene.jsx
│   ├── PlantMesh.jsx
│   └── ViewerControls.jsx
├── hooks/
│   └── usePlantGeometry.js
├── utils/
│   └── plantglConverter.js
└── index.js
```

#### 4.2 Intégration dans le workflow

```javascript
// Après exécution, si le résultat contient une scène 3D
if (result.scene) {
  setScene3D(result.scene);
  setActiveTab('view');
}
```

---

### Phase 5 : Gestion des Erreurs Complète (Priorité: MOYENNE)

#### 5.1 Types d'erreurs

| Type | Source | Handling |
|------|--------|----------|
| `CONNECTION_ERROR` | Réseau | Retry avec backoff |
| `TIMEOUT_ERROR` | Backend lent | Afficher timeout, option retry |
| `VALIDATION_ERROR` | Inputs invalides | Highlight node, message |
| `EXECUTION_ERROR` | Code OpenAlea | Log détaillé, stack trace |
| `TYPE_ERROR` | Connexion incompatible | Empêcher connexion |
| `CYCLE_ERROR` | Graphe cyclique | Afficher message, highlight cycle |

#### 5.2 Composant ErrorBoundary

```jsx
class WorkflowErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Workflow Error:', error, errorInfo);
    // Envoyer à un service de monitoring
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

#### 5.3 Logs structurés

```javascript
// ConsoleLog amélioré
const logTypes = {
  INFO: { icon: 'info', color: '#17a2b8' },
  SUCCESS: { icon: 'check', color: '#28a745' },
  WARNING: { icon: 'warning', color: '#ffc107' },
  ERROR: { icon: 'error', color: '#dc3545' },
  DEBUG: { icon: 'bug', color: '#6c757d' }
};

function addLog(type, message, details = null) {
  const log = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type,
    message,
    details,
    nodeId: currentExecutingNode
  };
  setLogs(prev => [...prev, log]);
}
```

---

### Phase 6 : Optimisations et Polish (Priorité: BASSE)

#### 6.1 Performance

- Cache des définitions de nodes
- Virtualisation des listes de packages
- Debounce des sauvegardes localStorage
- Web Workers pour parsing JSON lourd

#### 6.2 UX

- Undo/Redo (historique des actions)
- Raccourcis clavier
- Minimap du workflow
- Recherche globale de nodes
- Drag & drop amélioré

#### 6.3 Fonctionnalités avancées

- Groupement de nodes (subgraphs)
- Templates de workflows
- Export en différents formats
- Collaboration temps réel (optionnel)

---

## Architecture cible

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  PackageManager │  │    Workspace     │  │    NodeDetailSection   │  │
│  │  ├─ Packages    │  │  ├─ ReactFlow    │  │  ├─ Parameters         │  │
│  │  ├─ Primitives  │  │  ├─ CustomNode   │  │  ├─ Description        │  │
│  │  └─ Install     │  │  └─ Edges        │  │  └─ Viewer3D (Three.js)│  │
│  └────────┬────────┘  └────────┬─────────┘  └───────────┬────────────┘  │
│           │                    │                        │               │
│           └────────────────────┼────────────────────────┘               │
│                                │                                         │
│                    ┌───────────┴───────────┐                            │
│                    │    FlowContext        │                            │
│                    │  ├─ nodes/edges       │                            │
│                    │  ├─ WorkflowEngine    │                            │
│                    │  └─ ExecutionClient   │                            │
│                    └───────────┬───────────┘                            │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │     WebSocket / REST    │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                              BACKEND                                     │
│                    ┌───────────┴───────────┐                            │
│                    │      FastAPI          │                            │
│                    │  ├─ /manager/*        │                            │
│                    │  ├─ /execute/workflow │                            │
│                    │  └─ /ws/execute/*     │                            │
│                    └───────────┬───────────┘                            │
│                                │                                         │
│            ┌───────────────────┼───────────────────┐                    │
│            │                   │                   │                    │
│   ┌────────┴────────┐ ┌───────┴───────┐ ┌────────┴────────┐           │
│   │ OpenAleaInspector│ │ OpenAleaRunner│ │ PlantGLSerializer│           │
│   │  (Subprocess)    │ │  (Subprocess) │ │   (Subprocess)  │           │
│   └─────────────────┘ └───────────────┘ └─────────────────┘           │
│                                │                                         │
│                    ┌───────────┴───────────┐                            │
│                    │   OpenAlea Core       │                            │
│                    │  ├─ PackageManager    │                            │
│                    │  ├─ DataFlow          │                            │
│                    │  └─ PlantGL           │                            │
│                    └───────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Spécifications techniques

### API Endpoints (cible)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/manager/` | Liste packages Conda |
| GET | `/api/v1/manager/installed` | Packages installés |
| GET | `/api/v1/manager/wralea` | Packages avec nodes |
| GET | `/api/v1/manager/installed/{pkg}` | Définitions nodes |
| POST | `/api/v1/manager/install` | Installer packages |
| POST | `/api/v1/execute/node` | Exécuter un node |
| POST | `/api/v1/execute/workflow` | Exécuter workflow complet |
| WS | `/api/v1/ws/execute/{id}` | Exécution temps réel |

### Modèles de données

```typescript
// Frontend TypeScript interfaces (à implémenter)

interface WorkflowNode {
  id: string;
  type: 'custom' | 'float' | 'string' | 'boolean';
  position: { x: number; y: number };
  data: {
    label: string;
    packageName?: string;
    nodeName?: string;
    inputs: NodePort[];
    outputs: NodePort[];
    executionState: ExecutionState;
    result?: any;
  };
}

interface NodePort {
  id: string;
  name: string;
  interface: string;
  type: 'float' | 'string' | 'boolean' | 'enum' | 'array' | 'object' | 'any';
  value?: any;
  optional: boolean;
  enumOptions?: string[];
  fromConnection?: boolean;
}

interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

type ExecutionState = 'idle' | 'queued' | 'running' | 'completed' | 'error' | 'skipped';
```

---

## Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Incompatibilité OpenAlea | Moyenne | Élevé | Tests sur plusieurs versions |
| Performance subprocess | Moyenne | Moyen | Pool de workers, cache |
| Complexité Three.js | Basse | Moyen | Utiliser R3F + Drei helpers |
| Conversion PlantGL | Moyenne | Moyen | Sérialiseur robuste, fallbacks |
| WebSocket instable | Basse | Moyen | Reconnexion auto, fallback REST |

---

## Priorités de développement

### Sprint 1 (Critique)
1. WorkflowEngine - Tri topologique
2. WorkflowEngine - Propagation données
3. Backend - Endpoint workflow

### Sprint 2 (Haute)
4. WebSocket - Exécution async
5. Three.js - Setup de base
6. PlantGL - Sérialiseur

### Sprint 3 (Moyenne)
7. Gestion erreurs complète
8. Viewer3D - Fonctionnalités avancées
9. UX - Feedback progression

### Sprint 4 (Basse)
10. Optimisations performance
11. Undo/Redo
12. Polish UI

---

*Fin de la documentation WebAlea*

---

## Index des documents

1. [01_ETAT_ACTUEL_PROJET.md](./01_ETAT_ACTUEL_PROJET.md) - État actuel du projet
2. [02_CORRECTIONS_AMELIORATIONS.md](./02_CORRECTIONS_AMELIORATIONS.md) - Corrections et améliorations
3. [03_OPTIONS_RENDU_3D.md](./03_OPTIONS_RENDU_3D.md) - Options de rendu 3D
4. **04_ROADMAP_OBJECTIFS.md** - Roadmap et objectifs (ce document)
