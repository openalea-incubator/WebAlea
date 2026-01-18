import { Node } from '../../../../../src/features/workspace/model/Node';
import { describe, test, expect } from '@jest/globals';

/* ========================
    Tests
======================== */

describe("Node Class Unit Tests", () => {

    test("creates a Node with all properties", () => {
        const node = new Node({
            id: "n1",
            label: "Test Node",
            type: "custom",
            position: { x: 10, y: 20 },
            data: {
                color: "red",
                status: "active",
                metadata: { key: "value" },
                packageName: "openalea.math",
                nodeName: "addition",
                callable: "add",
                description: "My node"
            },
            inputs: [{ id: "in1", name: "x", type: "float" }],
            outputs: [{ id: "out1", name: "y", type: "float" }]
        });

        expect(node.id).toBe("n1");
        expect(node.type).toBe("custom");
        expect(node.position).toEqual({ x: 10, y: 20 });
        expect(node.data.label).toBe("Test Node");
        expect(node.data.color).toBe("red");
        expect(node.data.status).toBe("active");
        expect(node.data.metadata).toEqual({ key: "value" });
        expect(node.data.packageName).toBe("openalea.math");
        expect(node.data.nodeName).toBe("addition");
        expect(node.data.callable).toBe("add");
        expect(node.data.description).toBe("My node");
        expect(node.data.inputs).toHaveLength(1);
        expect(node.data.outputs).toHaveLength(1);
    });

    test("serialize returns correct object", () => {
        const node = new Node({ id: "n2", label: "Node2" });
        const serialized = node.serialize();

        expect(serialized).toEqual({
            id: "n2",
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
                label: "Node2",
                color: null,
                status: "ready",
                metadata: {},
                inputs: [],
                outputs: [],
                endpoint: null,
                packageName: null,
                nodeName: "Node2",
                callable: null,
                description: "",
            },
        });
    });

    test("serialize returns null if id is missing", () => {
        const node = new Node({ label: "NoID" });
        node.id = undefined; // override
        expect(node.serialize()).toBeNull();
    });

    test("serializeToJSON returns JSON string with default spacing", () => {
        const node = new Node({ id: "n3", label: "Node3" });
        const json = node.serializeToJSON();
        expect(typeof json).toBe("string");
        const obj = JSON.parse(json);
        expect(obj.id).toBe("n3");
        expect(obj.data.label).toBe("Node3");
    });

    test("serializeToJSON returns JSON string with custom spacing", () => {
        const node = new Node({ id: "n4", label: "Node4" });
        const json = node.serializeToJSON(4);
        expect(json.startsWith("{\n    ")).toBe(true); // indented
    });

    test("node uses default values when data is missing", () => {
        const node = new Node({ id: "n5" });
        expect(node.data.status).toBe("ready");
        expect(node.data.metadata).toEqual({});
        expect(node.data.nodeName).toBe(null);
        expect(node.data.description).toBe("");
    });

});