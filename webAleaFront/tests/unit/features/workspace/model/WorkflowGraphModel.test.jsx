import { expect, test, describe } from "@jest/globals";
import {
    WFNode,
    buildGraphModel,
    getRootNodes,
} from "../../../../../src/features/workspace/model/WorkflowGraph";

describe("WFNode class", () => {
    test("WFNode instance is created correctly", () => {
        const nodeData = {
            id: "node1",
            type: "custom",
            inputs: [{ name: "input1" }],
            outputs: [{ name: "output1" }],
            next: ["node2", "node3"],
            packageName: "examplePackage",
            nodeName: "ExampleNode",
            label: "This is an example node",
        };
        const wfNode = new WFNode(nodeData);

        expect(wfNode).toBeInstanceOf(WFNode);
        expect(wfNode.id).toBe(nodeData.id);
        expect(wfNode.type).toBe(nodeData.type);
        expect(wfNode.inputs).toEqual(nodeData.inputs);
        expect(wfNode.outputs).toEqual(nodeData.outputs);
        expect(wfNode.next).toEqual(nodeData.next);
        expect(wfNode.packageName).toBe(nodeData.packageName);
        expect(wfNode.nodeName).toBe(nodeData.nodeName);
        expect(wfNode.label).toBe(nodeData.label);
    });
});

describe("WorkflowGraph model", () => {
    test("buildGraphModel builds a graph with custom nodes only", () => {
        // ARRANGE — données d’entrée
        const nodesUI = [
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

        const edgesUI = [
            { source: "A", target: "B" },
            { source: "P1", target: "A" },
        ];

        // ACT — appel de la fonction testée
        const { graph, edges } = buildGraphModel(nodesUI, edgesUI);

        // ASSERT — vérifications
        expect(graph).toHaveLength(2);           // seulement les custom
        expect(edges).toHaveLength(1);           // seulement A → B

        expect(graph[0]).toBeInstanceOf(WFNode); // vraie instance
        expect(graph[0].id).toBe("A");
        expect(graph[0].next).toEqual(["B"]);
    });

    test("getRootNodes returns nodes with no incoming edges", () => {
        const graph = [
            new WFNode({ id: "A", type: "custom", next: ["B"] }),
            new WFNode({ id: "B", type: "custom", next: [] }),
            new WFNode({ id: "C", type: "custom", next: [] }),
        ];

        const roots = getRootNodes(graph);

        expect(roots).toEqual(["A", "C"]);
    });

    test("getRootNodes returns empty array when all nodes have incoming edges", () => {
        const graph = [
            new WFNode({ id: "A", type: "custom", next: ["B"] }),
            new WFNode({ id: "B", type: "custom", next: ["C"] }),
            new WFNode({ id: "C", type: "custom", next: [] }),
        ];
        const roots = getRootNodes(graph);

        expect(roots).toEqual([]);
    });
});

describe("WorkflowValidation class", () => {
    
})


