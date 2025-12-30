/**
 * WorkflowEngine.jsx
 * Executes OpenAlea workflows node by node with result propagation.
 */

import { WFNode, getRootNodes } from "../model/WorkflowGraph.jsx";
import { executeNode } from "../../../api/managerAPI.js";

export class WorkflowEngine {
    constructor() {
        this.model = [];
        this.edges = [];
        this.results = {};  // {nodeId: [{index, name, value, type}, ...]}
        this.running = false;
        this.listeners = [];
        this.abortController = null;
    }

    /**
     * Bind the graph model and edges to the engine.
     * @param {WFNode[]} graph - Array of workflow nodes
     * @param {Array} edges - Array of edges between custom nodes
     */
    bindModel(graph, edges) {
        this.model = graph;
        this.edges = edges;
        this.results = {};
    }

    /**
     * Register a listener for engine events.
     * @param {Function} cb - Callback function(event, payload)
     */
    onUpdate(cb) {
        this.listeners.push(cb);
    }

    /**
     * Start workflow execution.
     * Executes root nodes in parallel, then their children sequentially.
     */
    async start() {
        if (this.running) {
            console.warn("WorkflowEngine: Already running");
            return;
        }

        if (!this.model || this.model.length === 0) {
            console.warn("WorkflowEngine: No model bound");
            return;
        }

        this.running = true;
        this.results = {};
        this.abortController = new AbortController();

        this._emit("workflow-start", { totalNodes: this.model.length });
        console.log("WorkflowEngine: Starting workflow with", this.model.length, "nodes");

        try {
            const rootIds = getRootNodes(this.model);
            console.log("WorkflowEngine: Root nodes:", rootIds);

            if (rootIds.length === 0) {
                console.warn("WorkflowEngine: No root nodes found");
                this._emit("workflow-done", { success: true, results: this.results });
                this.running = false;
                return;
            }

            // Execute all root nodes in parallel
            const rootPromises = rootIds.map(rootId => this._executeChain(rootId));
            await Promise.all(rootPromises);

            console.log("WorkflowEngine: Workflow completed successfully");
            this._emit("workflow-done", { success: true, results: this.results });

        } catch (error) {
            console.error("WorkflowEngine: Workflow failed:", error);
            this._emit("workflow-error", { error: error.message });
        } finally {
            this.running = false;
            this.abortController = null;
        }
    }

    /**
     * Stop the workflow execution.
     */
    stop() {
        if (!this.running) return;

        console.log("WorkflowEngine: Stopping workflow");
        this.running = false;

        if (this.abortController) {
            this.abortController.abort();
        }

        this._emit("stop");
    }

    /**
     * Execute a single node (for manual single-node execution).
     * @param {WFNode} node - The node to execute
     */
    async executeNode(node) {
        this._emit("node-start", node.id);

        try {
            let outputs;

            if (node.packageName && node.nodeName) {
                outputs = await this._executeViaBackend(node);
            } else {
                // Fallback for nodes without backend (shouldn't happen for custom nodes)
                outputs = this._createDefaultOutputs(node);
            }

            this._emit("node-result", { id: node.id, result: outputs });
            this._emit("node-done", node.id);

            return outputs;

        } catch (error) {
            console.error(`WorkflowEngine: Node ${node.id} failed:`, error);
            this._emit("node-error", { id: node.id, error: error.message });
            throw error;
        }
    }

    /**
     * Execute a node chain recursively (node + its children).
     * @param {string} nodeId - ID of the node to execute
     * @private
     */
    async _executeChain(nodeId) {
        if (!this.running) {
            throw new Error("Workflow stopped");
        }

        const node = this.model.find(n => n.id === nodeId);
        if (!node) {
            console.warn(`WorkflowEngine: Node ${nodeId} not found in model`);
            return;
        }

        console.log(`WorkflowEngine: Executing chain for node ${nodeId} (${node.label})`);

        // 1. Resolve inputs from previous execution results
        this._resolveInputsFromResults(node);

        // 2. Execute the node
        const outputs = await this.executeNode(node);

        // 3. Store results for downstream nodes
        this.results[nodeId] = outputs;

        // 4. Execute children sequentially
        for (const childId of node.next) {
            if (!this.running) {
                throw new Error("Workflow stopped");
            }
            await this._executeChain(childId);
        }
    }

    /**
     * Resolve node inputs from previously executed nodes' outputs.
     * Uses edges to map source outputs to target inputs.
     * @param {WFNode} node - The node whose inputs need resolving
     * @private
     */
    _resolveInputsFromResults(node) {
        // Find all incoming edges to this node
        const incomingEdges = this.edges.filter(e => e.target === node.id);

        for (const edge of incomingEdges) {
            const sourceResults = this.results[edge.source];
            if (!sourceResults) {
                // Source node hasn't been executed yet (shouldn't happen with correct ordering)
                console.warn(`WorkflowEngine: Source ${edge.source} has no results yet`);
                continue;
            }

            // Parse output index from handle ID (e.g., "output_0" → 0)
            const outputIndexMatch = edge.sourceHandle.match(/output_(\d+)/);
            if (!outputIndexMatch) {
                console.warn(`WorkflowEngine: Invalid sourceHandle format: ${edge.sourceHandle}`);
                continue;
            }
            const outputIndex = parseInt(outputIndexMatch[1], 10);

            // Get the output value
            const outputData = sourceResults[outputIndex];
            if (!outputData) {
                console.warn(`WorkflowEngine: No output at index ${outputIndex} for node ${edge.source}`);
                continue;
            }

            // Find the target input and update its value
            const input = node.inputs.find(i => i.id === edge.targetHandle);
            if (input) {
                console.log(
                    `WorkflowEngine: Propagating ${edge.source}.output_${outputIndex} → ${node.id}.${edge.targetHandle}:`,
                    outputData.value
                );
                input.value = outputData.value;
            } else {
                console.warn(`WorkflowEngine: Input ${edge.targetHandle} not found on node ${node.id}`);
            }
        }
    }

    /**
     * Execute a node via the backend API.
     * @param {WFNode} node - The node to execute
     * @returns {Promise<Array>} Array of outputs [{index, name, value, type}, ...]
     * @private
     */
    async _executeViaBackend(node) {
        console.log(`WorkflowEngine: Backend execution for ${node.id}:`, {
            package: node.packageName,
            node: node.nodeName,
            inputs: node.inputs
        });

        const response = await executeNode({
            nodeId: node.id,
            packageName: node.packageName,
            nodeName: node.nodeName,
            inputs: node.inputs || []
        });

        console.log(`WorkflowEngine: Backend response for ${node.id}:`, response);

        if (response.success) {
            return response.outputs || [];
        } else {
            throw new Error(response.error || `Execution failed for node ${node.id}`);
        }
    }

    /**
     * Create default outputs for nodes without backend execution.
     * @param {WFNode} node - The node
     * @returns {Array} Array of outputs
     * @private
     */
    _createDefaultOutputs(node) {
        return (node.outputs || []).map((output, index) => ({
            index,
            name: output.name || `output_${index}`,
            value: output.value,
            type: output.type || 'any'
        }));
    }

    /**
     * Emit an event to all listeners.
     * @param {string} event - Event name
     * @param {*} payload - Event payload
     * @private
     */
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
