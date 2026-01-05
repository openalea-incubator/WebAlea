# WebAlea - Corrections & Améliorations Nécessaires

> Documentation générée le 30/12/2024

## Table des matières

1. [Corrections Critiques](#corrections-critiques)
2. [Améliorations Backend](#améliorations-backend)
3. [Améliorations Frontend](#améliorations-frontend)
4. [Refactorisation](#refactorisation)
5. [Sécurité](#sécurité)
6. [Performance](#performance)
7. [Priorités](#priorités)

---

## Corrections Critiques

### 1. Injection des Valeurs d'Input (CRITIQUE)

**Problème:** Les valeurs d'input définies dans le frontend ne sont jamais appliquées aux nodes lors de l'exécution.

**Fichier:** `webAleaBack/model/openalea/runnable/run_workflow.py`

**Code actuel:**
```python
def add_node_to_workflow(pkg_manager, workflow, node_info):
    package = pkg_manager.get(node_info["package"])
    node_factory = package.get(node_info["name"])
    workflow.add_node(node_factory)  # ← Inputs non définis!
```

**Solution:**
```python
def add_node_to_workflow(pkg_manager, workflow, node_info):
    package = pkg_manager.get(node_info["package"])
    node_factory = package.get(node_info["name"])
    node = node_factory.instantiate()

    # Injecter les valeurs d'input
    if "inputs" in node_info:
        for input_name, input_value in node_info["inputs"].items():
            if input_name in node.inputs:
                node.inputs[input_name].val = input_value

    workflow.add_node(node)
    return node
```

---

### 2. Exécution Multi-Nodes avec Edges (CRITIQUE)

**Problème:** Le système ne supporte que l'exécution d'un node unique. Les edges (connexions) sont ignorés.

**Fichiers concernés:**
- `webAleaBack/api/v1/endpoints/manager.py:121-125` - WorkflowExecutionRequest défini mais non utilisé
- `webAleaBack/model/openalea/runnable/run_workflow.py` - Pas de gestion des connexions

**Solution - Nouveau endpoint:**

```python
@router.post("/execute/workflow")
async def execute_workflow(request: WorkflowExecutionRequest):
    """
    Exécute un workflow complet avec connexions.
    """
    workflow_info = {
        "type": request.workflow_type,
        "nodes": request.nodes,
        "edges": request.edges  # Connexions entre nodes
    }

    result = await run_in_threadpool(
        OpenAleaRunner.run_workflow,
        workflow_info
    )
    return result
```

**Solution - run_workflow.py:**

```python
def build_connected_workflow(workflow, nodes_map, edges):
    """Connecte les nodes selon les edges."""
    for edge in edges:
        source_node = nodes_map[edge["source"]]
        target_node = nodes_map[edge["target"]]
        source_port = edge["sourceHandle"]
        target_port = edge["targetHandle"]

        # Créer la connexion dans le DataFlow
        workflow.connect(
            source_node, source_port,
            target_node, target_port
        )
```

---

### 3. Propagation des Données Frontend (CRITIQUE)

**Problème:** Les outputs d'un node ne sont pas transmis aux inputs des nodes connectés.

**Fichier:** `webAleaFront/src/features/workspace/ui/CustomHandle.jsx`

**Code actuel (lecture seule):**
```javascript
useEffect(() => {
    if (onChange && linkedValue) {
        onChange(linkedValue.value);  // ← Callback existe mais non utilisé
    }
}, [linkedValue, onChange]);
```

**Solution - FlowContext.jsx:**

```javascript
// Ajouter une fonction de propagation
const propagateOutputToInputs = useCallback((sourceNodeId, outputId, value) => {
    // Trouver toutes les edges connectées à cet output
    const connectedEdges = edges.filter(
        e => e.source === sourceNodeId && e.sourceHandle === outputId
    );

    // Mettre à jour les inputs des nodes cibles
    setNodes(prevNodes => prevNodes.map(node => {
        const relevantEdge = connectedEdges.find(e => e.target === node.id);
        if (!relevantEdge) return node;

        const updatedInputs = node.data.inputs.map(input =>
            input.id === relevantEdge.targetHandle
                ? { ...input, value }
                : input
        );

        return { ...node, data: { ...node.data, inputs: updatedInputs } };
    }));
}, [edges, setNodes]);
```

---

### 4. Inclusion des Nodes Primitifs dans l'Exécution (CRITIQUE)

**Problème:** Les nodes primitifs (float, string, boolean) ne sont pas inclus dans le graphe d'exécution.

**Fichier:** `webAleaFront/src/features/workspace/model/WorkflowGraph.jsx`

**Code actuel:**
```javascript
export function buildGraphModel(nodes, edges) {
    const model = {};
    nodes.forEach(n => {
        if (n.type === "custom") {  // ← Exclut les primitifs!
            model[n.id] = new WFNode({...});
        }
    });
    return model;
}
```

**Solution:**
```javascript
export function buildGraphModel(nodes, edges) {
    const model = {};
    nodes.forEach(n => {
        // Inclure TOUS les types de nodes
        model[n.id] = new WFNode({
            id: n.id,
            type: n.type,
            inputs: n.data.inputs || [],
            outputs: n.data.outputs || [],
            packageName: n.data.packageName || null,
            nodeName: n.data.nodeName || null,
            label: n.data.label,
            // Marquer si c'est un node primitif (exécution locale)
            isPrimitive: ["float", "string", "boolean"].includes(n.type)
        });
    });

    // Calculer les connexions (next) pour TOUS les nodes
    edges.forEach(edge => {
        if (model[edge.source]) {
            model[edge.source].next.push(edge.target);
        }
    });

    return model;
}
```

---

## Améliorations Backend

### 1. Support Asynchrone

**Problème:** Toutes les opérations sont synchrones et bloquantes.

**Solution:**

```python
# main.py - Ajouter support async
from fastapi import BackgroundTasks
from concurrent.futures import ThreadPoolExecutor
import asyncio

executor = ThreadPoolExecutor(max_workers=4)

async def run_in_executor(func, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, func, *args)

# manager.py
@router.post("/execute/node")
async def execute_single_node(request: NodeExecutionRequest):
    result = await run_in_executor(
        OpenAleaRunner.run,
        "dataflow",
        [node_info]
    )
    return {"success": True, "result": result}
```

### 2. Timeout sur Subprocess

**Fichier:** `webAleaBack/model/openalea/openalea_runner.py`

```python
# Actuel
result = subprocess.run(command, stdout=subprocess.PIPE, text=True, check=True)

# Amélioré
SUBPROCESS_TIMEOUT = 60  # secondes

try:
    result = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,  # Capturer stderr
        text=True,
        check=True,
        timeout=SUBPROCESS_TIMEOUT
    )
except subprocess.TimeoutExpired:
    raise HTTPException(504, "Node execution timeout")
except subprocess.CalledProcessError as e:
    raise HTTPException(500, f"Execution error: {e.stderr}")
```

### 3. Cache des Packages

```python
# Nouveau fichier: webAleaBack/model/cache.py
from functools import lru_cache
from datetime import datetime, timedelta

class PackageCache:
    def __init__(self, ttl_minutes=60):
        self._cache = {}
        self._ttl = timedelta(minutes=ttl_minutes)

    def get(self, key):
        if key in self._cache:
            value, timestamp = self._cache[key]
            if datetime.now() - timestamp < self._ttl:
                return value
        return None

    def set(self, key, value):
        self._cache[key] = (value, datetime.now())

package_cache = PackageCache()

# Utilisation dans manager.py
@router.get("/installed/{package_name}")
def fetch_package_nodes(package_name: str):
    cached = package_cache.get(package_name)
    if cached:
        return cached

    description = OpenAleaInspector.describe_openalea_package(package_name)
    package_cache.set(package_name, description)
    return description
```

### 4. Préservation des Types de Sortie

**Fichier:** `webAleaBack/model/openalea/runnable/run_workflow.py`

```python
# Actuel - perd l'information de type
node_outputs[output_name] = str(output_value)

# Amélioré - préserve le type
def serialize_value(value):
    """Sérialise une valeur en préservant le type."""
    if value is None:
        return {"type": "null", "value": None}
    elif isinstance(value, bool):
        return {"type": "boolean", "value": value}
    elif isinstance(value, int):
        return {"type": "integer", "value": value}
    elif isinstance(value, float):
        return {"type": "float", "value": value}
    elif isinstance(value, str):
        return {"type": "string", "value": value}
    elif isinstance(value, (list, tuple)):
        return {"type": "array", "value": [serialize_value(v) for v in value]}
    elif isinstance(value, dict):
        return {"type": "object", "value": {k: serialize_value(v) for k, v in value.items()}}
    else:
        # Fallback pour types complexes (géométrie, etc.)
        return {"type": "complex", "value": str(value), "class": type(value).__name__}
```

---

## Améliorations Frontend

### 1. Gestion Multi-Root Nodes

**Fichier:** `webAleaFront/src/features/workspace/engine/WorkflowEngine.jsx`

```javascript
// Actuel - exécution séquentielle
async start() {
    const roots = getRootNodes(this.graphModel);
    for (const rootId of roots) {
        await this._executeChain(rootId);  // Séquentiel
    }
}

// Amélioré - exécution parallèle des branches indépendantes
async start() {
    this._emit("start");
    const roots = getRootNodes(this.graphModel);

    // Exécuter tous les roots en parallèle
    const executions = roots.map(rootId => this._executeChain(rootId));

    try {
        await Promise.all(executions);
        this._emit("complete");
    } catch (error) {
        this._emit("error", { error: error.message });
    }
}
```

### 2. Suivi de Progression

```javascript
// Nouveau: ExecutionTracker
class ExecutionTracker {
    constructor() {
        this.totalNodes = 0;
        this.completedNodes = 0;
        this.failedNodes = 0;
        this.status = 'idle'; // idle, running, completed, failed
    }

    start(totalNodes) {
        this.totalNodes = totalNodes;
        this.completedNodes = 0;
        this.failedNodes = 0;
        this.status = 'running';
    }

    nodeCompleted() {
        this.completedNodes++;
        if (this.completedNodes + this.failedNodes >= this.totalNodes) {
            this.status = this.failedNodes > 0 ? 'completed_with_errors' : 'completed';
        }
    }

    nodeFailed() {
        this.failedNodes++;
    }

    getProgress() {
        return {
            total: this.totalNodes,
            completed: this.completedNodes,
            failed: this.failedNodes,
            percent: Math.round((this.completedNodes / this.totalNodes) * 100),
            status: this.status
        };
    }
}
```

### 3. Validation du Workflow

```javascript
// Nouveau fichier: src/features/workspace/utils/WorkflowValidator.js

export function validateWorkflow(nodes, edges) {
    const errors = [];
    const warnings = [];

    // 1. Vérifier les cycles
    const hasCycle = detectCycle(nodes, edges);
    if (hasCycle) {
        errors.push({ type: 'cycle', message: 'Le workflow contient un cycle' });
    }

    // 2. Vérifier les inputs non connectés obligatoires
    nodes.forEach(node => {
        node.data.inputs?.forEach(input => {
            if (!input.optional && !input.value) {
                const isConnected = edges.some(
                    e => e.target === node.id && e.targetHandle === input.id
                );
                if (!isConnected) {
                    errors.push({
                        type: 'unconnected_input',
                        nodeId: node.id,
                        inputId: input.id,
                        message: `Input "${input.name}" du node "${node.data.label}" non connecté`
                    });
                }
            }
        });
    });

    // 3. Vérifier les types incompatibles
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        const sourceOutput = sourceNode?.data.outputs?.find(o => o.id === edge.sourceHandle);
        const targetInput = targetNode?.data.inputs?.find(i => i.id === edge.targetHandle);

        if (sourceOutput && targetInput) {
            if (!isTypeCompatible(sourceOutput.type, targetInput.type)) {
                warnings.push({
                    type: 'type_mismatch',
                    message: `Type mismatch: ${sourceOutput.type} → ${targetInput.type}`
                });
            }
        }
    });

    return { valid: errors.length === 0, errors, warnings };
}

function detectCycle(nodes, edges) {
    const visited = new Set();
    const recursionStack = new Set();

    function dfs(nodeId) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const outgoing = edges.filter(e => e.source === nodeId);
        for (const edge of outgoing) {
            if (!visited.has(edge.target)) {
                if (dfs(edge.target)) return true;
            } else if (recursionStack.has(edge.target)) {
                return true; // Cycle détecté
            }
        }

        recursionStack.delete(nodeId);
        return false;
    }

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            if (dfs(node.id)) return true;
        }
    }

    return false;
}
```

### 4. Undo/Redo

```javascript
// Nouveau: useHistory hook
function useHistory(initialState) {
    const [history, setHistory] = useState([initialState]);
    const [index, setIndex] = useState(0);

    const state = history[index];

    const setState = useCallback((newState) => {
        const newHistory = history.slice(0, index + 1);
        newHistory.push(newState);

        // Limiter l'historique à 50 états
        if (newHistory.length > 50) {
            newHistory.shift();
        } else {
            setIndex(index + 1);
        }

        setHistory(newHistory);
    }, [history, index]);

    const undo = useCallback(() => {
        if (index > 0) setIndex(index - 1);
    }, [index]);

    const redo = useCallback(() => {
        if (index < history.length - 1) setIndex(index + 1);
    }, [index, history.length]);

    const canUndo = index > 0;
    const canRedo = index < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo };
}
```

---

## Refactorisation

### 1. TypeScript Migration

**Priorité:** HAUTE

```typescript
// Exemple: types/node.ts
export interface NodePort {
    id: string;
    name: string;
    interface: string;
    type: 'float' | 'string' | 'boolean' | 'enum' | 'array' | 'object' | 'any';
    optional: boolean;
    desc: string;
    value?: unknown;
    enumOptions?: string[];
}

export interface WorkflowNode {
    id: string;
    type: 'custom' | 'float' | 'string' | 'boolean';
    position: { x: number; y: number };
    data: {
        label: string;
        inputs: NodePort[];
        outputs: NodePort[];
        packageName?: string;
        nodeName?: string;
        status: 'ready' | 'running' | 'done' | 'error';
    };
}
```

### 2. Consolidation des Modèles Node

Actuellement 3 classes différentes : `Node`, `WFNode`, `TreeNode`

**Solution:** Fusionner en une seule classe avec factory methods

```javascript
class WorkflowNode {
    static fromOpenAlea(item) { /* ... */ }
    static fromPrimitive(type, defaultValue) { /* ... */ }
    static fromJSON(json) { /* ... */ }

    toReactFlow() { /* Format ReactFlow */ }
    toExecution() { /* Format exécution */ }
    toJSON() { /* Sérialisation */ }
}
```

### 3. Hooks Personnalisés

```javascript
// hooks/useNode.js
export function useNode(nodeId) {
    const { nodes, updateNode, deleteNode } = useFlow();
    const node = nodes.find(n => n.id === nodeId);

    const setInput = useCallback((inputId, value) => {
        const updatedInputs = node.data.inputs.map(i =>
            i.id === inputId ? { ...i, value } : i
        );
        updateNode(nodeId, { inputs: updatedInputs });
    }, [node, nodeId, updateNode]);

    return { node, setInput, deleteNode: () => deleteNode(nodeId) };
}

// hooks/useWorkflowExecution.js
export function useWorkflowExecution() {
    const { nodes, edges, engine } = useFlow();
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);

    const execute = useCallback(async () => {
        const validation = validateWorkflow(nodes, edges);
        if (!validation.valid) {
            throw new Error(validation.errors[0].message);
        }

        setStatus('running');
        const graph = buildGraphModel(nodes, edges);
        engine.bindModel(graph);

        engine.onUpdate((event, payload) => {
            if (event === 'node-done') {
                setProgress(p => p + 1);
            }
        });

        await engine.start();
        setStatus('completed');
    }, [nodes, edges, engine]);

    return { execute, status, progress };
}
```

---

## Sécurité

### 1. CORS Restrictif

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev
    "http://localhost:3000",  # React dev
    # Ajouter les domaines de production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
```

### 2. Authentification

```python
# auth.py
from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    if api_key != settings.API_KEY:
        raise HTTPException(401, "Invalid API key")
    return api_key

# Usage
@router.post("/install")
async def install_packages(
    request: InstallRequest,
    api_key: str = Depends(verify_api_key)
):
    # ...
```

### 3. Rate Limiting

```python
# middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/install")
@limiter.limit("5/minute")
async def install_packages(request: Request, ...):
    # ...
```

### 4. Validation des Noms de Package

```python
import re

def validate_package_name(name: str) -> bool:
    """Valide le format du nom de package."""
    pattern = r'^[a-zA-Z][a-zA-Z0-9._-]*$'
    return bool(re.match(pattern, name)) and len(name) <= 100

@router.get("/installed/{package_name}")
async def fetch_package_nodes(package_name: str):
    if not validate_package_name(package_name):
        raise HTTPException(400, "Invalid package name format")
    # ...
```

---

## Performance

### 1. Throttle localStorage

```javascript
// utils/throttle.js
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// FlowContext.jsx
const saveToLocalStorage = useCallback(
    throttle((nodes, edges) => {
        localStorage.setItem('nodes', JSON.stringify(nodes));
        localStorage.setItem('edges', JSON.stringify(edges));
    }, 1000),  // Max 1 sauvegarde/seconde
    []
);
```

### 2. Virtualisation pour Grandes Listes

```javascript
// PanelInstallPackage.jsx
import { FixedSizeList } from 'react-window';

function PackageList({ packages, onInstall }) {
    const Row = ({ index, style }) => (
        <div style={style}>
            <PackageItem package={packages[index]} onInstall={onInstall} />
        </div>
    );

    return (
        <FixedSizeList
            height={400}
            itemCount={packages.length}
            itemSize={60}
        >
            {Row}
        </FixedSizeList>
    );
}
```

### 3. Memoization des Composants

```javascript
// CustomNode.jsx
export default React.memo(CustomNode, (prev, next) => {
    return (
        prev.id === next.id &&
        prev.data.status === next.data.status &&
        prev.data.inputs === next.data.inputs &&
        prev.data.outputs === next.data.outputs
    );
});
```

---

## Priorités

### Phase 1 - Corrections Critiques (Semaine 1-2)

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Injection valeurs input | CRITIQUE | Moyen |
| Exécution multi-nodes | CRITIQUE | Élevé |
| Propagation données | CRITIQUE | Moyen |
| Timeout subprocess | HAUTE | Faible |

### Phase 2 - Fonctionnalités Core (Semaine 3-4)

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Support multi-root | HAUTE | Moyen |
| Exécution asynchrone | HAUTE | Élevé |
| Validation workflow | HAUTE | Moyen |
| Cache packages | MOYENNE | Faible |

### Phase 3 - Sécurité & Qualité (Semaine 5-6)

| Tâche | Priorité | Effort |
|-------|----------|--------|
| CORS restrictif | HAUTE | Faible |
| Authentification | HAUTE | Moyen |
| TypeScript migration | MOYENNE | Élevé |
| Tests E2E | MOYENNE | Élevé |

### Phase 4 - Rendu 3D (Semaine 7-10)

Voir [03_OPTIONS_RENDU_3D.md](./03_OPTIONS_RENDU_3D.md)

---

*Document suivant : [03_OPTIONS_RENDU_3D.md](./03_OPTIONS_RENDU_3D.md)*
