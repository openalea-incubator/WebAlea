
// =============================================================================
// DEPENDENCY TRACKER
// =============================================================================

/**
 * Tracks dependencies and input states for nodes
 */
export class DependencyTracker {
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
                value: state ? (state.value ?? input.default) : (input.value ?? input.default)
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

export default DependencyTracker;
