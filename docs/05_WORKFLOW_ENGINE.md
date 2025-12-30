# WebAlea - Documentation du Workflow Engine

> Documentation technique du système d'exécution de workflows

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des composants](#architecture-des-composants)
3. [Modèles de données](#modèles-de-données)
4. [Flux d'exécution détaillé](#flux-dexécution-détaillé)
5. [Communication Frontend-Backend](#communication-frontend-backend)
6. [Gestion des états visuels](#gestion-des-états-visuels)
7. [Propagation des données](#propagation-des-données)
8. [Gestion des erreurs](#gestion-des-erreurs)
9. [Diagrammes de séquence](#diagrammes-de-séquence)

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

*Document créé le 30/12/2024*
