
export class WFNode {
    constructor({ id, type, inputs = [], outputs = [], next = [] }) {
        this.id = id;
        this.type = type;
        this.inputs = inputs;
        this.outputs = outputs;
        this.next = next; // Direct children node IDs
    }
}


export function buildGraphModel(nodesUI, edgesUI) {
    const graph = [];

    for (const nodeUI of nodesUI) {
      if (nodeUI.type !== 'custom') continue;
        // Filtre les enfants valides
        const children = edgesUI
            .filter(edge => edge.source === nodeUI.id && nodesUI.some(n => n.id === edge.target))
            .map(edge => edge.target);

        graph.push(new WFNode({
            id: nodeUI.id,
            type: nodeUI.type,
            inputs: nodeUI.data.inputs ?? [],
            outputs: nodeUI.data.outputs ?? [],
            next: children
        }));
    }

    return graph;
}


export function getRootNodes(graph) {
    const allChildIds = new Set();

    Object.values(graph).forEach(node => {
        node.next.forEach(childId => allChildIds.add(childId));
    });
    console.log("All child IDs:", allChildIds);
    return Object.values(graph)
        .filter(node => !allChildIds.has(node.id))
        .map(node => node.id);
}
