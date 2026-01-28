/**
 * WorkflowGraph.jsx
 * Model and utilities for workflow graph representation.
 */

import { NodeType } from '../constants/workflowConstants.js';

export class WFNode {
    constructor({ id, type, inputs = [], outputs = [], next = [], packageName = null, nodeName = null, label = null }) {
        this.id = id;
        this.type = type;
        this.inputs = inputs;
        this.outputs = outputs;
        this.next = next; // Direct children node IDs (custom nodes only)
        this.packageName = packageName;
        this.nodeName = nodeName;
        this.label = label;
    }
}

/**
 * Build a graph model from React Flow nodes and edges.
 * Only includes custom nodes (excludes primitives).
 * Primitives' values are already propagated to custom nodes' inputs via CustomHandle.
 *
 * @param {Array} nodesUI - React Flow nodes
 * @param {Array} edgesUI - React Flow edges
 * @returns {{graph: WFNode[], edges: Array}} Graph model and edges between custom nodes
 */
export function buildGraphModel(nodesUI, edgesUI) {
    const graph = [];

    // Get IDs of custom nodes only
    const customNodeIds = new Set(
        nodesUI.filter(n => n.type === NodeType.CUSTOM).map(n => n.id)
    );

    // Filter edges to only include connections between custom nodes
    const customEdges = edgesUI.filter(edge =>
        customNodeIds.has(edge.source) && customNodeIds.has(edge.target)
    );

    for (const nodeUI of nodesUI) {
        if (nodeUI.type !== NodeType.CUSTOM) continue;

        // Children = only custom nodes connected via edges
        const children = customEdges
            .filter(edge => edge.source === nodeUI.id)
            .map(edge => edge.target);

        // Deep clone inputs/outputs to avoid mutating React state
        const inputs = (nodeUI.data.inputs ?? []).map(inp => ({ ...inp }));
        const outputs = (nodeUI.data.outputs ?? []).map(out => ({ ...out }));

        graph.push(new WFNode({
            id: nodeUI.id,
            type: nodeUI.type,
            inputs,
            outputs,
            next: children,
            packageName: nodeUI.data.packageName ?? null,
            nodeName: nodeUI.data.nodeName ?? null,
            label: nodeUI.data.label ?? null
        }));
    }

    return { graph, edges: customEdges };
}

/**
 * Find root nodes in the graph.
 * Root nodes are custom nodes that have no incoming edges from other custom nodes.
 * (They may have incoming edges from primitives, but those are not in the graph)
 *
 * @param {WFNode[]} graph - The workflow graph
 * @returns {string[]} Array of root node IDs
 */
export function getRootNodes(graph) {
    // Collect all node IDs that are children of another node
    const allChildIds = new Set();

    for (const node of graph) {
        for (const childId of node.next) {
            allChildIds.add(childId);
        }
    }

    // Root nodes are nodes that are NOT children of any other node
    const rootIds = graph
        .filter(node => !allChildIds.has(node.id))
        .map(node => node.id);

    console.log("Root nodes:", rootIds);
    return rootIds;
}
