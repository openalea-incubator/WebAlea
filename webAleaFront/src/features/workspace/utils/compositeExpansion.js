/**
 * compositeExpansion.js
 *
 * Expands composite nodes into their internal graph before execution.
 * Handles nested composites by iterating until no composite remains or maxDepth reached.
 */

function getNodeLabel(node) {
    return node?.data?.label || node?.data?.nodeName || node?.id || "node";
}

function buildExposedPorts(graph) {
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph?.edges) ? graph.edges : [];

    const targetedInputs = new Set();
    const sourcedOutputs = new Set();

    edges.forEach(edge => {
        if (edge?.target && edge?.targetHandle) {
            targetedInputs.add(`${edge.target}::${edge.targetHandle}`);
        }
        if (edge?.source && edge?.sourceHandle) {
            sourcedOutputs.add(`${edge.source}::${edge.sourceHandle}`);
        }
    });

    const exposedInputs = [];
    const exposedOutputs = [];

    nodes.forEach(node => {
        const label = getNodeLabel(node);
        const inputs = node?.data?.inputs || [];
        const outputs = node?.data?.outputs || [];

        inputs.forEach((input, index) => {
            const handleId = input?.id || `port_${index}_${input?.name || "in"}`;
            const key = `${node.id}::${handleId}`;
            if (!targetedInputs.has(key)) {
                exposedInputs.push({
                    name: `${label}_${input?.name || `in_${index}`}`,
                    nodeId: node.id,
                    handleId
                });
            }
        });

        outputs.forEach((output, index) => {
            const handleId = output?.id || `port_${index}_${output?.name || "out"}`;
            const key = `${node.id}::${handleId}`;
            if (!sourcedOutputs.has(key)) {
                exposedOutputs.push({
                    name: `${label}_${output?.name || `out_${index}`}`,
                    nodeId: node.id,
                    handleId
                });
            }
        });
    });

    return { exposedInputs, exposedOutputs };
}

function mapCompositePorts(compositeNode, graph) {
    const { exposedInputs, exposedOutputs } = buildExposedPorts(graph);
    const compositeInputs = compositeNode?.data?.inputs || [];
    const compositeOutputs = compositeNode?.data?.outputs || [];

    const inputMap = new Map();
    const outputMap = new Map();
    const handleIndexRegex = /^port_(\d+)_/;

    compositeInputs.forEach((input, index) => {
        const match = exposedInputs.find(p => p.name === input.name) || exposedInputs[index];
        if (match) {
            const handleIndexMatch = match.handleId?.match?.(handleIndexRegex);
            inputMap.set(input.id, {
                ...match,
                handleIndex: handleIndexMatch ? Number(handleIndexMatch[1]) : null
            });
        }
    });

    compositeOutputs.forEach((output, index) => {
        const match = exposedOutputs.find(p => p.name === output.name) || exposedOutputs[index];
        if (match) {
            const handleIndexMatch = match.handleId?.match?.(handleIndexRegex);
            outputMap.set(output.id, {
                ...match,
                handleIndex: handleIndexMatch ? Number(handleIndexMatch[1]) : null
            });
        }
    });

    return { inputMap, outputMap };
}

function prefixGraph(graph, prefix) {
    const nodes = (graph?.nodes || []).map(node => ({
        ...node,
        id: `${prefix}::${node.id}`
    }));

    const edges = (graph?.edges || []).map(edge => ({
        ...edge,
        id: edge.id ? `${prefix}::${edge.id}` : edge.id,
        source: `${prefix}::${edge.source}`,
        target: `${prefix}::${edge.target}`
    }));

    return { nodes, edges };
}

function expandOneComposite(nodes, edges, compositeNode) {
    const graph = compositeNode?.data?.graph;
    if (!graph || !Array.isArray(graph.nodes)) {
        return { nodes, edges, expanded: false, mapping: null };
    }

    const { inputMap, outputMap } = mapCompositePorts(compositeNode, graph);
    const prefixed = prefixGraph(graph, compositeNode.id);
    const internalIds = prefixed.nodes.map(node => node.id);

    const remappedEdges = edges.map(edge => {
        if (edge.source === compositeNode.id) {
            const mapped = outputMap.get(edge.sourceHandle);
            if (!mapped) return null;
            return {
                ...edge,
                source: `${compositeNode.id}::${mapped.nodeId}`,
                sourceHandle: mapped.handleId
            };
        }
        if (edge.target === compositeNode.id) {
            const mapped = inputMap.get(edge.targetHandle);
            if (!mapped) return null;
            return {
                ...edge,
                target: `${compositeNode.id}::${mapped.nodeId}`,
                targetHandle: mapped.handleId
            };
        }
        return edge;
    }).filter(Boolean);

    const nextNodes = nodes
        .filter(n => n.id !== compositeNode.id)
        .concat(prefixed.nodes);

    const nextEdges = remappedEdges.concat(prefixed.edges);

    return {
        nodes: nextNodes,
        edges: nextEdges,
        expanded: true,
        mapping: {
            compositeId: compositeNode.id,
            inputMap,
            outputMap,
            internalIds
        }
    };
}

export function expandComposites(nodes, edges, maxDepth = 5) {
    let currentNodes = nodes;
    let currentEdges = edges;
    let depth = 0;
    const mappings = [];

    while (depth < maxDepth) {
        const composite = currentNodes.find(n => n?.data?.nodekind === "composite" && n?.data?.graph);
        if (!composite) break;
        const result = expandOneComposite(currentNodes, currentEdges, composite);
        currentNodes = result.nodes;
        currentEdges = result.edges;
        if (result.mapping) {
            mappings.push(result.mapping);
        }
        if (!result.expanded) break;
        depth += 1;
    }

    return { nodes: currentNodes, edges: currentEdges, mappings };
}
