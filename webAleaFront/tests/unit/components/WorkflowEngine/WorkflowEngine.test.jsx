import WorkflowEngine, { NodeState } from "../../../../src/features/workspace/engine/WorkflowEngine";
import { executeNode } from "../../../../src/features/workspace/providers/FlowContext";
import { createCustomNode, edge } from "../../../__helpers__/workflowTestUtils";

describe("WorkflowEngine (WFNode)", () => {

    let engine;

    beforeEach(() => {
        engine = new WorkflowEngine();
        jest.clearAllMocks();
    });

    test("start sans graph", async () => {
        const result = await engine.start();
        expect(result.success).toBe(false);
    });

    test("exécution d'un node racine", async () => {
        executeNode.mockResolvedValue({
            success: true,
            outputs: [{ value: 10 }]
    });

        const graph = [
            createCustomNode({
            id: "A",
            outputs: [{ name: "out", value: 10 }]
            })
        ];

        engine.bindModel(graph, []);
        const result = await engine.start();

        expect(result.success).toBe(true);
        expect(engine.nodeStates.get("A")).toBe(NodeState.COMPLETED);
        expect(result.results.A[0].value).toBe(10);
    });

    test("propagation A → B", async () => {
        executeNode
            .mockResolvedValueOnce({
            success: true,
            outputs: [{ value: 5 }]
            })
            .mockResolvedValueOnce({
            success: true,
            outputs: [{ value: 10 }]
        });

    const graph = [
        createCustomNode({
        id: "A",
        outputs: [{ name: "out", value: 5 }]
        }),
        createCustomNode({
        id: "B",
        inputs: [{ id: "input_0", name: "x" }]
        })
    ];

    const edges = [edge("A", "B")];

    engine.bindModel(graph, edges);
    const result = await engine.start();

    expect(result.success).toBe(true);
    expect(engine.nodeStates.get("B")).toBe(NodeState.COMPLETED);
    });

    test("erreur backend → successors SKIPPED", async () => {
    executeNode.mockResolvedValue({
        success: false,
        error: "Crash"
    });

    const graph = [
        createCustomNode({ id: "A" }),
        createCustomNode({ id: "B" })
    ];

    const edges = [edge("A", "B")];

    engine.bindModel(graph, edges);
    const result = await engine.start();

    expect(result.success).toBe(false);
    expect(engine.nodeStates.get("A")).toBe(NodeState.ERROR);
    expect(engine.nodeStates.get("B")).toBe(NodeState.SKIPPED);
    });

    test("stop annule l'exécution", async () => {
    executeNode.mockImplementation(
        () => new Promise(() => {})
    );

    const graph = [createCustomNode({ id: "A" })];
    engine.bindModel(graph, []);

    engine.start();
    engine.stop();

    expect(engine.nodeStates.get("A")).toBe(NodeState.CANCELLED);
    });

});
