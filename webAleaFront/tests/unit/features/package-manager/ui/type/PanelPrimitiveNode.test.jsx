import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PanelPrimitiveNode from "../../../../../../src/features/package-manager/ui/type/PanelPrimitiveNode.jsx";
import { jest, beforeEach, test, expect, describe } from "@jest/globals";

/* ===========================
    Tests
=========================== */

describe("PanelPrimitiveNode with TreePackage", () => {
    let onAddNodeMock;

    beforeEach(() => {
        onAddNodeMock = jest.fn();
    });

    test("calls onAddNode when clicking a primitive", () => {
        render(<PanelPrimitiveNode onAddNode={onAddNodeMock} />);
        
        const floatItem = screen.getByText("Float").closest(".primitive-item");
        fireEvent.click(floatItem);

        expect(onAddNodeMock).toHaveBeenCalledTimes(1);

        const calledArg = onAddNodeMock.mock.calls[0][0];
        expect(calledArg.node).toBeDefined();
        expect(calledArg.node.id).toBe("float");
        expect(calledArg.node.type).toBe("float");
        expect(calledArg.node.data.label).toBe("Float input");
    });

    test("calls onAddNode when pressing Enter or Space on a primitive", () => {
        render(<PanelPrimitiveNode onAddNode={onAddNodeMock} />);
        
        const booleanItem = screen.getByText("Boolean").closest(".primitive-item");

        // Press Enter
        fireEvent.keyDown(booleanItem, { key: "Enter" });
        let calledArg = onAddNodeMock.mock.calls[0][0];
        expect(calledArg.node.id).toBe("boolean");
        expect(calledArg.node.type).toBe("boolean");
        expect(calledArg.node.data.label).toBe("Boolean input");

        // Press Space
        fireEvent.keyDown(booleanItem, { key: " " });
        calledArg = onAddNodeMock.mock.calls[1][0];
        expect(calledArg.node.id).toBe("boolean");
        expect(calledArg.node.type).toBe("boolean");
        expect(calledArg.node.data.label).toBe("Boolean input");
    });

});
