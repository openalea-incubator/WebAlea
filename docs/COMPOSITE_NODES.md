# Technical Documentation — Composite Nodes (WebAlea)

## Goal
Provide full support for **local composites** (workflows encapsulated as a single node), including:
- dedicated export/import,
- management in PackageManager (Local Packages),
- visual inspection,
- execution via pre-run expansion (supports nested composites),
- propagation of runtime state and outputs.

---

## User Flow (Overview)
1. **Export**  
   User chooses:
   - `workspace` → classic export (nodes + edges).
   - `composite` → export of a composite node (graph embedded).

2. **Import**  
   - `workspace` → replaces the scene.
   - `composite` → stored under **Local Packages** (reusable as a single node).

3. **Usage**  
   - Add from `Local Packages` like any other node.
   - Right‑click in workspace → “Inspect” → preview modal.

4. **Execution**  
   - Before execution, composites are **expanded** into their internal graph.
   - Composite outputs and states are injected back into the composite node.

---

## Composite Data Structure
Composite export/import (simplified):
```json
{
  "export_type": "composite",
  "package_name": "local_packages",
  "nodes": {
    "composite_1": {
      "description": "...",
      "inputs": [ ... ],
      "outputs": [ ... ],
      "nodekind": "composite",
      "graph": { "nodes": [...], "edges": [...] }
    }
  }
}
```

Exposed `inputs`/`outputs` are derived from **internally unconnected ports**.

---

## Frontend — Export / Import

### Export
**File**: `webAleaFront/src/features/toolbar/ui/ToolBar.jsx`  
Key functions:
- `handleExport()` — builds JSON (workspace or composite).
- `deriveCompositePorts()` — exposes unconnected ports.
- `downloadJson()` — triggers file download.

### Import
**File**: `webAleaFront/src/features/toolbar/ui/ToolBar.jsx`  
Key function:
- `handleImportData()`:
  - `workspace` → `setNodesAndEdges`
  - `composite` → stored into **Local Packages**

---

## Local Packages

### Storage
**File**: `webAleaFront/src/features/package-manager/utils/localPackages.js`

API:
- `loadLocalPackages()` — load from `localStorage`.
- `saveLocalPackage(pkg)` — merge + dedup by composite name.
- `removeLocalComposite(packageName, nodeName)` — delete composite.
- `removeLocalPackage(packageName)` — delete package.

### Display
**File**: `webAleaFront/src/features/package-manager/ui/type/PanelModuleNode.jsx`

Highlights:
- Custom TreeView item via `slots` for:
  - **composite icon** (`FaProjectDiagram`)
  - **trash icon** (delete action).
- O(1) item access via `itemMetaRef` map.

---

## Visual Inspection of Composites

### Workspace (right‑click)
**File**: `webAleaFront/src/features/workspace/Workspace.jsx`

Behavior:
- Right‑click on composite node → context menu.
- Action “Inspect” opens a modal.

### Inspect Modal
**File**: `webAleaFront/src/features/workspace/ui/CompositeInspectModal.jsx`

Characteristics:
- **No ReactFlow instance** (avoids handle conflicts).
- Lightweight rendering with **SVG edges** + **DOM nodes**.
- Runtime state color displayed (same as main workspace).

---

## Execution — Composite Expansion

### Recursive expansion
**File**: `webAleaFront/src/features/workspace/utils/compositeExpansion.js`

Strategy:
- Expand composite into internal nodes.
- Prefix IDs with `compositeId::`.
- Redirect edges:
  - incoming edges → exposed internal inputs
  - outgoing edges → exposed internal outputs
- Supports nested composites (repeat until `maxDepth`).

### Runtime state + outputs
**File**: `webAleaFront/src/features/workspace/utils/compositeRuntime.js`

Responsibilities:
- `collectCompositeStates()` — gather internal states.
- `computeCompositeState()` — compute final composite state.
- `resolveCompositeOutput()` — resolve outputs recursively for nested composites.

### Integration in FlowContext
**File**: `webAleaFront/src/features/workspace/providers/FlowContext.jsx`

Steps:
1. `expandComposites()` before `buildGraphModel()`
2. `engine.start()` on expanded graph
3. `updateCompositeOutputs()` + `recomputeCompositeState()`

---

## Flow Diagram (simplified)
```
Workspace (nodes+edges)
     |
     v
expandComposites()
     |
     v
buildGraphModel()
     |
     v
engine.start()
     |
     +--> updateCompositeOutputs()
     +--> recomputeCompositeState()
```

---

## Known Limitations
- Port mapping uses **name first, then index**  
  -> depends on `NodeLabel_portName` convention.
- Composite states are computed from internal nodes:
  - `ERROR` if any internal node is `ERROR`
  - `COMPLETED` if all are `COMPLETED`
  - otherwise propagated (`RUNNING`, `READY`, etc.)

---

## Main Files Updated
- `webAleaFront/src/features/toolbar/ui/ToolBar.jsx`
- `webAleaFront/src/features/package-manager/utils/localPackages.js`
- `webAleaFront/src/features/package-manager/ui/type/PanelModuleNode.jsx`
- `webAleaFront/src/features/workspace/utils/compositeExpansion.js`
- `webAleaFront/src/features/workspace/utils/compositeRuntime.js`
- `webAleaFront/src/features/workspace/providers/FlowContext.jsx`
- `webAleaFront/src/features/workspace/Workspace.jsx`
- `webAleaFront/src/features/workspace/ui/CompositeInspectModal.jsx`

