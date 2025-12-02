import { WFNode } from "./WFNode.js";

export function buildGraphModel(nodesUI, edgesUI) {
    const map = {};

    // convertir les nodes UI → nodes métier
    nodesUI.forEach(node => {
    map[node.id] = new WFNode({
        id: node.id,
        type: node.type,
        data: node.data,
        next: []
    });
    });

    // connecter les children
    edgesUI.forEach(edge => {
    map[edge.source].next.push(edge.target);
    });

  return map; // dictionnaire { nodeId: WFNode }
}
