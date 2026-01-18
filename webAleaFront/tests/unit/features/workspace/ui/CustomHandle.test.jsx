import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, test, expect } from "@jest/globals";

import CustomHandle from "../../../../../src/features/workspace/ui/CustomHandle";
import { useFlow } from "../../../../../src/features/workspace/providers/FlowContextDefinition.jsx";

/* =======================
    Mocks
======================= */

jest.mock("@xyflow/react", () => {
    const { jest } = require("@jest/globals");

    return {
        Handle: ({ type, position, id, style, className }) => (
            <div
                data-testid="handle"
                data-type={type}
                data-position={position}
                data-id={id}
                className={className}
                style={style}
            />
        ),
        Position: {
            Left: "left",
            Right: "right",
        },
        useNodeConnections: jest.fn(),
        useNodesData: jest.fn(),
        useNodeId: jest.fn(),
    };
});

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
    Imports from mocked modules
======================= */

import * as ReactFlow from "@xyflow/react";

const {
    useNodeConnections,
    useNodesData,
    useNodeId,
} = ReactFlow;

/* =======================
    Tests
======================= */

describe("CustomHandle Units Tests", () => {
    let setNodesMock;

    beforeEach(() => {
        jest.clearAllMocks();

        setNodesMock = jest.fn();

        useFlow.mockReturnValue({
            setNodes: setNodesMock,
        });

        useNodeId.mockReturnValue("parent-node");
        useNodeConnections.mockReturnValue([]);
        useNodesData.mockReturnValue(null);
    });

    test("renders a Handle with correct props (input)", () => {
        render(
            <CustomHandle
                id="input-1"
                dataType="input"
                interfaceType="float"
            />
        );

        const handle = screen.getByTestId("handle");

        expect(handle.dataset.type).toBe("target");
        expect(handle.dataset.position).toBe("left");
        expect(handle.dataset.id).toBe("input-1");
    });

    test("renders a Handle with correct props (output)", () => {
        render(
            <CustomHandle
                id="output-1"
                dataType="output"
            />
        );

        const handle = screen.getByTestId("handle");

        expect(handle.dataset.type).toBe("source");
        expect(handle.dataset.position).toBe("right");
    });

    test("applies color based on Bool interfaceType", () => {
        render(
            <CustomHandle
                id="h1"
                dataType="input"
                interfaceType="IBool"
                style={{ border: "1px solid red" }}
            />
        );

        const handle = screen.getByTestId("handle");

        expect(handle.style.background).toBe("rgb(43, 138, 62)");
        expect(handle.style.border).toBe("1px solid red");
    });

    test("keeps original style if interfaceType is undefined", () => {
        render(
            <CustomHandle
                id="h1"
                dataType="input"
                style={{ background: "black" }}
            />
        );

        const handle = screen.getByTestId("handle");

        expect(handle.style.background).toBe("black");
    });

    test("propagates connected value to parent input", () => {
        useNodeConnections.mockReturnValue([
            {
                source: "node-A",
                sourceHandle: "out-1",
            },
        ]);

        useNodesData.mockReturnValue({
            data: {
                outputs: [{ id: "out-1", value: 42 }],
            },
        });

        render(
            <CustomHandle
                id="in-1"
                dataType="input"
            />
        );

        expect(setNodesMock).toHaveBeenCalled();
    });

    test("calls onChange when value is propagated", () => {
        const onChange = jest.fn();

        useNodeConnections.mockReturnValue([
            {
                source: "node-A",
                sourceHandle: "out-1",
            },
        ]);

        useNodesData.mockReturnValue({
            data: {
                outputs: [{ id: "out-1", value: "hello" }],
            },
        });

        render(
            <CustomHandle
                id="in-1"
                dataType="input"
                onChange={onChange}
            />
        );

        expect(onChange).toHaveBeenCalledWith("hello");
    });

    test("removes fromConnection flag when connection is removed", () => {
        useNodeConnections.mockReturnValue(null);

        render(
            <CustomHandle
                id="in-1"
                dataType="input"
            />
        );

        expect(setNodesMock).toHaveBeenCalled();
    });

    test("does nothing if not input handle", () => {
        render(
            <CustomHandle
                id="out-1"
                dataType="output"
            />
        );

        expect(setNodesMock).not.toHaveBeenCalled();
    });

    test("does nothing if parentNodeId is missing", () => {
        useNodeId.mockReturnValue(null);

        render(
            <CustomHandle
                id="in-1"
                dataType="input"
            />
        );

        expect(setNodesMock).not.toHaveBeenCalled();
    });
});
