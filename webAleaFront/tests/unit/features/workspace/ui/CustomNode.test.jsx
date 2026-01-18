import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, test, expect } from "@jest/globals";

import CustomNode from "../../../../../src/features/workspace/ui/CustomNode.jsx";
import { useFlow } from "../../../../../src/features/workspace/providers/FlowContextDefinition.jsx";

/* =======================
    Mocks
======================= */

// Mock react-flow (Handle & Position inutilisés ici mais requis)
jest.mock("@xyflow/react", () => ({
    Handle: () => null,
    Position: {
        Left: "left",
        Right: "right",
    },
}));

// Mock CustomHandle (on ne teste PAS CustomHandle ici)
jest.mock(
    "../../../../../src/features/workspace/ui/CustomHandle.jsx",
    () => (props) => (
        <div
            data-testid={`custom-handle-${props.dataType}`}
            data-id={props.id}
        />
    )
);

// Mock FlowContext
jest.mock(
    "../../../../../src/features/workspace/providers/FlowContextDefinition.jsx",
    () => {
        const { jest } = require("@jest/globals");
        return {
            useFlow: jest.fn(),
        };
    }
);

/* =======================
    Helpers
======================= */

const baseNodeProps = {
    id: "node-1",
    data: {
        label: "My Node",
        color: "#ffffff",
        status: "ready",
        metadata: null,
        inputs: [],
        outputs: [],
    },
};

/* =======================
    Tests
======================= */

describe("CustomNode Unit Tests", () => {
    let updateNodeMock;

    beforeEach(() => {
        updateNodeMock = jest.fn();

        useFlow.mockReturnValue({
            updateNode: updateNodeMock,
        });
    });

    test("renders node with label and id", () => {
        render(<CustomNode {...baseNodeProps} />);

        expect(screen.getByText("My Node")).toBeInTheDocument();

        const node = screen.getByText("My Node").closest(".custom-node");
        expect(node).toHaveAttribute("data-node-id", "node-1");
    });

    test("applies correct border color based on status", () => {
        render(
            <CustomNode
                {...baseNodeProps}
                data={{ ...baseNodeProps.data, status: "error" }}
            />
        );

        const node = screen.getByText("My Node").closest(".custom-node");
        expect(node.style.border).toContain("rgb(198, 40, 40)");
    });

    test("computes correct dynamic height with inputs and outputs", () => {
        render(
            <CustomNode
                {...baseNodeProps}
                data={{
                    ...baseNodeProps.data,
                    inputs: [{ id: "i1" }, { id: "i2" }],
                    outputs: [{ id: "o1" }],
                }}
            />
        );

        const node = screen.getByText("My Node").closest(".custom-node");

        // height = 44 + 12 * max(inputs, outputs)
        // max(2,1) = 2 => 44 + 24 = 68
        expect(node.style.height).toBe("68px");
    });

    test("renders metadata section when metadata is provided", () => {
        render(
            <CustomNode
                {...baseNodeProps}
                data={{
                    ...baseNodeProps.data,
                    metadata: { foo: "bar" },
                }}
            />
        );

        expect(screen.getByText("Détails")).toBeInTheDocument();
        expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
    });

    test("does not render metadata section if metadata is empty", () => {
        render(<CustomNode {...baseNodeProps} />);

        expect(screen.queryByText("Détails")).not.toBeInTheDocument();
    });

    test("renders correct number of input handles", () => {
        render(
            <CustomNode
                {...baseNodeProps}
                data={{
                    ...baseNodeProps.data,
                    inputs: [{ id: "i1" }, { id: "i2" }],
                }}
            />
        );

        const inputs = screen.getAllByTestId("custom-handle-input");
        expect(inputs).toHaveLength(2);
    });

    test("renders correct number of output handles", () => {
        render(
            <CustomNode
                {...baseNodeProps}
                data={{
                    ...baseNodeProps.data,
                    outputs: [{ id: "o1" }, { id: "o2" }, { id: "o3" }],
                }}
            />
        );

        const outputs = screen.getAllByTestId("custom-handle-output");
        expect(outputs).toHaveLength(3);
    });

    test("renders node even with no inputs and no outputs", () => {
        render(<CustomNode {...baseNodeProps} />);

        expect(screen.getByText("My Node")).toBeInTheDocument();
    });
});
