import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeInputBoolean from "../../../../../src/features/nodes/model/NodeInputBool";
import React from "react";
import { describe, test, expect, jest } from "@jest/globals";


/* ======================
    Tests
====================== */

describe("NodeInputBoolean Unit Tests", () => {

    test("renders unchecked checkbox by default", () => {
        render(<NodeInputBoolean inputName="isActive" />);

        const checkbox = screen.getByRole("checkbox", { name: /isActive/i });

        expect(checkbox).not.toBeChecked();
    });

    test("renders checked checkbox when value is true", () => {
        render(<NodeInputBoolean inputName="isActive" value={true} />);

        const checkbox = screen.getByRole("checkbox", { name: /isActive/i });

        expect(checkbox).toBeChecked();
    });

    test("label is correctly associated with the checkbox", () => {
        render(<NodeInputBoolean inputName="isActive" />);

        const checkbox = screen.getByLabelText("isActive");

        expect(checkbox).toBeInTheDocument();
    });

    test("calls onChange with true when checkbox is clicked", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();

        render(
            <NodeInputBoolean
                inputName="isActive"
                value={false}
                onChange={handleChange}
            />
        );

        const checkbox = screen.getByRole("checkbox", { name: /isActive/i });

        await user.click(checkbox);

        expect(checkbox).toBeChecked();
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(true);
    });

    test("updates checkbox state when value prop changes", () => {
        const { rerender } = render(
            <NodeInputBoolean inputName="isActive" value={false} />
        );

        const checkbox = screen.getByRole("checkbox", { name: /isActive/i });
        expect(checkbox).not.toBeChecked();

        rerender(<NodeInputBoolean inputName="isActive" value={true} />);

        expect(checkbox).toBeChecked();
    });
});