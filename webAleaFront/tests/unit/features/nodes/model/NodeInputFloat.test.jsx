import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeInputFloat from "../../../../../src/features/nodes/model/NodeInputFloat";
import React from "react";
import { describe, test, expect, jest } from "@jest/globals";

/* ======================
    Tests
====================== */

describe("NodeInputFloat Unit Tests", () => {

    test("renders the label with inputName", () => {
        render(<NodeInputFloat inputName="Weight" />);

        expect(screen.getByText("Weight")).toBeInTheDocument();
    });

    test("renders default value 0 when no value is provided", () => {
        render(<NodeInputFloat inputName="Weight" />);

        const input = screen.getByRole("spinbutton");

        expect(input).toHaveValue(0);
    });

    test("renders the provided initial value", () => {
        render(
            <NodeInputFloat
                inputName="Weight"
                value={12.5}
            />
        );

        const input = screen.getByRole("spinbutton");

        expect(input).toHaveValue(12.5);
    });

    test("calls onChange with a float value when user types", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();

        render(
            <NodeInputFloat
                inputName="Weight"
                value={0}
                onChange={handleChange}
            />
        );

        const input = screen.getByRole("spinbutton");

        await user.clear(input);
        await user.type(input, "3.14");

        expect(input).toHaveValue(3.14);
        expect(handleChange).toHaveBeenLastCalledWith(3.14);
    });

    test("calls onChange with 0 when input is cleared and blurred", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();

        render(
            <NodeInputFloat
                inputName="Weight"
                value={5}
                onChange={handleChange}
            />
        );

        const input = screen.getByRole("spinbutton");

        await user.clear(input);
        await user.tab();

        expect(input).toHaveValue(0);
        expect(handleChange).toHaveBeenLastCalledWith(0);
    });

    test("updates input value when value prop changes", () => {
        const { rerender } = render(
            <NodeInputFloat
                inputName="Weight"
                value={1}
            />
        );

        const input = screen.getByRole("spinbutton");
        expect(input).toHaveValue(1);

        rerender(
            <NodeInputFloat
                inputName="Weight"
                value={2.5}
            />
        );

        expect(input).toHaveValue(2.5);
    });
});
