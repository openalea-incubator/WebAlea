# WebAlea - WorkflowEngine Implementation

> Implementation guide for the async execution engine with dependency management.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Files Created](#files-created)
4. [Detailed Operation](#detailed-operation)
5. [Integration](#integration)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)

---

## Overview

WorkflowEngine resolves the critical issues identified in the documentation:

| Problem | Solution |
|---------|-------------|
| Single-node execution only | Full graph execution |
| No waiting for inputs | DependencyTracker waits for all inputs |
| No cycle detection | WorkflowValidator.detectCycle() |
| Sequential execution only | Parallel branches via Promise.all() |
| No propagation | markCompleted() propagates outputs |

### Key Principles

```
1. VALIDATION     -> checks cycles and missing inputs
2. INITIALIZATION -> identifies root nodes (no incoming dependencies)
3. EXECUTION      -> executes ready nodes in parallel
4. PROPAGATION    -> when a node finishes, injects outputs into successors
5. TRIGGERING     -> successors that become ready start automatically
6. COMPLETION     -> waits until all nodes are finished
```

---

## Architecture

### Flow Diagram (simplified)

```
START
  |
  v
WorkflowValidator (detectCycle, checkInputs)
  |
  +--> invalid -> ABORT (errors)
  |
  v
DependencyTracker (pendingDeps, inputStates)
  |
  v
getReadyNodes()
  |
  v
Execute ready nodes in parallel
  |
  v
markCompleted() -> propagate outputs -> check successors
  |
  v
Repeat until all nodes done
  |
  v
WORKFLOW DONE
```

### Main Classes

```
WorkflowEngineV2
|-- WorkflowValidator       # Graph validation
|   |-- validate()          # Full validation
|   `-- detectCycle()       # Cycle detection (DFS)
|
|-- DependencyTracker       # Dependency tracking
|   |-- pendingDependencies # Map<nodeId, Set<nodeIds>>
|   |-- inputStates         # Map<nodeId, Map<inputId, state>>
|   |-- isReady()           # Is node ready to execute?
|   |-- getReadyNodes()     # List of ready nodes
|   |-- markCompleted()     # Mark completed + propagate
|   `-- getResolvedInputs() # Inputs with propagated values
|
`-- WorkflowEngineV2        # Main engine
    |-- bindModel()         # Binds the graph
    |-- start()             # Starts execution
    |-- stop()              # Stops cleanly
    `-- _executeNode()      # Executes a node
```

---

## Files Created

```
webAleaFront/src/features/workspace/
|-- engine/
|   `-- WorkflowEngineV2.jsx       # execution engine
|-- hooks/
|   `-- useWorkflowExecution.jsx   # React hook for execution
`-- providers/
    `-- FlowContextV2.jsx          # Provider with integrated

webAleaFront/src/features/toolbar/ui/
`-- ToolBarV2.jsx                  # Toolbar with progress

docs/
`-- 06_IMPLEMENTATION_WORKFLOW_ENGINE_V2.md  # This documentation
```

---

## Detailed Operation

### 1. DependencyTracker - Dependency Management

DependencyTracker is the core of the system. It maintains two structures:

```javascript
// For each node: IDs of nodes whose results are still expected
pendingDependencies: Map<nodeId, Set<sourceNodeIds>>

// For each input of each node: its reception state
inputStates: Map<nodeId, Map<inputId, {
    received: boolean,
    value: any,
    sourceNodeId: string | null,
    sourceOutputId: string | null
}>>
```

#### Concrete example

```
Graph:
  FloatNode(5) --\
                 +--> Addition --> Multiply
  FloatNode(3) --/           |
                      FloatNode(2) --/

After buildGraphModel (custom nodes only):
  - Addition: pendingDeps = Set()  (no custom deps)
  - Multiply: pendingDeps = Set(Addition)

At start:
  - Addition is READY (empty pendingDeps)
  - Multiply is PENDING (waiting for Addition)

After Addition completes:
  - markCompleted('Addition', [{index:0, value:8}])
  - Multiply.pendingDeps.delete('Addition') -> empty Set
  - Multiply.inputs[0].value = 8
  - Multiply becomes READY -> executed
```

### 2. Input Resolution

`getResolvedInputs()` returns inputs with their final values:

```javascript
_resolveInputsFromResults(node) {
    // 1. Find incoming edges
    const incomingEdges = this.edges.filter(e => e.target === node.id);

    // 2. For each edge, get the source output value
    for (const edge of incomingEdges) {
        const sourceResults = this.results[edge.source];
        const outputIndex = parseInt(edge.sourceHandle.match(/output_(\d+)/)[1]);
        const outputValue = sourceResults[outputIndex]?.value;

        // 3. Inject into the target input
        const input = node.inputs.find(i => i.id === edge.targetHandle);
        input.value = outputValue;
    }
}
```

### 3. Safe Parallel Execution

Independent branches execute in parallel:

```javascript
async _executeReadyNodes(readyNodeIds) {
    // Launch ALL ready nodes in parallel
    const executions = readyNodeIds.map(nodeId => this._executeNode(nodeId));

    // Wait for all to finish (or fail)
    await Promise.allSettled(executions);
}
```

### 4. Cascading Propagation

When a node finishes, its successors are checked:

```javascript
// In _executeNode(), after success:
const newlyReady = this.dependencyTracker.markCompleted(nodeId, outputs);

if (newlyReady.length > 0 && this.running) {
    // Execute new ready nodes in parallel
    await this._executeReadyNodes(newlyReady);
}
```

---

## Integration

### Option 1: Replace FlowContext (recommended)

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

### Option 2: Use the hook directly

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
            // Update the UI
        },
        onNodeResult: (nodeId, result) => {
            // Handle results
        },
        onLog: (message, data) => {
            // Log
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

### Option 3: Progressive migration

Keep the existing FlowContext and import the new engine:

```jsx
// In existing FlowContext.jsx
import { WorkflowEngine } from '../engine/WorkflowEngine.jsx';

// Replace:
// const engine = new WorkflowEngine();
// With:
const engine = new WorkflowEngine();

// The rest works similarly
```

---

## API Reference

### WorkflowEngineV2

```typescript
class WorkflowEngine {
    // Bind the model to the engine
    bindModel(graph: WFNode[], edges: Edge[]): void;

    // Register an event listener
    onUpdate(callback: (event: string, payload: any) => void): void;

    // Start execution
    start(): Promise<{
        success: boolean,
        results?: Record<string, Output[]>,
        error?: string,
        errors?: ValidationError[]
    }>;

    // Stop execution
    stop(): void;

    // Reset state
    reset(): void;

    // Execute a node manually
    executeNodeManual(node: WFNode): Promise<Output[]>;
}
```

### Emitted Events

| Event | Payload | Description |
|-------|---------|-------------|
| `workflow-start` | `{ totalNodes, graph }` | Workflow started |
| `workflow-done` | `{ success, results, states }` | Workflow finished |
| `workflow-error` | `{ error }` | Fatal error |
| `workflow-stopped` | `{}` | Stopped by user |
| `validation-error` | `{ errors }` | Validation errors |
| `validation-warnings` | `{ warnings }` | Validation warnings |
| `node-state-change` | `{ id, state }` | Node state changed |
| `node-start` | `{ id, label }` | Node started |
| `node-result` | `{ id, result }` | Result available |
| `node-done` | `{ id, label }` | Node finished |
| `node-error` | `{ id, error }` | Node error |
| `node-skipped` | `{ id, reason }` | Node skipped |

### NodeState

```javascript
const NodeState = {
    PENDING: 'pending',     // Waiting for dependencies
    READY: 'ready',         // Ready to execute
    RUNNING: 'running',     // In progress
    COMPLETED: 'completed', // Completed OK
    ERROR: 'error',         // Error
    SKIPPED: 'skipped',     // Skipped (dependency error)
    CANCELLED: 'cancelled'  // Cancelled
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

## Usage Examples

### Simple workflow

```
FloatNode(5) --\
               +--> Addition --> Result
FloatNode(3) --/

Execution:
1. buildGraphModel() -> graph = [Addition], edges = []
2. DependencyTracker: Addition.pendingDeps = Set()
3. Addition is READY (no custom dependencies)
4. Execute Addition with inputs = [{name:'a', value:5}, {name:'b', value:3}]
5. Backend returns outputs = [{index:0, value:8}]
6. WORKFLOW DONE
```

### Workflow with chain

```
FloatNode(5) -> NodeA -> NodeB -> NodeC

Execution:
1. graph = [NodeA, NodeB, NodeC]
2. pendingDeps:
   - NodeA: Set()
   - NodeB: Set(NodeA)
   - NodeC: Set(NodeB)

3. NodeA READY -> execute
4. NodeA finished -> markCompleted('NodeA', outputs)
   - NodeB.pendingDeps.delete('NodeA') -> empty Set
   - NodeB becomes READY

5. NodeB READY -> execute
6. NodeB finished -> markCompleted('NodeB', outputs)
   - NodeC.pendingDeps.delete('NodeB') -> empty Set
   - NodeC becomes READY

7. NodeC READY -> execute
8. WORKFLOW DONE
```

### Parallel workflow with convergence

```
FloatNode(5) -> NodeA --\
                        +--> NodeC (needs both A and B)
FloatNode(3) -> NodeB --/

Execution:
1. pendingDeps:
   - NodeA: Set()
   - NodeB: Set()
   - NodeC: Set(NodeA, NodeB)

2. NodeA and NodeB are READY -> executed IN PARALLEL

3. NodeA finishes first -> markCompleted('NodeA')
   - NodeC.pendingDeps.delete('NodeA') -> Set(NodeB)
   - NodeC not READY yet (waiting for NodeB)

4. NodeB finishes -> markCompleted('NodeB')
   - NodeC.pendingDeps.delete('NodeB') -> empty Set
   - NodeC becomes READY

5. NodeC executes with both propagated inputs
6. WORKFLOW DONE
```

---

## Recommended Tests

### Test 1: Linear workflow
```
A -> B -> C
Verify: sequential execution, value propagation
```

### Test 2: Parallel branches
```
A --\
    +--> C
B --/
Verify: A and B in parallel, C waits for both
```

### Test 3: Cycle detection
```
A -> B -> C -> A (cycle!)
Verify: CYCLE_DETECTED error before execution
```

### Test 4: Error and skip
```
A -> B -> C
B fails
Verify: C is SKIPPED, workflow ends with error
```

### Test 5: User stop
```
Long workflow running
User clicks Stop
Verify: all pending/running nodes -> CANCELLED
```

*Document created on 2024-12-31*
