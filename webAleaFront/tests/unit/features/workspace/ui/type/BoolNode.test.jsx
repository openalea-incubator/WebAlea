import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BoolNode from "../../../../../../src/features/workspace/ui/type/BoolNode";
import { beforeEach, describe, test, expect } from "@jest/globals";


/* =====================
    Mocks
===================== */

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

/* =====================
    Tests
===================== */

    describe("BoolNode Unit Tests", () => {
        let updateNodeMock;
        let addLogMock;

        beforeEach(() => {
            jest.clearAllMocks();

            updateNodeMock = jest.fn();
            addLogMock = jest.fn();

        // Retour des hooks
            require("../../../../../../src/features/workspace/providers/FlowContextDefinition").useFlow.mockReturnValue({
                updateNode: updateNodeMock,
            });

            require("../../../../../../src/features/logger/providers/LogContextDefinition.jsx").useLog.mockReturnValue({
                addLog: addLogMock,
            });
        });

        test("renders node with select and handle", () => {
            render(<BoolNode id="node-1" data={{ outputs: [{ value: true, id: "out-1" }] }} selected={true} />);

            const select = screen.getByRole("combobox");
            expect(select.value).toBe("true");

            const handle = screen.getByTestId("custom-handle");
            expect(handle.dataset.id).toBe("out-1");
            expect(handle.dataset.type).toBe("output");
        });

        test("calls updateNode and addLog on initial render", () => {
            render(<BoolNode id="node-2" data={{ outputs: [{ value: false, id: "out-2" }] }} />);

            expect(updateNodeMock).toHaveBeenCalledWith("node-2", {
                outputs: [{ value: false, id: "out-2", type: "boolean" }],
            });
            expect(addLogMock).toHaveBeenCalledWith("BooleanNode node-2 updated. value = false");
        });

        test("changes value when select is changed", () => {
            render(<BoolNode id="node-3" data={{ outputs: [{ value: false, id: "out-3" }] }} />);

            const select = screen.getByRole("combobox");
            fireEvent.change(select, { target: { value: "true" } });

            expect(updateNodeMock).toHaveBeenLastCalledWith("node-3", {
                outputs: [{ value: true, id: "out-3", type: "boolean" }],
            });

            expect(addLogMock).toHaveBeenCalledTimes(2);
            expect(addLogMock).toHaveBeenNthCalledWith(
            1,
            "BooleanNode node-3 updated. value = false"
            );
            expect(addLogMock).toHaveBeenNthCalledWith(
            2,
            "BooleanNode node-3 updated. value = true"
            );


            fireEvent.change(select, { target: { value: "false" } });
            expect(updateNodeMock).toHaveBeenLastCalledWith("node-3", {
                outputs: [{ value: false, id: "out-3", type: "boolean" }],
            });
        });

        test("generates default output id if not provided", () => {
            render(<BoolNode id="node-4" data={{ outputs: [] }} />);

            const handle = screen.getByTestId("custom-handle");
            expect(handle.dataset.id).toBe("out-node-4-0");
        });

        test("handles absence of data.outputs gracefully", () => {
            render(<BoolNode id="node-5" data={{}} />);

            const select = screen.getByRole("combobox");
            expect(select.value).toBe("false");

            const handle = screen.getByTestId("custom-handle");
            expect(handle.dataset.type).toBe("output");
        });
});
