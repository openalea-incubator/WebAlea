# WebAlea - Implémentation WorkflowEngine V2

> Guide d'implémentation du moteur d'exécution asynchrone avec gestion des dépendances

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Fichiers créés](#fichiers-créés)
4. [Fonctionnement détaillé](#fonctionnement-détaillé)
5. [Intégration](#intégration)
6. [API Reference](#api-reference)
7. [Exemples d'utilisation](#exemples-dutilisation)

---

## Vue d'ensemble

Le WorkflowEngine V2 résout les problèmes critiques identifiés dans la documentation:

| Problème | Solution V2 |
|----------|-------------|
| Exécution single-node only | Exécution complète du graphe |
| Pas d'attente des inputs | DependencyTracker attend tous les inputs |
| Pas de détection de cycles | WorkflowValidator.detectCycle() |
| Exécution séquentielle | Branches parallèles via Promise.all() |
| Pas de propagation | markCompleted() propage les outputs |

### Principes clés

```
1. VALIDATION     → Vérifie cycles, inputs manquants
2. INITIALISATION → Identifie les root nodes (sans dépendances entrantes)
3. EXÉCUTION      → Execute les nodes prêts en parallèle
4. PROPAGATION    → Quand un node finit, injecte ses outputs dans les successeurs
5. DÉCLENCHEMENT  → Les successeurs "prêts" démarrent automatiquement
6. COMPLETION     → Attend que tous les nodes soient terminés
```

---

## Architecture

### Diagramme de flux

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOWENGINE V2 - EXECUTION FLOW                    │
└─────────────────────────────────────────────────────────────────────────────┘

                                    START
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │  WorkflowValidator   │
                           │  - detectCycle()     │
                           │  - checkInputs()     │
                           └──────────┬───────────┘
                                      │
                            valid?    │
                         ┌────────────┼────────────┐
                         │ NO         │            │ YES
                         ▼            │            ▼
                   ┌───────────┐      │    ┌───────────────────┐
                   │  ABORT    │      │    │ DependencyTracker │
                   │  (errors) │      │    │ - pendingDeps     │
                   └───────────┘      │    │ - inputStates     │
                                      │    └─────────┬─────────┘
                                      │              │
                                      │              ▼
                                      │    ┌───────────────────┐
                                      │    │ getReadyNodes()   │
                                      │    │ (nodes sans deps) │
                                      │    └─────────┬─────────┘
                                      │              │
                                      │              ▼
┌─────────────────────────────────────┼──────────────────────────────────────┐
│                                     │        PARALLEL EXECUTION            │
│     ┌───────────────────────────────┼───────────────────────────┐         │
│     │                               │                           │         │
│     ▼                               ▼                           ▼         │
│ ┌─────────┐                   ┌─────────┐                 ┌─────────┐     │
│ │ Node A  │                   │ Node B  │                 │ Node C  │     │
│ │(root 1) │                   │(root 2) │                 │(root 3) │     │
│ └────┬────┘                   └────┬────┘                 └────┬────┘     │
│      │                             │                           │         │
│      │ executeViaBackend()         │                           │         │
│      │                             │                           │         │
│      ▼                             ▼                           ▼         │
│ ┌─────────┐                   ┌─────────┐                 ┌─────────┐     │
│ │ results │                   │ results │                 │ results │     │
│ │ stored  │                   │ stored  │                 │ stored  │     │
│ └────┬────┘                   └────┬────┘                 └────┬────┘     │
│      │                             │                           │         │
│      │ markCompleted()             │                           │         │
│      │ → propagate outputs         │                           │         │
│      │ → check successors          │                           │         │
│      │                             │                           │         │
└──────┼─────────────────────────────┼───────────────────────────┼─────────┘
       │                             │                           │
       │                             │                           │
       └─────────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  Check successors    │
                          │  Are they ready?     │
                          │  (all inputs received)│
                          └──────────┬───────────┘
                                     │
                        ┌────────────┴────────────┐
                        │                         │
                   ready nodes              not ready
                        │                    (wait)
                        ▼
               ┌─────────────────┐
               │ Execute ready   │
               │ nodes in        │  ◄─── RECURSIVE
               │ parallel        │
               └────────┬────────┘
                        │
                        ▼
                   (repeat until
                    all nodes done)
                        │
                        ▼
                ┌───────────────┐
                │ WORKFLOW DONE │
                └───────────────┘
```

### Classes principales

```
WorkflowEngineV2
├── WorkflowValidator      # Validation du graphe
│   ├── validate()         # Validation complète
│   └── detectCycle()      # Détection de cycles (DFS)
│
├── DependencyTracker      # Suivi des dépendances
│   ├── pendingDependencies # Map<nodeId, Set<nodeIds>>
│   ├── inputStates        # Map<nodeId, Map<inputId, state>>
│   ├── isReady()          # Node prêt à s'exécuter?
│   ├── getReadyNodes()    # Liste des nodes prêts
│   ├── markCompleted()    # Marque complété + propage
│   └── getResolvedInputs()# Inputs avec valeurs propagées
│
└── WorkflowEngineV2       # Moteur principal
    ├── bindModel()        # Lie le graphe
    ├── start()            # Lance l'exécution
    ├── stop()             # Arrête proprement
    └── _executeNode()     # Exécute un node
```

---

## Fichiers créés

```
webAleaFront/src/features/workspace/
├── engine/
│   └── WorkflowEngineV2.jsx       # Moteur d'exécution V2
├── hooks/
│   └── useWorkflowExecution.jsx   # Hook React pour l'exécution
└── providers/
    └── FlowContextV2.jsx          # Provider avec V2 intégré

webAleaFront/src/features/toolbar/ui/
└── ToolBarV2.jsx                  # Toolbar avec progression

docs/
└── 06_IMPLEMENTATION_WORKFLOW_ENGINE_V2.md  # Cette documentation
```

---

## Fonctionnement détaillé

### 1. DependencyTracker - Gestion des dépendances

Le DependencyTracker est au coeur du système. Il maintient deux structures:

```javascript
// Pour chaque node: les IDs des nodes dont on attend les résultats
pendingDependencies: Map<nodeId, Set<sourceNodeIds>>

// Pour chaque input de chaque node: son état de réception
inputStates: Map<nodeId, Map<inputId, {
    received: boolean,
    value: any,
    sourceNodeId: string | null,
    sourceOutputId: string | null
}>>
```

#### Exemple concret

```
Graphe:
  FloatNode(5) ──┐
                 ├──► Addition ──► Multiply
  FloatNode(3) ──┘         │
                           │
                      FloatNode(2) ─┘

Après buildGraphModel (seuls les custom nodes):
  - Addition: pendingDeps = Set()  (pas de deps custom)
  - Multiply: pendingDeps = Set(Addition)

Au démarrage:
  - Addition est READY (pendingDeps vide)
  - Multiply est PENDING (attend Addition)

Après Addition terminé:
  - markCompleted('Addition', [{index:0, value:8}])
  - Multiply.pendingDeps.delete('Addition') → Set() vide
  - Multiply.inputs[0].value = 8
  - Multiply devient READY → exécuté
```

### 2. Résolution des inputs

La fonction `getResolvedInputs()` retourne les inputs avec leurs valeurs finales:

```javascript
_resolveInputsFromResults(node) {
    // 1. Trouver les edges entrantes
    const incomingEdges = this.edges.filter(e => e.target === node.id);

    // 2. Pour chaque edge, récupérer la valeur de l'output source
    for (const edge of incomingEdges) {
        const sourceResults = this.results[edge.source];
        const outputIndex = parseInt(edge.sourceHandle.match(/output_(\d+)/)[1]);
        const outputValue = sourceResults[outputIndex]?.value;

        // 3. Injecter dans l'input cible
        const input = node.inputs.find(i => i.id === edge.targetHandle);
        input.value = outputValue;
    }
}
```

### 3. Exécution parallèle sécurisée

Les branches indépendantes s'exécutent en parallèle:

```javascript
async _executeReadyNodes(readyNodeIds) {
    // Lancer TOUS les nodes prêts en parallèle
    const executions = readyNodeIds.map(nodeId => this._executeNode(nodeId));

    // Attendre qu'ils finissent tous (ou qu'un échoue)
    await Promise.allSettled(executions);
}
```

### 4. Propagation en cascade

Quand un node termine, ses successeurs sont vérifiés:

```javascript
// Dans _executeNode(), après succès:
const newlyReady = this.dependencyTracker.markCompleted(nodeId, outputs);

if (newlyReady.length > 0 && this.running) {
    // Exécuter les nouveaux nodes prêts en parallèle
    await this._executeReadyNodes(newlyReady);
}
```

---

## Intégration

### Option 1: Remplacer FlowContext (recommandé)

```jsx
// App.jsx
import { FlowProviderV2 } from './features/workspace/providers/FlowContextV2.jsx';
import ToolBarV2 from './features/toolbar/ui/ToolBarV2.jsx';

function App() {
    return (
        <FlowProviderV2>
            <ToolBarV2 />
            <Workspace />
            {/* ... */}
        </FlowProviderV2>
    );
}
```

### Option 2: Utiliser le hook directement

```jsx
import { useWorkflowExecution } from './features/workspace/hooks/useWorkflowExecution.jsx';

function MyComponent() {
    const {
        execute,
        stop,
        status,
        progress,
        errors,
        isRunning
    } = useWorkflowExecution({
        onNodeStateChange: (nodeId, state) => {
            // Mettre à jour l'UI
        },
        onNodeResult: (nodeId, result) => {
            // Traiter les résultats
        },
        onLog: (message, data) => {
            // Logger
        }
    });

    const handleRun = async () => {
        const result = await execute(nodes, edges);
        console.log('Workflow result:', result);
    };

    return (
        <div>
            <button onClick={handleRun} disabled={isRunning}>
                {isRunning ? 'Running...' : 'Run'}
            </button>
            <button onClick={stop} disabled={!isRunning}>
                Stop
            </button>
            <div>Progress: {progress.percent}%</div>
        </div>
    );
}
```

### Option 3: Migration progressive

Garder l'ancien FlowContext et importer le nouveau moteur:

```jsx
// Dans FlowContext.jsx existant
import { WorkflowEngineV2 } from '../engine/WorkflowEngineV2.jsx';

// Remplacer:
// const engine = new WorkflowEngine();
// Par:
const engine = new WorkflowEngineV2();

// Le reste fonctionne de manière similaire
```

---

## API Reference

### WorkflowEngineV2

```typescript
class WorkflowEngineV2 {
    // Lie le modèle au moteur
    bindModel(graph: WFNode[], edges: Edge[]): void;

    // Enregistre un listener d'événements
    onUpdate(callback: (event: string, payload: any) => void): void;

    // Démarre l'exécution
    start(): Promise<{
        success: boolean,
        results?: Record<string, Output[]>,
        error?: string,
        errors?: ValidationError[]
    }>;

    // Arrête l'exécution
    stop(): void;

    // Réinitialise l'état
    reset(): void;

    // Exécute un node manuellement
    executeNodeManual(node: WFNode): Promise<Output[]>;
}
```

### Événements émis

| Événement | Payload | Description |
|-----------|---------|-------------|
| `workflow-start` | `{ totalNodes, graph }` | Workflow démarré |
| `workflow-done` | `{ success, results, states }` | Workflow terminé |
| `workflow-error` | `{ error }` | Erreur fatale |
| `workflow-stopped` | `{}` | Arrêté par l'utilisateur |
| `validation-error` | `{ errors }` | Erreurs de validation |
| `validation-warnings` | `{ warnings }` | Avertissements |
| `node-state-change` | `{ id, state }` | État d'un node changé |
| `node-start` | `{ id, label }` | Node commence |
| `node-result` | `{ id, result }` | Résultat disponible |
| `node-done` | `{ id, label }` | Node terminé |
| `node-error` | `{ id, error }` | Node en erreur |
| `node-skipped` | `{ id, reason }` | Node sauté |

### NodeState

```javascript
const NodeState = {
    PENDING: 'pending',     // Attend ses dépendances
    READY: 'ready',         // Prêt à s'exécuter
    RUNNING: 'running',     // En cours
    COMPLETED: 'completed', // Terminé OK
    ERROR: 'error',         // Erreur
    SKIPPED: 'skipped',     // Sauté (dépendance en erreur)
    CANCELLED: 'cancelled'  // Annulé
};
```

### WorkflowValidator

```typescript
class WorkflowValidator {
    static validate(graph: WFNode[], edges: Edge[]): {
        valid: boolean,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    };

    static detectCycle(graph: WFNode[], edges: Edge[]): {
        hasCycle: boolean,
        cycleNodes: string[]
    };
}
```

---

## Exemples d'utilisation

### Workflow simple

```
FloatNode(5) ──┐
               ├──► Addition ──► Result
FloatNode(3) ──┘

Exécution:
1. buildGraphModel() → graph = [Addition], edges = []
2. DependencyTracker: Addition.pendingDeps = Set()
3. Addition est READY (pas de dépendances custom)
4. Execute Addition avec inputs = [{name:'a', value:5}, {name:'b', value:3}]
5. Backend retourne outputs = [{index:0, value:8}]
6. WORKFLOW DONE
```

### Workflow avec chaîne

```
FloatNode(5) ──► NodeA ──► NodeB ──► NodeC

Exécution:
1. graph = [NodeA, NodeB, NodeC]
2. pendingDeps:
   - NodeA: Set()
   - NodeB: Set(NodeA)
   - NodeC: Set(NodeB)

3. NodeA READY → exécute
4. NodeA terminé → markCompleted('NodeA', outputs)
   - NodeB.pendingDeps.delete('NodeA') → Set() vide
   - NodeB devient READY

5. NodeB READY → exécute
6. NodeB terminé → markCompleted('NodeB', outputs)
   - NodeC.pendingDeps.delete('NodeB') → Set() vide
   - NodeC devient READY

7. NodeC READY → exécute
8. WORKFLOW DONE
```

### Workflow parallèle avec convergence

```
FloatNode(5) ──► NodeA ──┐
                         ├──► NodeC (needs both A and B)
FloatNode(3) ──► NodeB ──┘

Exécution:
1. pendingDeps:
   - NodeA: Set()
   - NodeB: Set()
   - NodeC: Set(NodeA, NodeB)

2. NodeA et NodeB sont READY → exécutés EN PARALLÈLE

3. NodeA termine premier → markCompleted('NodeA')
   - NodeC.pendingDeps.delete('NodeA') → Set(NodeB)
   - NodeC pas encore READY (attend NodeB)

4. NodeB termine → markCompleted('NodeB')
   - NodeC.pendingDeps.delete('NodeB') → Set() vide
   - NodeC devient READY

5. NodeC exécute avec les deux inputs propagés
6. WORKFLOW DONE
```

---

## Tests recommandés

### Test 1: Workflow linéaire
```
A → B → C
Vérifier: Exécution séquentielle, propagation des valeurs
```

### Test 2: Branches parallèles
```
A ──┐
    ├──► C
B ──┘
Vérifier: A et B en parallèle, C attend les deux
```

### Test 3: Détection de cycle
```
A → B → C → A (cycle!)
Vérifier: Erreur CYCLE_DETECTED avant exécution
```

### Test 4: Erreur et skip
```
A → B → C
B échoue
Vérifier: C est SKIPPED, workflow terminé avec erreur
```

### Test 5: Arrêt utilisateur
```
Workflow long en cours
User clique Stop
Vérifier: Tous les nodes pending/running → CANCELLED
```

---

## Migration depuis WorkflowEngine V1

| V1 | V2 | Notes |
|----|----|----|
| `engine.start()` | `engine.start()` | Même signature |
| `engine.stop()` | `engine.stop()` | Même signature |
| `_executeChain()` séquentiel | `_executeNode()` parallèle | Automatique |
| `_resolveInputsFromResults()` | `DependencyTracker.getResolvedInputs()` | Plus robuste |
| Pas de validation | `WorkflowValidator.validate()` | Nouveau |

---

*Document créé le 31/12/2024*
