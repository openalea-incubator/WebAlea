import { WorkflowValidator } from "../../../../src/features/workspace/engine/WorkflowEngine";

describe("WorkflowValidator", () => {

    const baseNode = {
        id: "A",
        label: "Node A",
        type: "custom",
        inputs: [],
        outputs: []
    };

    test("workflow vide → erreur", () => {
        const result = WorkflowValidator.validate([], []);
        expect(result.valid).toBe(false);
        expect(result.errors[0].type).toBe("EMPTY_WORKFLOW");
    });

    test("cycle détecté", () => {
        const graph = [
            { ...baseNode, id: "A" },
            { ...baseNode, id: "B" }
        ];

        const edges = [
            { source: "A", target: "B" },
            { source: "B", target: "A" }
        ];

        const result = WorkflowValidator.validate(graph, edges);

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.type === "CYCLE_DETECTED")).toBe(true);
    });

    test("input obligatoire non connecté", () => {
        const graph = [{
            ...baseNode,
            inputs: [{ id: "i1", name: "input", optional: false }]
        }];

        const result = WorkflowValidator.validate(graph, []);

        expect(result.valid).toBe(false);
        expect(result.errors[0].type).toBe("UNCONNECTED_INPUT");
    });

    test("warning si package manquant", () => {
        const graph = [{ ...baseNode, type: "custom" }];

        const result = WorkflowValidator.validate(graph, []);

        expect(result.valid).toBe(true);
        expect(result.warnings[0].type).toBe("MISSING_PACKAGE");
    });

});
