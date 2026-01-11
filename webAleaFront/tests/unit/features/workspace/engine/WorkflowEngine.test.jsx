import { beforeEach } from "@jest/globals";
import WorkflowEngine, { NodeState } from "../../../../../src/features/workspace/engine/WorkflowEngine";
import { createCustomNode } from "../../../../__helpers__/workflowTestUtils";
import { act } from "@testing-library/react";

describe("WorkflowEngine (WFNode)", () => {

    let engine;

    beforeEach(() => {
        engine = new WorkflowEngine();
    });

    test("start should initialize the engine", async () => {
        const startResult = await engine.start();
        expect(startResult).toBe(true);
    });

    test("executeNode should call executeNodeManual on the engine", async () => {
        const node = createCustomNode("node-1", "TestNode", { someParam: 42 });

        await act(async () => {
            await engine.executeNodeManual(node.id);
        });

        expect(WorkflowEngine.prototype.executeNodeManual).toHaveBeenCalledWith(node.id);
    });

    test("NodeState constants should be defined correctly", () => {
        expect(NodeState.PENDING).toBe("pending");
        expect(NodeState.READY).toBe("ready");
        expect(NodeState.RUNNING).toBe("running");
        expect(NodeState.COMPLETED).toBe("completed");
        expect(NodeState.ERROR).toBe("error");
        expect(NodeState.SKIPPED).toBe("skipped");
        expect(NodeState.CANCELLED).toBe("cancelled");
    }); 
});
