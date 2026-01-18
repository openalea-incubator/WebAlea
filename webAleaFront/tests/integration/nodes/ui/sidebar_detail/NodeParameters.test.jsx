import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeParameters from "../../../../../src/features/nodes/ui/sidebar_detail/NodeParameters";
import React from "react";
import { describe, test, expect, jest, beforeEach } from "@jest/globals";

/* ======================
    Mocks
====================== */

// Mock of useFlow hook
const mockUpdateNode = jest.fn();
const mockOnNodeExecute = jest.fn();

jest.mock("../../../../../src/features/workspace/providers/FlowContextDefinition.jsx", () => ({
    useFlow: () => ({
        currentNode: "node-1",
        nodes: [
            {
                id: "node-1",
                data: {
                    label: "Test Node",
                    inputs: [
                        { id: "in1", name: "Input 1", value: "A" }
                    ],
                    outputs: [
                        { id: "out1", name: "Output 1", value: "B" }
                    ]
                }
            }
        ],
        updateNode: mockUpdateNode,
        onNodeExecute: mockOnNodeExecute
    })
}));

// Mock of NodeInput and NodeOutput components
jest.mock("../../../../../src/features/nodes/ui/NodeInputs.jsx", () => ({ onInputChange }) => (
    <button
        data-testid="mock-node-input"
        onClick={() => onInputChange("in1", "NEW")}
    >
        Mock Input
    </button>
));

jest.mock("../../../../../src/features/nodes/ui/NodeOutputs.jsx", () => () => (
    <div data-testid="mock-node-output">Mock Output</div>
));

/* ======================
    Tests
====================== */

describe("NodeParameters Integration Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders message when no node is selected", () => {
        jest.spyOn(require("../../../../../src/features/workspace/providers/FlowContextDefinition.jsx"), "useFlow")
            .mockReturnValueOnce({
                currentNode: null,
                nodes: [],
            });

        render(<NodeParameters />);

        expect(
            screen.getByText("No node selected.")
        ).toBeInTheDocument();
    });

    test("renders node label", () => {
        render(<NodeParameters />);

        expect(
            screen.getByText("Test Node")
        ).toBeInTheDocument();
    });

    test("renders inputs and outputs sections", () => {
        render(<NodeParameters />);

        expect(screen.getByText("Inputs (1)")).toBeInTheDocument();
        expect(screen.getByText("Outputs (1)")).toBeInTheDocument();

        expect(screen.getByTestId("mock-node-input")).toBeInTheDocument();
        expect(screen.getByTestId("mock-node-output")).toBeInTheDocument();
    });

    test("updates node input and marks node as changed", async () => {
        const user = userEvent.setup();
        render(<NodeParameters />);

        await user.click(screen.getByTestId("mock-node-input"));

        expect(mockUpdateNode).toHaveBeenCalledWith(
            "node-1",
            {
                inputs: [
                    { id: "in1", name: "Input 1", value: "NEW" }
                ]
            }
        );
    });

    test("executes node and resets changed state when clicking launch", async () => {
        const user = userEvent.setup();
        render(<NodeParameters />);

        const launchButton = screen.getByRole("button", { name: /launch/i });

        await user.click(launchButton);

        expect(mockOnNodeExecute).toHaveBeenCalledWith("node-1");
    });
});




