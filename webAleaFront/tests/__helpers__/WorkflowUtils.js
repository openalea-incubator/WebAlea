/**
 * WorkflowUtils.js
 * 
 * Helpers for workflows cases testing.
 */

/**
 * Creates a mock node for WorkflowEngine tests.
 * 
 * @param {*} id // Node identifier
 * @param {*} overrides // Others properties to override
 * @returns 
 */
export const createNode = (id, overrides = {}) => ({
    id,
    label: `Node ${id}`,
    type: "custom",
    inputs: [],
    outputs: [],
    packageName: "pkg",
    nodeName: "node",
    ...overrides
});

export const baseNode = {
        id: "A",
        label: "Node A",
        type: "custom",
        inputs: [],
        outputs: []
};

export const nodesUI = [
            {
            id: "A",
            type: "custom",
            data: {
                inputs: [{ name: "in1" }],
                outputs: [{ name: "out1" }],
                packageName: "pkg",
                nodeName: "NodeA",
                label: "Node A",
            },
            },
            {
            id: "B",
            type: "custom",
            data: {
                inputs: [],
                outputs: [],
            },
            },
            {
            id: "P1",
            type: "primitive",
            data: {},
            },
        ];

export const edgesUI = [
    { source: "A", target: "B" },
    { source: "P1", target: "A" },
];

