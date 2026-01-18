import TreeNode from '../../../../../src/features/package-manager/model/TreeNode.jsx';
import { expect, test, describe } from '@jest/globals';

/* ======================
    Tests
====================== */

describe('TreeNode', () => {
    const node = { id: 1, data: { label: "Test node" } };
    const treeNode = new TreeNode(node);

    test("Initialize Node", () => {
        expect(treeNode.node).toBe(node);
    });

    test("Serialize Node", () => {
        expect(treeNode.serialize()).toEqual({id: 1, label: "Test node", node: node });
    });

    test("Serialize extra value", () => {
        let new_node = {id: 42, data: {label : "Test extra value"}, extra: "ingored test"};
        let new_treeNode = new TreeNode(new_node);

        let serialized = new_treeNode.serialize();

        expect(new_treeNode.serialize()).toEqual(serialized);
        expect(serialized.id).toBe(42);
        expect(serialized.label).toBe("Test extra value");
        expect(serialized.node).toBe(new_node);
    });
})