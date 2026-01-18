import { render, screen } from "@testing-library/react";
import NodeDescription from "../../../../../src/features/nodes/ui/sidebar_detail/NodeDescription";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { within } from "@testing-library/react";

/* ======================
    Mocks
====================== */

jest.mock("../../../../../src/features/workspace/providers/FlowContextDefinition.jsx", () => ({
    useFlow: jest.fn()
}));

import { useFlow } from "../../../../../src/features/workspace/providers/FlowContextDefinition.jsx";

const mockUseFlow = (override = {}) => {
    useFlow.mockReturnValue({
        currentNode: "node-1",
        nodes: [
            {
                id: "node-1",
                data: {
                    label: "Test Node",
                    inputs: [
                        { name: "in1", type: "string" },
                        { name: "in2", type: "float" }
                    ],
                    outputs: [
                        { name: "out1", type: "string" }
                    ],
                    status: "Active"
                }
            }
        ],
        ...override
    });
};

/* ======================
    Tests
====================== */

describe("NodeDescription Integration Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders 'No node selected.' when no node is selected", () => {
        mockUseFlow({
            currentNode: null,
            nodes: []
        });

        render(<NodeDescription />);

        expect(
            screen.getByText("No node selected.")
        ).toBeInTheDocument();
    });

    test("renders node details", () => {
        mockUseFlow();

        render(<NodeDescription />);

        expect(screen.getByText("Node Details")).toBeInTheDocument();
        expect(screen.getByText("Test Node")).toBeInTheDocument();
    });

    test("renders input list with names and types", () => {
        mockUseFlow();

        render(<NodeDescription />);

        expect(screen.getByText("Entrées (2) :")).toBeInTheDocument();

        expect(screen.getByText("in1")).toBeInTheDocument();
        expect(screen.getByText("in2")).toBeInTheDocument();

        const stringTypes = screen.getAllByText("(string)");
        expect(stringTypes.length).toBeGreaterThanOrEqual(1);

        expect(screen.getByText("(float)")).toBeInTheDocument();
    });

    test("renders output list with names and types", () => {
        mockUseFlow();
        render(<NodeDescription />);

        const outputsSection = screen.getByText("Sorties (1) :").parentElement;
        const utils = within(outputsSection);

        expect(utils.getByText("out1")).toBeInTheDocument();
        expect(utils.getByText("(string)")).toBeInTheDocument();
    });

    test("renders Active status with success badge", () => {
        mockUseFlow();

        render(<NodeDescription />);

        const badge = screen.getByText("Active");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass("bg-success");
    });

    test("renders inactive status with secondary badge", () => {
        mockUseFlow({
            nodes: [
                {
                    id: "node-1",
                    data: {
                        label: "Test Node",
                        inputs: [],
                        outputs: [],
                        status: "Inactive"
                    }
                }
            ]
        });

        render(<NodeDescription />);

        const badge = screen.getByText("Inactive");
        expect(badge).toHaveClass("bg-secondary");
    });
});

