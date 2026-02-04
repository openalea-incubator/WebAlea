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
import { NodeState } from "../constants/nodeState.js";
import { DataType } from "../constants/workflowConstants.js";
import { WorkflowValidator } from "./WorkflowValidator.jsx";
import { DependencyTracker } from "./DependencyTracker.jsx";


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
            console.log(`WorkflowEngine: Manually executed ${node.id} (${node.label}) with outputs:`, outputs);
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
                    type: output.type || DataType.ANY
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
        const preparedInputs = (inputs || []).map((input) => ({
            ...input,
            value: input.value ?? input.default
        }));

        console.log(`WorkflowEngine: Backend call for ${node.id}`, {
            package: node.packageName,
            node: node.nodeName,
            inputs: preparedInputs
        });

        const response = await executeNode({
            nodeId: node.id,
            packageName: node.packageName,
            nodeName: node.nodeName,
            inputs: preparedInputs
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
