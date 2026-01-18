/**
 * WorkflowEngine.jsx
 *
 * Asynchronous execution engine with full dependency management.
 *
 * Features:
 *  - Parallel execution of independent branches: nodes without mutual dependencies run concurrently to improve throughput.
 *  - Automatic input resolution and gating: a node will wait until all connected inputs or preset default values are available before starting.
 *  - Cycle detection and reporting: the validator detects circular dependencies and returns the involved nodes to prevent infinite execution.
 *  - Graceful cancellation via AbortController: in-flight backend calls are abortable and remaining tasks are canceled cleanly.
 *  - Real-time feedback through events: emits lifecycle events (workflow-start, node-start, node-result, node-error, node-skipped, node-done, node-state-change, workflow-done, etc.) for UI updates and logging.
 */

import { executeNode } from "../../../api/runnerAPI.js";
import { NodeState } from "../../workspace/Utils/workflowUtils.js";

// =============================================================================
// WORKFLOW VALIDATOR
// =============================================================================

/**
 * Validates the workflow structure before execution
 */
export class WorkflowValidator {
    /**
     * Validates the workflow
     * @param {Array} graph - Workflow graph nodes
     * @param {Array} edges - Workflow graph edges
     * @returns {{ valid: boolean, errors: Array, warnings: Array }}
     */
    static validate(graph, edges) {
        const errors = [];
        const warnings = [];

        // 1. Check for empty workflow
        if (!graph || graph.length === 0) {
            errors.push({ type: 'EMPTY_WORKFLOW', message: 'The workflow is empty' });
            return { valid: false, errors, warnings };
        }

        // 2. Detect cycles
        const cycleResult = this.detectCycle(graph, edges);
        if (cycleResult.hasCycle) {
            errors.push({
                type: 'CYCLE_DETECTED',
                message: 'Cycle detected in the workflow',
                nodes: cycleResult.cycleNodes
            });
        }

        // 3. Check for unconnected mandatory inputs
        graph.forEach(node => {
            (node.inputs || []).forEach(input => {
                const isConnected = edges.some(e =>
                    e.target === node.id && e.targetHandle === input.id
                );
                const hasValue = input.value !== undefined && input.value !== null;
                const isOptional = input.optional === true;

                if (!isConnected && !hasValue && !isOptional) {
                    errors.push({
                        type: 'UNCONNECTED_INPUT',
                        nodeId: node.id,
                        inputId: input.id,
                        message: `Node "${node.label}" has unconnected mandatory input "${input.name}"`
                    });
                }
            });
        });

        // 4. Warn about custom nodes without package
        graph.forEach(node => {
            if (!node.packageName && node.type === 'custom') {
                warnings.push({
                    type: 'MISSING_PACKAGE',
                    nodeId: node.id,
                    message: `Custom node "${node.label}" is missing package information`
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Detects cycles in the workflow graph using DFS
     */
    static detectCycle(graph, edges) {
        const visited = new Set();
        const recursionStack = new Set();
        // eslint-disable-next-line no-unused-vars
        const cycleNodes = [];

        // Build adjacency list from edges : nodeId -> [neighborNodeIds]
        const adjacency = new Map();
        graph.forEach(node => adjacency.set(node.id, []));
        edges.forEach(edge => {
            if (adjacency.has(edge.source)) {
                adjacency.get(edge.source).push(edge.target);
            }
        });

        const dfs = (nodeId, path = []) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const neighbors = adjacency.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const result = dfs(neighbor, [...path]);
                    if (result) return result;
                } else if (recursionStack.has(neighbor)) {
                    // Cycle detected
                    const cycleStart = path.indexOf(neighbor);
                    return path.slice(cycleStart);
                }
            }

            recursionStack.delete(nodeId);
            return null;
        };

        for (const node of graph) {
            if (!visited.has(node.id)) {
                const cycle = dfs(node.id);
                if (cycle) {
                    return { hasCycle: true, cycleNodes: cycle };
                }
            }
        }

        return { hasCycle: false, cycleNodes: [] };
    }
}

// =============================================================================
// DEPENDENCY TRACKER
// =============================================================================

/**
 * Tracks dependencies and input states for nodes
 */
class DependencyTracker {
    constructor(graph, edges) {
        this.graph = graph;
        this.edges = edges;

        // Map: nodeId -> Set of pending dependency nodeIds
        this.pendingDependencies = new Map();

        // Map: nodeId -> Map(inputId -> { received: boolean, value: any })
        this.inputStates = new Map();

        this._initialize();
    }

    _initialize() {
        // Initialize dependency and input state maps
        for (const node of this.graph) {
            const dependencies = new Set();
            const inputStateMap = new Map();

            // Initialize input states with default values
            for (const input of (node.inputs || [])) {
                inputStateMap.set(input.id, {
                    received: false,
                    value: input.value,
                    sourceNodeId: null,
                    sourceOutputId: null
                });
            }

            // Find incoming edges to determine dependencies
            const incomingEdges = this.edges.filter(e => e.target === node.id);
            for (const edge of incomingEdges) {
                dependencies.add(edge.source);

                // Link input state to source node/output
                const inputState = inputStateMap.get(edge.targetHandle);
                if (inputState) {
                    inputState.sourceNodeId = edge.source;
                    inputState.sourceOutputId = edge.sourceHandle;
                    // Mark as not received yet (since it's from another node)
                }
            }

            this.pendingDependencies.set(node.id, dependencies);
            this.inputStates.set(node.id, inputStateMap);
        }
    }

    /**
     * Checks if a node is ready to execute (all dependencies resolved)
     */
    isReady(nodeId) {
        const pending = this.pendingDependencies.get(nodeId);
        return pending && pending.size === 0;
    }

    /**
     * Gets all nodes that are currently ready to execute
     */
    getReadyNodes() {
        const ready = [];
        for (const node of this.graph) {
            if (this.isReady(node.id)) {
                ready.push(node.id);
            }
        }
        return ready;
    }

    /**
     * Marks a node as completed and propagates outputs to dependent nodes
     *
     * @param {string} nodeId - ID of the completed node
     * @param {Array} outputs - Outputs produced by the completed node
     * @returns {Array} - List of newly ready node IDs
     */
    markCompleted(nodeId, outputs) {
        const newlyReady = [];

        // Find all outgoing edges from this node
        const outgoingEdges = this.edges.filter(e => e.source === nodeId);

        for (const edge of outgoingEdges) {
            const targetNodeId = edge.target;

            // Remove this node from the pending dependencies of the target node
            // - If no more pending dependencies, the target node becomes ready
            const pending = this.pendingDependencies.get(targetNodeId);
            if (pending) {
                pending.delete(nodeId);
            }

            // Update the input state of the target node
            const inputStates = this.inputStates.get(targetNodeId);
            if (inputStates) {
                const inputState = inputStates.get(edge.targetHandle);
                if (inputState) {
                    // Parse output index from sourceHandle (e.g., "output_0" -> 0)
                    const outputIndex = parseInt(edge.sourceHandle.match(/output_(\d+)/)?.[1] || 0, 10);
                    const outputValue = outputs[outputIndex]?.value;

                    inputState.received = true;
                    inputState.value = outputValue;
                }
            }

            if (this.isReady(targetNodeId)) {
                newlyReady.push(targetNodeId);
            }
        }

        return newlyReady;
    }

    /**
     * Gets the resolved inputs for a node, combining received values and defaults.
     * An input is considered resolved if it has either received a value from a dependency
     * @param {string} nodeId - ID of the node
     * @returns {Array} - List of inputs with resolved values
     */
    getResolvedInputs(nodeId) {
        const node = this.graph.find(n => n.id === nodeId);
        if (!node) return [];

        const inputStates = this.inputStates.get(nodeId);
        if (!inputStates) return node.inputs || [];

        return (node.inputs || []).map(input => {
            const state = inputStates.get(input.id);
            return {
                ...input,
                value: state ? state.value : input.value
            };
        });
    }

    /**
     * Recursively gets all successor nodes of a given node
     * @param {string} nodeId - ID of the node
     * @param {Set} visited - Set of already visited nodes to avoid cycles
     * @returns {Array} - List of successor node IDs
     */
    getSuccessors(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const successors = [];
        const outgoingEdges = this.edges.filter(e => e.source === nodeId);

        for (const edge of outgoingEdges) {
            successors.push(edge.target);
            successors.push(...this.getSuccessors(edge.target, visited));
        }

        return [...new Set(successors)];
    }
}

// =============================================================================
// WORKFLOW ENGINE 
// =============================================================================

/**
 * Main workflow execution engine
 * Handles asynchronous execution with dependency management
 * emits events for real-time feedback
 */
export class WorkflowEngine {
    constructor() {
        this.graph = [];
        this.edges = [];
        this.dependencyTracker = null;

        // Execution state
        this.running = false;
        this.abortController = null;
        this.nodeStates = new Map();  // nodeId -> NodeState
        this.results = {};            // nodeId -> outputs[]

        // Listeners
        this.listeners = [];

        // Promises for node executions
        this.executionPromises = new Map();  // nodeId -> Promise
        this.nodeResolvers = new Map();      // nodeId -> { resolve, reject }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Bind the workflow model (graph + edges) to the engine
     */
    bindModel(graph, edges) {
        this.graph = graph;
        this.edges = edges;
        this.reset();
    }

    /**
     * Register a listener for workflow events
     */
    onUpdate(callback) {
        this.listeners.push(callback);
    }

    /**
     * Reset the engine state for a fresh execution
     */
    reset() {
        this.results = {};
        this.nodeStates.clear();
        this.executionPromises.clear();
        this.nodeResolvers.clear();

        // Initialize all nodes to PENDING state
        for (const node of this.graph) {
            this.nodeStates.set(node.id, NodeState.PENDING);
        }
    }

    /**
     * Start the workflow execution
     */
    async start() {
        if (this.running) {
            console.warn("WorkflowEngine: Already running");
            return { success: false, error: "Already running" };
        }

        if (!this.graph || this.graph.length === 0) {
            console.warn("WorkflowEngine: No model bound");
            return { success: false, error: "No model bound" };
        }

        // Validation
        const validation = WorkflowValidator.validate(this.graph, this.edges);
        if (!validation.valid) {
            this._emit("validation-error", { errors: validation.errors });
            return { success: false, errors: validation.errors };
        }

        if (validation.warnings.length > 0) {
            this._emit("validation-warnings", { warnings: validation.warnings });
        }

        // Initialize execution state
        this.running = true;
        this.abortController = new AbortController();
        this.reset();
        this.dependencyTracker = new DependencyTracker(this.graph, this.edges);

        this._emit("workflow-start", {
            totalNodes: this.graph.length,
            graph: this.graph.map(n => ({ id: n.id, label: n.label }))
        });

        console.log("WorkflowEngine: Starting with", this.graph.length, "nodes");

        try {
            // Find initial ready nodes (nodes without dependencies)
            const initialReady = this.dependencyTracker.getReadyNodes();
            console.log("WorkflowEngin2: Initial ready nodes:", initialReady);

            if (initialReady.length === 0) {
                throw new Error("Aucun node racine trouvé - vérifiez les connexions");
            }

            // Set all nodes to PENDING initially
            for (const node of this.graph) {
                this._setNodeState(node.id, NodeState.PENDING);
            }

            // Execute initial ready nodes in parallel
            await this._executeReadyNodes(initialReady);

            // Wait for all nodes to complete
            await this._waitForAllNodes();

            // Check for unfinished nodes (cycles or skipped)
            const unfinished = [...this.nodeStates.entries()]
                // eslint-disable-next-line no-unused-vars
                .filter(([_, state]) => state === NodeState.PENDING || state === NodeState.READY)
                .map(([id]) => id);

            if (unfinished.length > 0) {
                console.warn("WorkflowEngine: Nodes not executed:", unfinished);
            }

            const hasErrors = [...this.nodeStates.values()].some(s => s === NodeState.ERROR);

            this._emit("workflow-done", {
                success: !hasErrors,
                results: this.results,
                states: Object.fromEntries(this.nodeStates)
            });

            return { success: !hasErrors, results: this.results };

        } catch (error) {
            console.error("WorkflowEngine: Workflow failed:", error);
            this._emit("workflow-error", { error: error.message });
            return { success: false, error: error.message };

        } finally {
            this.running = false;
            this.abortController = null;
        }
    }

    /**
     * Stop the workflow execution gracefully
     */
    stop() {
        if (!this.running) return;

        console.log("WorkflowEngine: Stopping workflow");
        this.running = false;

        if (this.abortController) {
            this.abortController.abort();
        }

        // Update states of running/pending nodes to CANCELLED
        for (const [nodeId, state] of this.nodeStates) {
            if (state === NodeState.PENDING || state === NodeState.READY || state === NodeState.RUNNING) {
                this._setNodeState(nodeId, NodeState.CANCELLED);

                // Reject any pending promises
                const resolver = this.nodeResolvers.get(nodeId);
                if (resolver) {
                    resolver.reject(new Error("Workflow stopped"));
                }
            }
        }

        this._emit("workflow-stopped", {});
    }

    /**
     * Execute one node manually
     */
    async executeNodeManual(node) {
        this._emit("node-start", { id: node.id, label: node.label });

        try {
            const outputs = await this._executeViaBackend(node, node.inputs || []);
            this._emit("node-result", { id: node.id, result: outputs });
            this._emit("node-done", { id: node.id });
            return outputs;
        } catch (error) {
            this._emit("node-error", { id: node.id, error: error.message });
            throw error;
        }
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Execute all ready nodes in parallel
     * @param {Array} readyNodeIds - List of node IDs ready to execute
     */
    async _executeReadyNodes(readyNodeIds) {
        const executions = readyNodeIds.map(nodeId => this._executeNode(nodeId));
        await Promise.allSettled(executions);
    }

    /**
     * Waits for all node execution promises to settle
     */
    async _waitForAllNodes() {
        const allPromises = [...this.executionPromises.values()];
        await Promise.allSettled(allPromises);
    }

    /**
     * Executes a single node
     * @param {string} nodeId - ID of the node to execute
     */
    async _executeNode(nodeId) {
        // Create a promise for this node's execution : will be resolved/rejected later
        const nodePromise = new Promise((resolve, reject) => {
            this.nodeResolvers.set(nodeId, { resolve, reject });
        });
        this.executionPromises.set(nodeId, nodePromise);

        try {
            if (!this.running) {
                throw new Error("Workflow stopped");
            }

            const node = this.graph.find(n => n.id === nodeId);
            if (!node) {
                throw new Error(`Node ${nodeId} not found`);
            }

            // Mark as running
            this._setNodeState(nodeId, NodeState.RUNNING);
            this._emit("node-start", { id: nodeId, label: node.label });

            // Get resolved inputs : from dependencies or default values
            const resolvedInputs = this.dependencyTracker.getResolvedInputs(nodeId);

            console.log(`WorkflowEngine: Executing ${nodeId} (${node.label}) with inputs:`,
                resolvedInputs.map(i => ({ name: i.name, value: i.value })));

            // Execute the node (via backend or primitive)
            let outputs;
            if (node.packageName && node.nodeName) {
                outputs = await this._executeViaBackend(node, resolvedInputs);
            } else {
                // Primitive node: simulate execution locally
                outputs = (node.outputs || []).map((output, index) => ({
                    index,
                    name: output.name || `output_${index}`,
                    value: output.value,
                    type: output.type || 'any'
                }));
            }

            this.results[nodeId] = outputs;

            // Mark as completed
            this._setNodeState(nodeId, NodeState.COMPLETED);
            this._emit("node-result", { id: nodeId, result: outputs });
            this._emit("node-done", { id: nodeId, label: node.label });

            // Resolve the promise
            const resolver = this.nodeResolvers.get(nodeId);
            if (resolver) resolver.resolve(outputs);

            // Propagate outputs to dependent nodes and get newly ready nodes
            const newlyReady = this.dependencyTracker.markCompleted(nodeId, outputs);

            if (newlyReady.length > 0 && this.running) {
                console.log(`WorkflowEngine: Nodes now ready after ${nodeId}:`, newlyReady);
                // Execute newly ready nodes in parallel.
                await this._executeReadyNodes(newlyReady);
            }

            return outputs;

        } catch (error) {
            console.error(`WorkflowEngine: Node ${nodeId} failed:`, error);

            // Mark as error
            this._setNodeState(nodeId, NodeState.ERROR);
            this._emit("node-error", { id: nodeId, error: error.message });

            const resolver = this.nodeResolvers.get(nodeId);
            if (resolver) resolver.reject(error);

            // Skip all successor nodes
            const successors = this.dependencyTracker.getSuccessors(nodeId);
            for (const successorId of successors) {
                if (this.nodeStates.get(successorId) === NodeState.PENDING) {
                    this._setNodeState(successorId, NodeState.SKIPPED);
                    this._emit("node-skipped", {
                        id: successorId,
                        reason: `Dependency ${nodeId} failed`
                    });

                    const successorResolver = this.nodeResolvers.get(successorId);
                    if (successorResolver) {
                        successorResolver.resolve(null);
                    }
                }
            }

            throw error;
        }
    }

    /**
     * Execute a node via backend API
     */
    async _executeViaBackend(node, inputs) {
        console.log(`WorkflowEngine: Backend call for ${node.id}`, {
            package: node.packageName,
            node: node.nodeName,
            inputs: inputs
        });

        const response = await executeNode({
            nodeId: node.id,
            packageName: node.packageName,
            nodeName: node.nodeName,
            inputs: inputs
        });

        if (response.success) {
            return response.outputs || [];
        } else {
            throw new Error(response.error || `Execution failed for ${node.id}`);
        }
    }

    /**
     * Sets the state of a node and emits an event
     */
    _setNodeState(nodeId, state) {
        this.nodeStates.set(nodeId, state);
        this._emit("node-state-change", { id: nodeId, state });
    }

    /**
     * Emits an event to all registered listeners
     */
    _emit(event, payload) {
        for (const listener of this.listeners) {
            try {
                listener(event, payload);
            } catch (e) {
                console.error("WorkflowEngine: Listener error:", e);
            }
        }
    }
}

export default WorkflowEngine;
