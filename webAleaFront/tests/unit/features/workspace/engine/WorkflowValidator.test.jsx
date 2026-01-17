import { WorkflowValidator } from "../../../../../src/features/workspace/engine/WorkflowEngine";
import { baseNode } from "../../../../__helpers__/WorkflowUtils.js";
import { 
    jest, beforeEach, test, expect, describe
} 
from "@jest/globals";

/* ================================================================== */
/* MOCKS */
/* ================================================================== */

jest.mock("../../../../../src/config/api", () => ({
    API_BASE_URL: "http://test-api"
}));

/* ================================================================== */
/* TESTS */
/* ================================================================== */

describe("WorkflowValidator Units Tests", () => {

    test("empty workflow => error", () => {
        const result = WorkflowValidator.validate([], []);
        expect(result.valid).toBe(false);
        expect(result.errors[0].type).toBe("EMPTY_WORKFLOW");
    });

    test("cycle detected", () => {
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

    test("unconnected required input", () => {
        const graph = [{
            ...baseNode,
            inputs: [{ id: "i1", name: "input", optional: false }]
        }];

        const result = WorkflowValidator.validate(graph, []);

        expect(result.valid).toBe(false);
        expect(result.errors[0].type).toBe("UNCONNECTED_INPUT");
    });

    test("missing package warning", () => {
        const graph = [{ ...baseNode, type: "custom" }];

        const result = WorkflowValidator.validate(graph, []);

        expect(result.valid).toBe(true);
        expect(result.warnings[0].type).toBe("MISSING_PACKAGE");
    });

});
