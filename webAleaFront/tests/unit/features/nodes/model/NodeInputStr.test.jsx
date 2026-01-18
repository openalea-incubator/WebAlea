import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeInputString from "../../../../../src/features/nodes/model/NodeInputStr";
import React from "react";
import { describe, test, expect, jest } from "@jest/globals";

/* ======================
    Tests
====================== */

describe("NodeInputStr Unit Tests", () => {

    test("renders the label with inputName", () => {
        render(<NodeInputString inputName="Title" />);

        expect(screen.getByText("Title")).toBeInTheDocument();
    });

    test("renders empty value by default", () => {
        render(<NodeInputString inputName="Title" />);

        const input = screen.getByRole("textbox");

        expect(input).toHaveValue("");
    });

    test("renders the provided initial value", () => {
        render(
            <NodeInputString
                inputName="Title"
                value="Hello world"
            />
        );

        const input = screen.getByRole("textbox");

        expect(input).toHaveValue("Hello world");
    });

    test("calls onChange with typed value when user types", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();

        render(
            <NodeInputString
                inputName="Title"
                value=""
                onChange={handleChange}
            />
        );

        const input = screen.getByRole("textbox");

        await user.type(input, "React Testing");

        expect(input).toHaveValue("React Testing");
        expect(handleChange).toHaveBeenLastCalledWith("React Testing");
    });

    test("updates input value when value prop changes", () => {
        const { rerender } = render(
            <NodeInputString
                inputName="Title"
                value="Initial"
            />
        );

        const input = screen.getByRole("textbox");
        expect(input).toHaveValue("Initial");

        rerender(
            <NodeInputString
                inputName="Title"
                value="Updated"
            />
        );

        expect(input).toHaveValue("Updated");
    });
});