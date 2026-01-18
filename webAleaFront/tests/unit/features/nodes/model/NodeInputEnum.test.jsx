import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeInputEnum from "../../../../../src/features/nodes/model/NodeInputEnum";
import React from "react";
import { describe, test, expect, jest } from "@jest/globals";

/* ======================
    Tests
====================== */

describe("NodeInputEnum Unit Tests", () => {

    test("renders the label with inputName", () => {
        render(
            <NodeInputEnum
                inputName="Status"
                options={["OPEN", "CLOSED"]}
            />
        );

        expect(screen.getByText("Status")).toBeInTheDocument();
    });

    test("renders fallback option when no options are provided", () => {
        render(
            <NodeInputEnum
                inputName="Status"
                options={[]}
            />
        );

        expect(
            screen.getByRole("option", { name: "-- No options --" })
        ).toBeInTheDocument();
    });

    test("renders all provided options", () => {
        const options = ["OPEN", "CLOSED", "PENDING"];

        render(
            <NodeInputEnum
                inputName="Status"
                options={options}
            />
        );

        options.forEach((opt) => {
            expect(
                screen.getByRole("option", { name: opt })
            ).toBeInTheDocument();
        });
    });

    test("selects the correct initial value", () => {
        render(
            <NodeInputEnum
                inputName="Status"
                value="CLOSED"
                options={["OPEN", "CLOSED"]}
            />
        );

        const select = screen.getByRole("combobox");

        expect(select).toHaveValue("CLOSED");
    });

    test("changes value and calls onChange when a new option is selected", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();

        render(
            <NodeInputEnum
                inputName="Status"
                value="OPEN"
                options={["OPEN", "CLOSED"]}
                onChange={handleChange}
            />
        );

        const select = screen.getByRole("combobox");

        await user.selectOptions(select, "CLOSED");

        expect(select).toHaveValue("CLOSED");
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith("CLOSED");
    });

    test("updates selected value when value prop changes", () => {
        const { rerender } = render(
            <NodeInputEnum
                inputName="Status"
                value="OPEN"
                options={["OPEN", "CLOSED"]}
            />
        );

        const select = screen.getByRole("combobox");
        expect(select).toHaveValue("OPEN");

        rerender(
            <NodeInputEnum
                inputName="Status"
                value="CLOSED"
                options={["OPEN", "CLOSED"]}
            />
        );

        expect(select).toHaveValue("CLOSED");
    });
});
