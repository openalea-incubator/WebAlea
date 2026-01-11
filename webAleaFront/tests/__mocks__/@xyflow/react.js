export const useNodesState = (initial = []) => {
    let nodes = initial;
    const setNodes = jest.fn(updater => {
    nodes = typeof updater === 'function' ? updater(nodes) : updater;
    });
    return [nodes, setNodes, jest.fn()];
};

export const useEdgesState = (initial = []) => {
    let edges = initial;
    const setEdges = jest.fn(updater => {
    edges = typeof updater === 'function' ? updater(edges) : updater;
    });
    return [edges, setEdges, jest.fn()];
};

export const addEdge = jest.fn((params, edges) => [...edges, params]);
