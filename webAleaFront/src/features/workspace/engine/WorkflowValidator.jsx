// =============================================================================
// WORKFLOW VALIDATOR
// =============================================================================

import { NodeType } from '../constants/workflowConstants.js';

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
            if (!node.packageName && node.type === NodeType.CUSTOM) {
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

export default WorkflowValidator;