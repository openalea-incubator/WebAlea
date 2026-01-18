import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FloatNode from "../../../../../../src/features/workspace/ui/type/FloatNode";
import { beforeEach, describe, test, expect } from "@jest/globals";

// Mocks des hooks et composants
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

describe("FloatNode Unit Tests", () => {
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

    test("renders node with input and handle", () => {
        render(<FloatNode id="node-1" data={{ outputs: [{ value: 42, id: "out-1" }] }} />);
        
        const input = screen.getByRole("spinbutton"); // input type number
        expect(input.value).toBe("42");

        const handle = screen.getByTestId("custom-handle");
        expect(handle.dataset.id).toBe("out-1");
        expect(handle.dataset.type).toBe("output");
    });

    test("calls updateNode and addLog on initial render", () => {
        render(<FloatNode id="node-2" data={{ outputs: [{ value: 0, id: "out-2" }] }} />);
        
        expect(updateNodeMock).toHaveBeenCalledWith("node-2", {
        outputs: [{ value: 0, id: "out-2", type: "float" }],
        });
        expect(addLogMock).toHaveBeenCalledWith("FloatNode node-2 updated. value = 0");
    });
    test("changes value when input is changed", () => {
        render(<FloatNode id="node-3" data={{ outputs: [{ value: 10, id: "out-3" }] }} />);

        const input = screen.getByRole("spinbutton");
        fireEvent.change(input, { target: { value: "55.5" } });

        expect(input.value).toBe("55.5");

        fireEvent.blur(input); // déclenche handleBlur et updateNode
        expect(updateNodeMock).toHaveBeenLastCalledWith("node-3", {
            outputs: [{ value: 55.5, id: "out-3", type: "float" }],
        });
    });

    test("handles non-numeric input gracefully", () => {
        render(<FloatNode id="node-4" data={{ outputs: [{ value: 12, id: "out-4" }] }} />);
        
        const input = screen.getByRole("spinbutton");
        fireEvent.change(input, { target: { value: "abc" } });
        fireEvent.blur(input);

        expect(input.value).toBe("0"); // devrait se corriger à 0
        expect(updateNodeMock).toHaveBeenLastCalledWith("node-4", {
            outputs: [{ value: 0, id: "out-4", type: "float" }],
        });
    });


    test("generates default output id if not provided", () => {
        render(<FloatNode id="node-5" data={{ outputs: [] }} />);

        const handle = screen.getByTestId("custom-handle");
        expect(handle.dataset.id).toBe("out-node-5-0");
    });

    test("handles absence of data.outputs gracefully", () => {
        render(<FloatNode id="node-6" data={{}} />);
        
        const input = screen.getByRole("spinbutton");
        expect(input.value).toBe("0");

        const handle = screen.getByTestId("custom-handle");
        expect(handle.dataset.type).toBe("output");
    });
});
