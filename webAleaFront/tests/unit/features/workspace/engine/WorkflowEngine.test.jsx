/* ------------------------------------------------------------------ */
/* MOCK BACKEND API */
/* ------------------------------------------------------------------ */
jest.mock(
    "../../../../../src/api/runnerAPI.js",
    () => ({
        executeNode: jest.fn()
    })
);

/* ========================================================= */
/* IMPORTS */
/* ========================================================= */


import WorkflowEngine, {
    WorkflowValidator
} from "../../../../../src/features/workspace/engine/WorkflowEngine";

import { NodeState } from "../../../../../src/features/workspace/Utils/workflowUtils.js";

import { executeNode } from "../../../../../src/api/runnerAPI.js";
import {
    describe,
    test,
    expect,
    beforeEach
} from "@jest/globals";


/* ------------------------------------------------------------------ */
/* MOCK VALIDATOR 
/* ------------------------------------------------------------------ */
jest.spyOn(WorkflowValidator, "validate");

/* ------------------------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------------------------ */
import { createNode } from "../../../../__helpers__/WorkflowUtils.js";

/* ================================================================== */
/* TESTS */
/* ================================================================== */

describe("WorkflowEngine - Units Tests", () => {

    let engine;

    beforeEach(() => {
        jest.clearAllMocks();
        engine = new WorkflowEngine();
    });

    /* --------------------------------------------------------------- */
    /* CONSTRUCTOR */
    /* --------------------------------------------------------------- */

    test("default initialization", () => {
        expect(engine.running).toBe(false);
        expect(engine.graph).toEqual([]);
        expect(engine.edges).toEqual([]);
        expect(engine.results).toEqual({});
        expect(engine.nodeStates.size).toBe(0);
    });

    /* --------------------------------------------------------------- */
    /* bindModel */
    /* --------------------------------------------------------------- */

    test("bindModel initializes the graph and resets the state", () => {
        const graph = [createNode("A")];
        const edges = [];

        engine.bindModel(graph, edges);

        expect(engine.graph).toBe(graph);
        expect(engine.edges).toBe(edges);
        expect(engine.nodeStates.get("A")).toBe(NodeState.PENDING);
    });

    /* --------------------------------------------------------------- */
    /* start() – guards */
    /* --------------------------------------------------------------- */

    test("start fails if no model is bound", async () => {
        const result = await engine.start();

        expect(result.success).toBe(false);
        expect(result.error).toBe("No model bound");
    });

    test("start fails if already running", async () => {
        engine.running = true;

        const result = await engine.start();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Already running");
    });

    test("start fails if validation is invalid", async () => {
        WorkflowValidator.validate.mockReturnValueOnce({
            valid: false,
            errors: [{ type: "ERROR" }],
            warnings: []
        });

        engine.bindModel([createNode("A")], []);

        const listener = jest.fn();
        engine.onUpdate(listener);

        const result = await engine.start();

        expect(result.success).toBe(false);
        expect(listener).toHaveBeenCalledWith(
            "validation-error",
            { errors: [{ type: "ERROR" }] }
        );
    });

    test("start emits a warning if validation has warnings", async () => {
        WorkflowValidator.validate.mockReturnValueOnce({
            valid: true,
            errors: [],
            warnings: [{ type: "WARN" }]
        });

        engine.bindModel([createNode("A")], []);

        const listener = jest.fn();
        engine.onUpdate(listener);

        await engine.start();

        expect(listener).toHaveBeenCalledWith(
            "validation-warnings",
            { warnings: [{ type: "WARN" }] }
        );
    });

    /* --------------------------------------------------------------- */
    /* stop() */
    /* --------------------------------------------------------------- */

    test("stop cancels active nodes", () => {
        engine.running = true;
        engine.graph = [createNode("A"), createNode("B")];

        engine.nodeStates.set("A", NodeState.RUNNING);
        engine.nodeStates.set("B", NodeState.PENDING);

        const listener = jest.fn();
        engine.onUpdate(listener);

        engine.stop();

        expect(engine.nodeStates.get("A")).toBe(NodeState.CANCELLED);
        expect(engine.nodeStates.get("B")).toBe(NodeState.CANCELLED);
        expect(listener).toHaveBeenCalledWith("workflow-stopped", {});
    });

    /* --------------------------------------------------------------- */
    /* executeNodeManual */
    /* --------------------------------------------------------------- */

    test("executeNodeManual returns outputs if backend succeeds", async () => {
        const node = createNode("A");

        executeNode.mockResolvedValueOnce({
            success: true,
            outputs: [{ value: 123 }]
        });

        const outputs = await engine.executeNodeManual(node);

        expect(outputs).toEqual([{ value: 123 }]);
        expect(executeNode).toHaveBeenCalledTimes(1);
    });

    test("executeNodeManual throws an error if backend fails", async () => {
        const node = createNode("A");

        executeNode.mockResolvedValueOnce({
            success: false,
            error: "Backend error"
        });

        await expect(engine.executeNodeManual(node))
            .rejects.toThrow("Backend error");
    });

    /* --------------------------------------------------------------- */
    /* NodeState */
    /* --------------------------------------------------------------- */

    test("NodeState constants", () => {
        expect(NodeState).toEqual({
            PENDING: "pending",
            READY: "ready",
            RUNNING: "running",
            COMPLETED: "completed",
            ERROR: "error",
            SKIPPED: "skipped",
            CANCELLED: "cancelled"
        });
    });

});
