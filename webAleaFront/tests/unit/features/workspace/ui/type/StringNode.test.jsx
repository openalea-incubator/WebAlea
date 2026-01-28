import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StringNode from "../../../../../../src/features/workspace/ui/type/StringNode";
import { beforeEach, describe, test, expect } from "@jest/globals";

// =======================
// Mocks
// =======================
    jest.mock("../../../../../../src/features/workspace/providers/FlowContextDefinition", () => ({
        useFlow: jest.fn(),
    }));

    jest.mock("../../../../../../src/features/logger/providers/LogContextDefinition.jsx", () => ({
        useLog: jest.fn(),
    }));

    jest.mock("../../../../../../src/features/workspace/ui/CustomHandle.jsx", () => ({
        __esModule: true,
        default: ({ id, style, dataType }) => (
            <div data-testid="custom-handle" data-id={id} data-type={dataType} style={style}></div>
        ),
    }));

    // =======================
    // Tests
    // =======================
    describe("StringNode Unit Tests", () => {
        let updateNodeMock;
        let addLogMock;

        beforeEach(() => {
            jest.clearAllMocks();

            updateNodeMock = jest.fn();
            addLogMock = jest.fn();

            require("../../../../../../src/features/workspace/providers/FlowContextDefinition").useFlow.mockReturnValue({
            updateNode: updateNodeMock,
            });

            require("../../../../../../src/features/logger/providers/LogContextDefinition.jsx").useLog.mockReturnValue({
            addLog: addLogMock,
            });
        });

        test("renders node with input and handle", () => {
            render(<StringNode id="node-1" data={{ outputs: [{ value: "hello", id: "out-1" }] }} />);

            const input = screen.getByRole("textbox");
            expect(input.value).toBe("hello");

            const handle = screen.getByTestId("custom-handle");
            expect(handle.dataset.id).toBe("out-1");
            expect(handle.dataset.type).toBe("output");
        });

        test("calls updateNode and addLog on initial render", () => {
            render(<StringNode id="node-2" data={{ outputs: [{ value: "world", id: "out-2" }] }} />);

            expect(updateNodeMock).toHaveBeenCalledWith("node-2", {
            outputs: [{ value: "world", id: "out-2", type: "string" }],
            });
            expect(addLogMock).toHaveBeenCalledWith("StringNode node-2 updated. value = world");
        });

        test("changes value when input is changed", () => {
            render(<StringNode id="node-3" data={{ outputs: [{ value: "foo", id: "out-3" }] }} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "bar" } });
            expect(input.value).toBe("bar");

            fireEvent.blur(input); // handleBlur
            expect(updateNodeMock).toHaveBeenNthCalledWith(2, "node-3", {
                outputs: [{ id: "out-3", type: "string", value: "bar" }],
            });
        });

        test("generates default output id if not provided", () => {
            render(<StringNode id="node-4" data={{ outputs: [] }} />);

            const handle = screen.getByTestId("custom-handle");
            expect(handle.dataset.id).toBe("out-node-4-0");
        });

        test("handles absence of data.outputs gracefully", () => {
            render(<StringNode id="node-5" data={{}} />);

            const input = screen.getByRole("textbox");
            expect(input.value).toBe("");

            const handle = screen.getByTestId("custom-handle");
            expect(handle.dataset.type).toBe("output");
        });
});
