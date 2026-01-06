# WebAlea - Documentation du Workflow Engine

> Documentation technique du système d'exécution de workflows

## Table des matières

### Fondamentaux
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des composants](#architecture-des-composants)
3. [Modèles de données](#modèles-de-données)
4. [Flux d'exécution détaillé](#flux-dexécution-détaillé)
5. [Communication Frontend-Backend](#communication-frontend-backend)
6. [Gestion des états visuels](#gestion-des-états-visuels)
7. [Propagation des données](#propagation-des-données)
8. [Gestion des erreurs](#gestion-des-erreurs)
9. [Diagrammes de séquence](#diagrammes-de-séquence)

### Détails avancés
10. [Contrôle d'arrêt avec AbortController](#contrôle-darrêt-avec-abortcontroller)
11. [Système de listeners](#système-de-listeners)
12. [Persistance localStorage](#persistance-localstorage)
13. [CustomHandle - Propagation temps réel détaillée](#customhandle---propagation-temps-réel-détaillée)
14. [Système de couleurs des types](#système-de-couleurs-des-types)
15. [Validation des connexions](#validation-des-connexions)
16. [Structure complète des nodes ReactFlow](#structure-complète-des-nodes-reactflow)
17. [FlowContext - Fonctions helpers détaillées](#flowcontext---fonctions-helpers-détaillées)
18. [Export/Import de workflows](#exportimport-de-workflows)

### Backend & API
19. [Sérialisation Python (Backend)](#sérialisation-python-backend)
20. [Configuration timeout Backend](#configuration-timeout-backend)
21. [API managerAPI.js - Référence complète](#api-managerapijs---référence-complète)

### Références
22. [Mapping NodesTypes → Composants](#mapping-nodestypes--composants)
23. [Gestion des références avec nodesRef](#gestion-des-références-avec-nodesref)
24. [Annexe : Diagramme de flux complet](#annexe--diagramme-de-flux-complet)

---

## Vue d'ensemble

Le WorkflowEngine est le moteur d'exécution de WebAlea. Il orchestre l'exécution des nodes OpenAlea dans l'ordre topologique correct, gère la propagation des données entre nodes, et maintient la synchronisation avec l'interface utilisateur.

### Principes clés

| Principe | Description |
|----------|-------------|
| **Exécution asynchrone** | Chaque node s'exécute via une requête API asynchrone |
| **Roots en parallèle** | Les nodes racines s'exécutent simultanément |
| **Children séquentiels** | Les enfants d'un node s'exécutent l'un après l'autre |
| **Propagation automatique** | Les outputs sont injectés dans les inputs des nodes suivants |
| **Arrêt sur erreur** | Une erreur stoppe immédiatement tout le workflow |
| **Feedback temps réel** | L'UI se met à jour via des événements émis par le moteur |

---

## Architecture des composants

### Vue d'ensemble des fichiers

```
webAleaFront/src/features/
├── workspace/
│   ├── model/
│   │   └── WorkflowGraph.jsx      # Modèle WFNode + buildGraphModel()
│   ├── engine/
│   │   └── WorkflowEngine.jsx     # Moteur d'exécution
│   ├── providers/
│   │   ├── FlowContext.jsx        # État global + event handlers
│   │   └── FlowContextDefinition.jsx
│   └── ui/
│       └── CustomNode.jsx         # Rendu visuel des nodes
├── toolbar/
│   └── ui/
│       └── ToolBar.jsx            # Boutons Run/Stop
└── api/
    └── managerAPI.js              # Appels API backend

webAleaBack/
├── api/v1/endpoints/
│   └── manager.py                 # Endpoint /execute/node
└── model/openalea/
    ├── openalea_runner.py         # Orchestrateur subprocess
    └── runnable/
        └── run_workflow.py        # Script d'exécution OpenAlea
```

### Relations entre composants

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                                                                          │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐   │
│  │   ToolBar    │────►│  WorkflowGraph    │────►│  WorkflowEngine  │   │
│  │  (Run/Stop)  │     │  buildGraphModel()│     │    (Exécution)   │   │
│  └──────────────┘     └───────────────────┘     └────────┬─────────┘   │
│                                                          │              │
│                              events                      │              │
│                                 ▼                        │              │
│  ┌──────────────┐     ┌───────────────────┐             │              │
│  │  CustomNode  │◄────│   FlowContext     │◄────────────┘              │
│  │   (Rendu)    │     │  (État + Events)  │                            │
│  └──────────────┘     └───────────────────┘                            │
│                                                                          │
│                               │ API Call                                │
│                               ▼                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                    POST /api/v1/manager/execute/node
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                                                                          │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐   │
│  │  manager.py  │────►│ OpenAleaRunner    │────►│ run_workflow.py  │   │
│  │  (Endpoint)  │     │   (Subprocess)    │     │    (OpenAlea)    │   │
│  └──────────────┘     └───────────────────┘     └──────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Modèles de données

### WFNode (Frontend)

```javascript
// WorkflowGraph.jsx
class WFNode {
    constructor({
        id,           // string - Identifiant unique du node
        type,         // string - "custom" pour les nodes OpenAlea
        inputs,       // Array<Input> - Liste des inputs
        outputs,      // Array<Output> - Liste des outputs
        next,         // string[] - IDs des nodes enfants (custom only)
        packageName,  // string - Nom du package OpenAlea
        nodeName,     // string - Nom du node dans le package
        label         // string - Label affiché
    }) { ... }
}

// Structure Input/Output
interface Input {
    id: string;        // "input_0", "input_1", ...
    name: string;      // Nom de l'input (ex: "a", "b")
    type: string;      // Type: "float", "string", "boolean", ...
    value: any;        // Valeur actuelle
    interface: string; // Interface OpenAlea (ex: "IFloat")
}

interface Output {
    id: string;        // "output_0", "output_1", ...
    name: string;      // Nom de l'output
    type: string;      // Type de l'output
    value: any;        // Valeur après exécution
}
```

### Format de requête API

```javascript
// managerAPI.js - executeNode()
{
    node_id: "node_123",
    package_name: "openalea.math",
    node_name: "addition",
    inputs: [
        { id: "input_0", name: "a", type: "float", value: 5 },
        { id: "input_1", name: "b", type: "float", value: 3 }
    ]
}
```

### Format de réponse API

```javascript
// Réponse du backend
{
    success: true,
    node_id: "node_123",
    outputs: [
        { index: 0, name: "result", value: 8, type: "float" }
    ],
    error: null  // ou message d'erreur si success=false
}
```

---

## Flux d'exécution détaillé

### Phase 1 : Initialisation (ToolBar → WorkflowGraph)

```javascript
// ToolBar.jsx - handleRun()
const handleRun = () => {
    // 1. Construire le modèle de graphe
    const { graph, edges } = buildGraphModel(nodes, edges);

    // 2. Lier le modèle au moteur
    engine.bindModel(graph, customEdges);

    // 3. Démarrer l'exécution
    engine.start();
};
```

#### buildGraphModel() en détail

```javascript
// WorkflowGraph.jsx
function buildGraphModel(nodesUI, edgesUI) {
    const graph = [];

    // 1. Identifier les custom nodes (exclure primitives)
    const customNodeIds = new Set(
        nodesUI.filter(n => n.type === 'custom').map(n => n.id)
    );

    // 2. Filtrer les edges entre custom nodes seulement
    const customEdges = edgesUI.filter(edge =>
        customNodeIds.has(edge.source) && customNodeIds.has(edge.target)
    );

    // 3. Construire chaque WFNode
    for (const nodeUI of nodesUI) {
        if (nodeUI.type !== 'custom') continue;

        // Children = custom nodes connectés en sortie
        const children = customEdges
            .filter(edge => edge.source === nodeUI.id)
            .map(edge => edge.target);

        // Deep clone pour éviter mutations
        const inputs = nodeUI.data.inputs.map(inp => ({ ...inp }));
        const outputs = nodeUI.data.outputs.map(out => ({ ...out }));

        graph.push(new WFNode({
            id: nodeUI.id,
            inputs,      // Valeurs déjà synchronisées via CustomHandle
            outputs,
            next: children,
            packageName: nodeUI.data.packageName,
            nodeName: nodeUI.data.nodeName,
            label: nodeUI.data.label
        }));
    }

    return { graph, edges: customEdges };
}
```

### Phase 2 : Démarrage (WorkflowEngine.start())

```javascript
// WorkflowEngine.jsx
async start() {
    // 1. Vérifications
    if (this.running) return;
    if (!this.model?.length) return;

    // 2. Initialisation
    this.running = true;
    this.results = {};

    // 3. Notification UI - tous les nodes passent en "queued"
    this._emit("workflow-start", { totalNodes: this.model.length });

    // 4. Trouver les root nodes
    const rootIds = getRootNodes(this.model);

    // 5. Exécuter les roots EN PARALLÈLE
    const rootPromises = rootIds.map(rootId => this._executeChain(rootId));
    await Promise.all(rootPromises);

    // 6. Notification fin
    this._emit("workflow-done", { success: true, results: this.results });
}
```

#### getRootNodes() - Identification des racines

```javascript
function getRootNodes(graph) {
    // Collecter tous les IDs qui sont enfants d'un autre node
    const allChildIds = new Set();
    for (const node of graph) {
        for (const childId of node.next) {
            allChildIds.add(childId);
        }
    }

    // Root = node qui n'est enfant de personne
    return graph
        .filter(node => !allChildIds.has(node.id))
        .map(node => node.id);
}
```

### Phase 3 : Exécution en chaîne (_executeChain)

```javascript
async _executeChain(nodeId) {
    // 1. Vérifier si workflow toujours actif
    if (!this.running) throw new Error("Workflow stopped");

    const node = this.model.find(n => n.id === nodeId);
    if (!node) return;

    // 2. RÉSOUDRE les inputs depuis les résultats précédents
    this._resolveInputsFromResults(node);

    // 3. EXÉCUTER le node
    const outputs = await this.executeNode(node);

    // 4. STOCKER les résultats pour les nodes suivants
    this.results[nodeId] = outputs;

    // 5. EXÉCUTER les enfants SÉQUENTIELLEMENT
    for (const childId of node.next) {
        await this._executeChain(childId);
    }
}
```

### Phase 4 : Résolution des inputs

```javascript
_resolveInputsFromResults(node) {
    // Trouver les edges entrantes vers ce node
    const incomingEdges = this.edges.filter(e => e.target === node.id);

    for (const edge of incomingEdges) {
        // Récupérer les résultats du node source
        const sourceResults = this.results[edge.source];
        if (!sourceResults) continue;

        // Parser l'index de l'output (ex: "output_0" → 0)
        const outputIndex = parseInt(edge.sourceHandle.match(/output_(\d+)/)[1]);
        const outputValue = sourceResults[outputIndex]?.value;

        // Mettre à jour l'input correspondant
        const input = node.inputs.find(i => i.id === edge.targetHandle);
        if (input) {
            input.value = outputValue;
        }
    }
}
```

### Phase 5 : Exécution d'un node (executeNode)

```javascript
async executeNode(node) {
    // 1. Notification: node démarre
    this._emit("node-start", node.id);

    try {
        // 2. Appel backend
        const outputs = await this._executeViaBackend(node);

        // 3. Notifications succès
        this._emit("node-result", { id: node.id, result: outputs });
        this._emit("node-done", node.id);

        return outputs;

    } catch (error) {
        // 4. Notification erreur + propagation
        this._emit("node-error", { id: node.id, error: error.message });
        throw error;  // Arrête le workflow
    }
}
```

---

## Communication Frontend-Backend

### Appel API (Frontend)

```javascript
// managerAPI.js
async function executeNode(nodeData) {
    const { nodeId, packageName, nodeName, inputs } = nodeData;

    return fetchJSON(`${BASE_URL}/execute/node`, "POST", {
        node_id: nodeId,
        package_name: packageName,
        node_name: nodeName,
        inputs: inputs.map(input => ({
            id: input.id,
            name: input.name,
            type: input.type,
            value: input.value
        }))
    });
}
```

### Endpoint Backend (manager.py)

```python
@router.post("/execute/node")
def execute_single_node(request: NodeExecutionRequest):
    # 1. Convertir inputs list → dict
    inputs_dict = {}
    for inp in request.inputs:
        key = inp.name if inp.name else inp.id
        inputs_dict[key] = inp.value

    # 2. Exécuter via subprocess
    result = OpenAleaRunner.execute_node(
        package_name=request.package_name,
        node_name=request.node_name,
        inputs=inputs_dict
    )

    # 3. Retourner la réponse
    return {
        "success": result.get("success", False),
        "node_id": request.node_id,
        "outputs": result.get("outputs", []),
        "error": result.get("error")
    }
```

### Exécution OpenAlea (run_workflow.py)

```python
def execute_node(package_name, node_name, inputs):
    from openalea.core.pkgmanager import PackageManager

    # 1. Initialiser PackageManager
    pm = PackageManager()
    pm.init()

    # 2. Récupérer le package et la factory
    pkg = pm.get(package_name)
    factory = pkg.get(node_name)

    # 3. Instancier le node
    node = factory.instantiate()

    # 4. Injecter les inputs
    for key, value in inputs.items():
        node.set_input(key, value)

    # 5. Exécuter
    node.eval()

    # 6. Sérialiser les outputs
    outputs = []
    for i, output_value in enumerate(node.outputs):
        outputs.append({
            "index": i,
            "name": factory.outputs[i].name,
            "value": serialize_value(output_value),
            "type": type(output_value).__name__
        })

    return {"success": True, "outputs": outputs}
```

---

## Gestion des états visuels

### États des nodes

| État | Couleur | Code | Signification |
|------|---------|------|---------------|
| `ready` | Bleu | `#1976d2` | Prêt, en attente |
| `queued` | Orange | `#ff9800` | Dans la file d'exécution |
| `running` | Violet | `#8e24aa` | En cours d'exécution |
| `done` | Vert | `#2b8a3e` | Terminé avec succès |
| `error` | Rouge | `#c62828` | Échec |

### Flux des états

```
                    workflow-start
                          │
                          ▼
    ┌─────────────────────────────────────────────┐
    │         Tous les nodes → "queued"           │
    └─────────────────────────────────────────────┘
                          │
                    node-start
                          │
                          ▼
    ┌─────────────────────────────────────────────┐
    │           Node actuel → "running"           │
    └─────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         node-done               node-error
              │                       │
              ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ Node → "done"   │     │ Node → "error"  │
    └─────────────────┘     │ STOP WORKFLOW   │
                            └─────────────────┘
```

### Mise à jour UI (FlowContext)

```javascript
// FlowContext.jsx - handleEngineEvent
const handleEngineEvent = useCallback((event, payload) => {
    switch (event) {
        case "workflow-start":
            resetAllNodesStatus("queued");
            break;

        case "node-start":
            updateNodeStatus(payload, "running");
            break;

        case "node-result":
            updateNodeOutputs(payload.id, payload.result);
            break;

        case "node-done":
            updateNodeStatus(payload, "done");
            break;

        case "node-error":
            updateNodeStatus(payload.id, "error");
            addLog(`Node "${nodeLabel}" failed: ${payload.error}`);
            break;

        case "stop":
            resetAllNodesStatus("ready");
            break;
    }
}, [...]);
```

---

## Propagation des données

### Mécanisme en deux couches

#### Couche 1 : CustomHandle (temps réel, UI)

Pour les connexions **Primitive → Custom Node** :

```
FloatNode (value=5)
    │
    └─► CustomHandle détecte via useNodesData()
            │
            └─► setNodes() met à jour input.value
                    │
                    └─► UI reflète la valeur
```

#### Couche 2 : WorkflowEngine (exécution)

Pour les connexions **Custom Node → Custom Node** :

```
NodeA exécute
    │
    └─► outputs = [{index: 0, value: 8}]
            │
            └─► results["nodeA"] = outputs
                    │
                    └─► NodeB._resolveInputsFromResults()
                            │
                            └─► NodeB.inputs[0].value = 8
                                    │
                                    └─► NodeB exécute avec value=8
```

### Exemple complet

```
┌─────────────┐
│ FloatNode   │
│  value: 5   │─────────────────────┐
└─────────────┘                     │
                                    ▼
┌─────────────┐              ┌─────────────┐
│ FloatNode   │              │   NodeA     │
│  value: 3   │─────────────►│  (addition) │
└─────────────┘              │             │
                             │ input_0: 5  │ ◄── via CustomHandle
                             │ input_1: 3  │ ◄── via CustomHandle
                             │             │
                             │ output_0: 8 │ ─────────┐
                             └─────────────┘          │
                                                      │
                             ┌─────────────┐          │
                             │   NodeB     │          │
                             │ (multiply)  │◄─────────┘
                             │             │
                             │ input_0: 8  │ ◄── via _resolveInputsFromResults()
                             │ input_1: 2  │ ◄── valeur par défaut
                             │             │
                             │ output_0: 16│
                             └─────────────┘
```

---

## Gestion des erreurs

### Types d'erreurs

| Source | Type | Comportement |
|--------|------|--------------|
| Frontend | Network error | Throw → node-error → stop |
| Backend | Package not found | Return error → throw → stop |
| Backend | Node not found | Return error → throw → stop |
| Backend | Execution error | Return error → throw → stop |
| Backend | Timeout | Return error → throw → stop |

### Propagation des erreurs

```javascript
// WorkflowEngine.jsx
async executeNode(node) {
    try {
        const outputs = await this._executeViaBackend(node);
        // ... succès
    } catch (error) {
        this._emit("node-error", { id: node.id, error: error.message });
        throw error;  // Propage l'erreur
    }
}

async _executeChain(nodeId) {
    // ...
    const outputs = await this.executeNode(node);  // Peut throw
    // Si throw → remonte jusqu'à start() → workflow-error
}

async start() {
    try {
        await Promise.all(rootPromises);
        this._emit("workflow-done", { success: true });
    } catch (error) {
        this._emit("workflow-error", { error: error.message });
    }
}
```

### Affichage dans l'UI

```javascript
// FlowContext.jsx
case "node-error": {
    const { id, error } = payload;
    updateNodeStatus(id, "error");  // → Bordure rouge

    const failedNode = nodesRef.current.find(n => n.id === id);
    const nodeLabel = failedNode?.data?.label || id;
    addLog(`Node "${nodeLabel}" failed: ${error}`, { nodeId: id, error });
    break;
}
```

---

## Diagrammes de séquence

### Exécution réussie

```
User          ToolBar       Engine        API          Backend       OpenAlea
  │              │            │            │              │              │
  │──Run────────►│            │            │              │              │
  │              │──build─────►            │              │              │
  │              │◄──{graph}──│            │              │              │
  │              │──start()──►│            │              │              │
  │              │            │──workflow──►              │              │
  │              │            │   start    │              │              │
  │◄─────────────│◄───────────│◄───────────│              │              │
  │ all nodes    │            │            │              │              │
  │ → queued     │            │            │              │              │
  │              │            │            │              │              │
  │              │            │──node──────►              │              │
  │              │            │  start     │              │              │
  │◄─────────────│◄───────────│◄───────────│              │              │
  │ node →       │            │            │              │              │
  │ running      │            │──POST──────────────────────►             │
  │              │            │ /execute   │              │──execute────►│
  │              │            │            │              │◄──outputs────│
  │              │            │◄──{outputs}────────────────│              │
  │              │            │            │              │              │
  │              │            │──node──────►              │              │
  │              │            │  result    │              │              │
  │◄─────────────│◄───────────│◄───────────│              │              │
  │ outputs      │            │            │              │              │
  │ updated      │            │──node──────►              │              │
  │              │            │  done      │              │              │
  │◄─────────────│◄───────────│◄───────────│              │              │
  │ node → done  │            │            │              │              │
  │              │            │            │              │              │
  │              │            │──workflow──►              │              │
  │              │            │   done     │              │              │
  │◄─────────────│◄───────────│◄───────────│              │              │
  │ complete     │            │            │              │              │
```

### Exécution avec erreur

```
User          ToolBar       Engine        API          Backend
  │              │            │            │              │
  │──Run────────►│            │            │              │
  │              │──start()──►│            │              │
  │              │            │──POST──────────────────────►
  │              │            │            │              │
  │              │            │◄──{error}──────────────────│
  │              │            │            │              │
  │              │            │──node──────►              │
  │              │            │  error     │              │
  │◄─────────────│◄───────────│◄───────────│              │
  │ node → error │            │            │              │
  │ (red border) │            │            │              │
  │              │            │            │              │
  │              │            │──workflow──►              │
  │              │            │   error    │              │
  │◄─────────────│◄───────────│◄───────────│              │
  │ log: "Node   │            │            │              │
  │ X failed..." │            │            │              │
```

---

## Résumé

Le WorkflowEngine de WebAlea implémente un système d'exécution robuste avec :

1. **Construction du graphe** via `buildGraphModel()` - filtre les primitives, garde les custom nodes
2. **Exécution parallèle** des roots via `Promise.all()`
3. **Exécution séquentielle** des enfants via boucle `for...of await`
4. **Propagation des données** via `_resolveInputsFromResults()` et stockage dans `results{}`
5. **Feedback temps réel** via système d'événements `_emit()`
6. **Arrêt sur erreur** via `throw` qui remonte et déclenche `workflow-error`

---

## Contrôle d'arrêt avec AbortController

Le WorkflowEngine utilise un `AbortController` natif JavaScript pour permettre l'arrêt propre d'un workflow en cours d'exécution.

### Mécanisme

```javascript
// WorkflowEngine.jsx
class WorkflowEngine {
    constructor() {
        this.abortController = null;  // Initialisé à null
        // ...
    }

    async start() {
        this.abortController = new AbortController();
        // ...
    }

    stop() {
        if (!this.running) return;
        this.running = false;

        if (this.abortController) {
            this.abortController.abort();  // Signal d'arrêt
        }

        this._emit("stop");
    }
}
```

### Vérification dans les chaînes d'exécution

```javascript
async _executeChain(nodeId) {
    // Vérification systématique avant chaque node
    if (!this.running) {
        throw new Error("Workflow stopped");
    }
    // ... exécution du node

    // Vérification avant chaque enfant
    for (const childId of node.next) {
        if (!this.running) {
            throw new Error("Workflow stopped");
        }
        await this._executeChain(childId);
    }
}
```

---

## Système de listeners

### Architecture des événements

Le WorkflowEngine implémente un pattern Observer pour notifier les composants UI des changements d'état.

```javascript
class WorkflowEngine {
    constructor() {
        this.listeners = [];  // Liste des callbacks enregistrés
    }

    // Enregistrer un listener
    onUpdate(cb) {
        this.listeners.push(cb);
    }

    // Émettre un événement à tous les listeners
    _emit(event, payload) {
        this.listeners.forEach(listener => {
            try {
                listener(event, payload);
            } catch (e) {
                console.error("WorkflowEngine: Listener error:", e);
            }
        });
    }
}
```

### Gestion des listeners dans FlowContext

```javascript
// FlowContext.jsx
const engineRef = useRef(null);
if (!engineRef.current) {
    engineRef.current = new WorkflowEngine();
}

// Reset et mise à jour des listeners quand le handler change
useEffect(() => {
    const engine = engineRef.current;
    engine.listeners = [];  // ⚠️ Reset complet pour éviter les duplications
    engine.onUpdate(handleEngineEvent);
}, [handleEngineEvent]);
```

### Liste complète des événements

| Événement | Payload | Émis par |
|-----------|---------|----------|
| `workflow-start` | `{ totalNodes: number }` | `start()` |
| `workflow-done` | `{ success: boolean, results: object }` | `start()` |
| `workflow-error` | `{ error: string }` | `start()` (catch) |
| `node-start` | `nodeId: string` | `executeNode()` |
| `node-result` | `{ id: string, result: array }` | `executeNode()` |
| `node-done` | `nodeId: string` | `executeNode()` |
| `node-error` | `{ id: string, error: string }` | `executeNode()` |
| `stop` | `undefined` | `stop()` |

---

## Persistance localStorage

### Sauvegarde automatique

Le FlowContext sauvegarde automatiquement l'état du workflow dans le localStorage à chaque modification.

```javascript
// FlowContext.jsx
const FLOW_KEY_NODES = 'reactFlowCacheNodes';
const FLOW_KEY_EDGES = 'reactFlowCacheEdges';

// Chargement initial
const getInitialState = (key) => {
    try {
        const savedState = localStorage.getItem(key);
        return savedState ? JSON.parse(savedState) : [];
    } catch (error) {
        console.error(`Erreur de chargement du localStorage pour ${key}:`, error);
        return [];
    }
};

// Sauvegarde réactive
useEffect(() => {
    if (edges) {
        localStorage.setItem(FLOW_KEY_EDGES, JSON.stringify(edges));
    }
    if (nodes && nodes.length > 0) {
        localStorage.setItem(FLOW_KEY_NODES, JSON.stringify(nodes));
    } else if (nodes && nodes.length === 0) {
        localStorage.setItem(FLOW_KEY_NODES, '[]');
    }
}, [nodes, edges]);
```

### Format stocké

```json
{
  "reactFlowCacheNodes": [
    {
      "id": "node_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "addition",
        "packageName": "openalea.math",
        "nodeName": "addition",
        "inputs": [...],
        "outputs": [...],
        "status": "ready"
      }
    }
  ],
  "reactFlowCacheEdges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": "output_0",
      "targetHandle": "input_0"
    }
  ]
}
```

---

## CustomHandle - Propagation temps réel détaillée

### Mécanisme du flag `fromConnection`

Le CustomHandle utilise un flag `fromConnection` pour distinguer les valeurs provenant d'une connexion de celles saisies manuellement.

```javascript
// CustomHandle.jsx
useEffect(() => {
    if (!isInput || !parentNodeId) return;

    // Cas 1: Connexion active avec valeur
    if (connection && linkedValue !== undefined) {
        const newValue = linkedValue?.value;

        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== parentNodeId) return node;

                const updatedInputs = (node.data.inputs || []).map((input) => {
                    if (input.id === id) {
                        // Mise à jour avec flag fromConnection
                        if (input.value !== newValue || !input.fromConnection) {
                            return { ...input, value: newValue, fromConnection: true };
                        }
                    }
                    return input;
                });

                return {
                    ...node,
                    data: { ...node.data, inputs: updatedInputs }
                };
            })
        );
    }
    // Cas 2: Connexion supprimée - retirer le flag
    else if (!connection) {
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== parentNodeId) return node;

                const updatedInputs = (node.data.inputs || []).map((input) => {
                    if (input.id === id && input.fromConnection) {
                        const { fromConnection, ...rest } = input;
                        return rest;  // Garde la valeur, retire le flag
                    }
                    return input;
                });

                return {
                    ...node,
                    data: { ...node.data, inputs: updatedInputs }
                };
            })
        );
    }
}, [linkedValue, connection, onChange, isInput, parentNodeId, id, setNodes]);
```

### Hooks ReactFlow utilisés

| Hook | Utilisation |
|------|-------------|
| `useNodeId()` | Récupère l'ID du node parent |
| `useNodeConnections()` | Récupère les connexions du handle |
| `useNodesData()` | Récupère les données du node connecté |

---

## Système de couleurs des types

### Palette typeColors

```javascript
// CustomHandle.jsx
const typeColors = {
    string: "#1976d2",   // Bleu
    float: "#8e24aa",    // Violet
    int: "#6a1b9a",      // Violet foncé
    boolean: "#2b8a3e",  // Vert
    enum: "#ff6f00",     // Orange
    file: "#5d4037",     // Marron
    path: "#5d4037",     // Marron
    array: "#00838f",    // Cyan
    object: "#4527a0",   // Indigo
    color: "#c62828",    // Rouge
    function: "#558b2f", // Vert olive
    any: "#757575",      // Gris
    none: "#757575",     // Gris
    default: "#555",     // Gris foncé
};
```

### Résolution des couleurs

```javascript
function getColorFromType(typeOrInterface) {
    if (!typeOrInterface) return typeColors.any;

    const t = typeOrInterface.toLowerCase();

    // Match direct (types frontend)
    if (typeColors[t]) return typeColors[t];

    // Map OpenAlea interfaces
    if (t.includes("float") || t.includes("ifloat")) return typeColors.float;
    if (t.includes("int") || t.includes("iint")) return typeColors.int;
    if (t.includes("str") || t.includes("istr")) return typeColors.string;
    if (t.includes("bool") || t.includes("ibool")) return typeColors.boolean;
    if (t.includes("enum")) return typeColors.enum;
    if (t.includes("file") || t.includes("path") || t.includes("dir")) return typeColors.file;
    if (t.includes("sequence") || t.includes("tuple")) return typeColors.array;
    if (t.includes("dict")) return typeColors.object;
    if (t.includes("rgb") || t.includes("color")) return typeColors.color;
    if (t.includes("function")) return typeColors.function;

    return typeColors.default;
}
```

---

## Validation des connexions

### Vérification de compatibilité des types

```javascript
// FlowContext.jsx - onConnect
const onConnect = useCallback((params) => {
    // Empêcher les self-loops
    if (params.source === params.target) {
        return;
    }

    const { source, sourceHandle, target, targetHandle } = params;

    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);

    if (!sourceNode || !targetNode) return;

    const output = sourceNode.data.outputs.find(o => o.id === sourceHandle);
    const input = targetNode.data.inputs.find(i => i.id === targetHandle);

    // Vérification des types
    const outputType = output?.type || 'any';
    const inputType = input?.type || 'any';

    const isCompatible = outputType === inputType ||
                         outputType === 'any' ||
                         inputType === 'any';

    if (!isCompatible) {
        addLog("❌ Type mismatch", {
            from: `${source}.${sourceHandle} (${outputType})`,
            to: `${target}.${targetHandle} (${inputType})`
        });
        return; // ❗ Connexion refusée
    }

    // ✅ Connexion acceptée
    setEdges((eds) => addEdge(params, eds));
    addLog("Edge added", { params });
}, [nodes, setEdges, addLog]);
```

### Règles de compatibilité

| Output Type | Input Type | Compatible |
|-------------|------------|------------|
| `float` | `float` | ✅ |
| `float` | `string` | ❌ |
| `any` | `*` | ✅ |
| `*` | `any` | ✅ |
| `float` | `int` | ❌ (strict) |

---

## Structure complète des nodes ReactFlow

### Format nodeUI complet

```javascript
{
    // Identifiant unique du node
    id: "node_1709142857392",

    // Type de node (détermine le composant de rendu)
    type: "custom",  // ou "float", "string", "boolean"

    // Position sur le canvas
    position: { x: 250, y: 150 },

    // Données métier
    data: {
        // Informations d'affichage
        label: "addition",
        description: "Add two numbers",

        // Référence OpenAlea
        packageName: "openalea.math",
        nodeName: "addition",

        // Inputs avec valeurs
        inputs: [
            {
                id: "input_0",
                name: "a",
                type: "float",
                interface: "IFloat",
                value: 5,
                optional: false,
                desc: "First operand",
                fromConnection: false  // Flag de connexion
            },
            {
                id: "input_1",
                name: "b",
                type: "float",
                interface: "IFloat",
                value: 3,
                optional: false,
                desc: "Second operand"
            }
        ],

        // Outputs avec résultats
        outputs: [
            {
                id: "output_0",
                name: "result",
                type: "float",
                interface: "IFloat",
                value: null,  // Rempli après exécution
                desc: "Sum result"
            }
        ],

        // État visuel (géré par FlowContext)
        status: "ready"  // ready, queued, running, done, error
    },

    // Métadonnées ReactFlow (optionnel)
    selected: false,
    dragging: false
}
```

### Nodes primitifs (float/string/boolean)

```javascript
// FloatNode
{
    id: "float_1709142900000",
    type: "float",
    position: { x: 50, y: 100 },
    data: {
        label: "Float",
        value: 5.0,
        outputs: [
            {
                id: "output_0",
                name: "value",
                type: "float",
                value: 5.0
            }
        ]
    }
}
```

---

## FlowContext - Fonctions helpers détaillées

### updateNodeStatus

Met à jour le statut visuel d'un node de manière immutable.

```javascript
const updateNodeStatus = useCallback((nodeId, status) => {
    setNodes((prevNodes) =>
        prevNodes.map((node) =>
            node.id === nodeId
                ? { ...node, data: { ...node.data, status } }
                : node
        )
    );
}, [setNodes]);
```

### updateNodeOutputs

Met à jour les outputs d'un node après exécution.

```javascript
// Format attendu: [{index, name, value, type}, ...]
const updateNodeOutputs = useCallback((nodeId, outputs) => {
    setNodes((prevNodes) =>
        prevNodes.map((node) => {
            if (node.id !== nodeId) return node;

            const currentOutputs = node.data.outputs || [];
            let newOutputs;

            if (!Array.isArray(outputs)) {
                // Si outputs n'est pas un tableau → premier output
                newOutputs = currentOutputs.map((output, index) =>
                    index === 0 ? { ...output, value: outputs } : output
                );
            } else {
                // outputs est un tableau
                newOutputs = currentOutputs.map((output, idx) => {
                    // Match par index, id, ou name
                    const matchingResult = outputs.find((r) =>
                        r.index === idx || r.id === output.id || r.name === output.name
                    );
                    if (matchingResult) {
                        return {
                            ...output,
                            value: matchingResult.value,
                            type: matchingResult.type || output.type
                        };
                    }
                    return output;
                });
            }

            return {
                ...node,
                data: { ...node.data, outputs: newOutputs }
            };
        })
    );
}, [setNodes]);
```

### resetAllNodesStatus

Réinitialise le statut de tous les nodes.

```javascript
const resetAllNodesStatus = useCallback((status) => {
    setNodes((prevNodes) =>
        prevNodes.map((node) => ({
            ...node,
            data: { ...node.data, status }
        }))
    );
}, [setNodes]);
```

---

## Export/Import de workflows

### Export (ToolBar.jsx)

```javascript
const handleExport = () => {
    const data = {
        nodes: nodes,
        edges: edges
    };

    try {
        const dataStr = "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(data, null, 2));

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "workflow_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        addLog("Workflow exported", { nodes: nodes.length, edges: edges.length });
    } catch (error) {
        alert("Erreur lors de l'exportation du workflow : " + error.message);
    }
};
```

### Import

```javascript
const handleImportData = (data) => {
    try {
        if (!data.nodes || !data.edges) {
            throw new Error("Données invalides : noeuds ou connexions manquants.");
        }

        setNodesAndEdges(data.nodes || [], data.edges || []);
        setShowImportModal(false);

        addLog("Workflow imported", {
            nodes: data.nodes.length,
            edges: data.edges.length
        });
    } catch(error) {
        alert("Erreur lors de l'importation du workflow : " + error.message);
    }
};
```

### Format du fichier exporté

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": { ... }
    }
  ],
  "edges": [
    {
      "id": "reactflow__edge-node_1output_0-node_2input_0",
      "source": "node_1",
      "sourceHandle": "output_0",
      "target": "node_2",
      "targetHandle": "input_0"
    }
  ]
}
```

---

## Sérialisation Python (Backend)

### Fonction serialize_value

Convertit les objets Python en format JSON-compatible.

```python
# run_workflow.py
def serialize_value(value):
    """Serialize a Python value to JSON-compatible format."""

    # Valeurs nulles
    if value is None:
        return None

    # Types primitifs JSON
    if isinstance(value, (int, float, str, bool)):
        return value

    # Collections
    if isinstance(value, (list, tuple)):
        return [serialize_value(v) for v in value]

    if isinstance(value, dict):
        return {str(k): serialize_value(v) for k, v in value.items()}

    # Arrays NumPy
    if hasattr(value, 'tolist'):
        return value.tolist()

    # Fallback: représentation string
    return str(value)
```

### Types supportés

| Type Python | Conversion JSON |
|-------------|-----------------|
| `None` | `null` |
| `int`, `float` | number |
| `str` | string |
| `bool` | boolean |
| `list`, `tuple` | array (récursif) |
| `dict` | object (récursif) |
| `numpy.ndarray` | array via `.tolist()` |
| Autres | `str(value)` |

---

## Configuration timeout Backend

### OpenAleaRunner timeout

```python
# openalea_runner.py
@staticmethod
def execute_node(
    package_name: str,
    node_name: str,
    inputs: dict,
    timeout: int = 60  # ⚠️ 60 secondes par défaut
) -> dict:
    """Execute a single OpenAlea node."""

    try:
        result = subprocess.run(
            ["python3", OpenAleaRunner.SCRIPT_PATH, json.dumps(node_info)],
            capture_output=True,
            text=True,
            timeout=timeout  # ← Timeout appliqué ici
        )
        # ...

    except subprocess.TimeoutExpired:
        logging.error("Node execution timed out after %d seconds", timeout)
        return {
            "success": False,
            "error": f"Execution timed out after {timeout} seconds"
        }
```

### Gestion des erreurs timeout

| Situation | Résultat |
|-----------|----------|
| Exécution < 60s | Résultat normal |
| Exécution > 60s | `TimeoutExpired` → error |
| Python3 non trouvé | `FileNotFoundError` → error |

---

## Mapping NodesTypes → Composants

### Définition dans FlowContext

```javascript
// FlowContext.jsx
import CustomNode from '../ui/CustomNode.jsx';
import FloatNode from '../ui/type/FloatNode.jsx';
import StringNode from '../ui/type/StringNode.jsx';
import BoolNode from '../ui/type/BoolNode.jsx';

const nodesTypes = {
    custom: CustomNode,    // Nodes OpenAlea
    float: FloatNode,      // Input numérique
    string: StringNode,    // Input texte
    boolean: BoolNode,     // Input booléen
};
```

### Utilisation dans ReactFlow

```jsx
// Workspace.jsx (exemple)
<ReactFlow
    nodes={nodes}
    edges={edges}
    nodeTypes={nodesTypes}  // ← Mapping utilisé ici
    // ...
/>
```

### Correspondance type → composant

| `node.type` | Composant | Rôle |
|-------------|-----------|------|
| `"custom"` | `CustomNode` | Node OpenAlea avec inputs/outputs dynamiques |
| `"float"` | `FloatNode` | Primitive: valeur numérique |
| `"string"` | `StringNode` | Primitive: valeur texte |
| `"boolean"` | `BoolNode` | Primitive: valeur booléenne |

---

## Gestion des références avec nodesRef

### Problème résolu

Les callbacks définis avec `useCallback` capturent les valeurs au moment de leur création. Pour accéder aux valeurs les plus récentes de `nodes`, on utilise une ref.

### Implémentation

```javascript
// FlowContext.jsx

// Ref pour accéder aux dernières valeurs des nodes
const nodesRef = useRef(nodes);

// Synchronisation de la ref avec l'état
useEffect(() => {
    nodesRef.current = nodes;
}, [nodes]);

// Utilisation dans les callbacks
const handleEngineEvent = useCallback((event, payload) => {
    // ...
    case "node-error": {
        const { id, error } = payload;
        // ✅ Utilise nodesRef pour avoir la dernière valeur
        const failedNode = nodesRef.current.find(n => n.id === id);
        const nodeLabel = failedNode?.data?.label || id;
        addLog(`Node "${nodeLabel}" failed: ${error}`);
        break;
    }
}, [/* ... */]);

const onNodeExecute = useCallback((nodeId) => {
    // ✅ Utilise nodesRef au lieu de nodes
    const currentNodes = nodesRef.current;
    const curNode = currentNodes.find(n => n.id === nodeId);
    // ...
}, [engine, addLog]);
```

### Pourquoi useRef ?

| Approche | Problème |
|----------|----------|
| `useCallback([nodes])` | Re-création du callback à chaque changement de nodes |
| `useRef` | Accès à la valeur actuelle sans re-création |

---

## API managerAPI.js - Référence complète

### Fonctions disponibles

| Fonction | Méthode | Endpoint | Description |
|----------|---------|----------|-------------|
| `fetchPackageList()` | GET | `/` | Liste tous les packages Conda |
| `fetchLatestPackageVersions()` | GET | `/latest` | Dernières versions des packages |
| `installPackages(packages, envName)` | POST | `/install` | Installe des packages |
| `fetchInstalledOpenAleaPackages()` | GET | `/installed` | Packages OpenAlea installés |
| `fetchWraleaPackages()` | GET | `/wralea` | Packages avec nodes visuels |
| `fetchPackageNodes(packageName)` | GET | `/installed/{name}` | Nodes d'un package |
| `executeNode(nodeData)` | POST | `/execute/node` | Exécute un node |

### Fonction executeNode détaillée

```javascript
/**
 * Execute a single OpenAlea node with given inputs
 * @param {Object} nodeData - Node execution data
 * @param {string} nodeData.nodeId - Unique node identifier
 * @param {string} nodeData.packageName - OpenAlea package name
 * @param {string} nodeData.nodeName - Node name within the package
 * @param {Array} nodeData.inputs - Array of input objects {id, name, type, value}
 * @returns {Promise<Object>} Execution result
 */
export async function executeNode(nodeData) {
    const { nodeId, packageName, nodeName, inputs } = nodeData;

    return fetchJSON(`${BASE_URL}/execute/node`, "POST", {
        node_id: nodeId,
        package_name: packageName,
        node_name: nodeName,
        inputs: inputs.map(input => ({
            id: input.id,
            name: input.name,
            type: input.type,
            value: input.value
        }))
    });
}
```

---

## Annexe : Diagramme de flux complet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW EXECUTION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks RUN
       │
       ▼
┌──────────────────┐
│    ToolBar       │
│  handleRun()     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ buildGraphModel  │ ─────► Filtre primitives
│   (nodes,edges)  │ ─────► Clone inputs/outputs
└────────┬─────────┘ ─────► Identifie children
         │
         ▼
┌──────────────────┐
│ engine.bindModel │
│ (graph, edges)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  engine.start()  │
└────────┬─────────┘
         │
         ├──► emit("workflow-start") ──► All nodes → "queued"
         │
         ▼
┌──────────────────┐
│  getRootNodes()  │ ──► Nodes sans parents
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│          Promise.all(rootPromises)            │
│  ┌────────────────────────────────────────┐  │
│  │ _executeChain(root1)  _executeChain(root2)│ │  (PARALLÈLE)
│  └─────────────┬──────────────────┬───────┘  │
└────────────────┼──────────────────┼──────────┘
                 │                  │
                 ▼                  ▼
         ┌───────────────┐  ┌───────────────┐
         │_resolveInputs │  │_resolveInputs │
         │FromResults()  │  │FromResults()  │
         └───────┬───────┘  └───────┬───────┘
                 │                  │
                 ▼                  ▼
         ┌───────────────┐  ┌───────────────┐
         │ executeNode() │  │ executeNode() │
         │ emit(start)   │  │ emit(start)   │
         └───────┬───────┘  └───────┬───────┘
                 │                  │
                 ▼                  ▼
         ┌───────────────────────────────────┐
         │      POST /api/v1/execute/node     │
         │                                    │
         │  ┌─────────────────────────────┐  │
         │  │ OpenAleaRunner.execute_node │  │
         │  │     (subprocess)            │  │
         │  └─────────────┬───────────────┘  │
         │                │                  │
         │                ▼                  │
         │  ┌─────────────────────────────┐  │
         │  │    run_workflow.py          │  │
         │  │  - PackageManager.init()    │  │
         │  │  - factory.instantiate()    │  │
         │  │  - node.set_input()         │  │
         │  │  - node.eval()              │  │
         │  │  - serialize_value()        │  │
         │  └─────────────┬───────────────┘  │
         │                │                  │
         └────────────────┼──────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Response  │
                   │  {success,  │
                   │   outputs}  │
                   └──────┬──────┘
                          │
                          ▼
                  emit("node-result")
                  emit("node-done")
                          │
                          ▼
                   ┌─────────────┐
                   │   Store     │
                   │  results    │
                   └──────┬──────┘
                          │
                          ▼
                 for (childId of node.next)
                          │
                          ▼   (SÉQUENTIEL)
                 _executeChain(childId)
                          │
                          ▼
                 ... (repeat for all children)
                          │
                          ▼
              emit("workflow-done")
```

---

*Document créé le 30/12/2024 - Mis à jour le 31/12/2024*
