import React from "react";
import { render } from "@testing-library/react";
import FlowProvider from "../../../../src/features/workspace/providers/FlowContext";
import * as FlowContextModule from "../../../../src/features/workspace/providers/FlowContextDefinition.jsx";
import * as LogModule from "../../../../src/features/logger/providers/LogContextDefinition.jsx";

// MOCKS
jest.mock("../../../../src/features/logger/providers/LogContextDefinition.jsx", () => ({
    useLog: jest.fn(),
}));

jest.mock("../../../../src/features/workspace/providers/FlowContextDefinition.jsx", () => ({
    useFlow: jest.fn(),
}));

describe("FlowContext", () => {
    let ctxMock;

    beforeEach(() => {
        jest.clearAllMocks();

        LogModule.useLog.mockReturnValue({
            addLog: jest.fn(),
        });

        ctxMock = {
            nodes: [],
            edges: [],
            executionStatus: "idle",
            executionProgress: { total: 0, completed: 0, failed: 0, percent: 0 },
            engine: {
                start: jest.fn().mockResolvedValue({ success: true }),
                bindModel: jest.fn(),
                stop: jest.fn(),
                executeNodeManual: jest.fn(),
                emit: jest.fn(),
                onUpdate: jest.fn(),
            },
            onNodeExecute: jest.fn(),
            executeWorkflow: jest.fn(),
            stopWorkflow: jest.fn(),
            updateNodeStatus: jest.fn(),
            updateNodeOutputs: jest.fn(),
            resetAllNodesStatus: jest.fn(),
        };

        FlowContextModule.useFlow.mockReturnValue(ctxMock);
    });

    test("initialisation du context", () => {
        render(<FlowProvider />);
        const ctx = FlowContextModule.useFlow();

        expect(ctx.nodes).toEqual([]);
        expect(ctx.edges).toEqual([]);
        expect(ctx.executionStatus).toBe("idle");
    });

    test("executeWorkflow appelle le moteur", async () => {
        const ctx = FlowContextModule.useFlow();
        ctx.executeWorkflow.mockResolvedValue({ success: true });

        const result = await ctx.executeWorkflow();

        expect(ctx.executeWorkflow).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    test("stopWorkflow appelle engine.stop", () => {
        const ctx = FlowContextModule.useFlow();

        ctx.stopWorkflow();

        expect(ctx.stopWorkflow).toHaveBeenCalled();
    });

    test("exécution manuelle d'un node", () => {
        const ctx = FlowContextModule.useFlow();

        ctx.onNodeExecute("node-1");

        expect(ctx.onNodeExecute).toHaveBeenCalledWith("node-1");
    });

    test("workflow terminé avec succès", () => {
        const ctx = FlowContextModule.useFlow();

        ctx.engine.emit("workflow-done", { success: true, results: {} });

        expect(ctx.engine.emit).toHaveBeenCalledWith("workflow-done", { success: true, results: {} });
    });

    test("workflow avec erreur", () => {
        const ctx = FlowContextModule.useFlow();

        ctx.engine.emit("workflow-error", { error: "boom" });

        expect(ctx.engine.emit).toHaveBeenCalledWith("workflow-error", { error: "boom" });
    });
});
