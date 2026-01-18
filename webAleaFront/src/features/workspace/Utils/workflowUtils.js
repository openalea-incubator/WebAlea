/**
 * Utility functions and constants for workflow management
 */


/**
 * Enum for node execution states
 */
export const NodeState = {
    PENDING: 'pending',     // Waiting for dependencies
    READY: 'ready',         // Ready to run
    RUNNING: 'running',     // In execution
    COMPLETED: 'completed', // Successfully completed
    ERROR: 'error',         // Failed during execution
    SKIPPED: 'skipped',     // Skipped due to dependency failure
    CANCELLED: 'cancelled'  // Cancelled by user
};


// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Computes a topological order of nodes in the graph using Kahn's algorithm
 * @param {Array} graph - List of nodes in the workflow
 * @param {Array} edges - List of edges in the workflow
 * @returns {Array} - List of node IDs in topological order
 */
export function computeTopologicalOrder(graph, edges) {
    const inDegree = new Map();
    const adjacency = new Map();

    graph.forEach(node => {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    });

    // Compute in-degrees and adjacency list
    edges.forEach(edge => {
        const current = inDegree.get(edge.target) || 0;
        inDegree.set(edge.target, current + 1);

        if (adjacency.has(edge.source)) {
            adjacency.get(edge.source).push(edge.target);
        }
    });

    const queue = [];
    inDegree.forEach((degree, nodeId) => {
        if (degree === 0) queue.push(nodeId);
    });

    const order = [];
    while (queue.length > 0) {
        const nodeId = queue.shift();
        order.push(nodeId);

        const neighbors = adjacency.get(nodeId) || [];
        for (const neighbor of neighbors) {
            const newDegree = inDegree.get(neighbor) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (order.length !== graph.length) {
        throw new Error("Cycle detected in workflow");
    }

    return order;
}