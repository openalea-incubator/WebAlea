import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeInput from "../../../../src/features/nodes/ui/NodeInputs";
import React from "react";
import { describe, test, expect, jest } from "@jest/globals";

describe("NodeInputs Unit Tests", () => {

    test("renders 'No inputs' when inputs array is empty", () => {
        render(<NodeInput inputs={[]} />);
        expect(screen.getByText("No inputs")).toBeInTheDocument();
    });

    test("renders string input and calls onInputChange", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();
        const inputs = [{ id: "s1", name: "Name", type: "string", value: "Hello" }];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);

        const input = screen.getByRole("textbox");
        expect(input).toHaveValue("Hello");

        await user.clear(input);
        await user.type(input, "World");

        expect(handleChange).toHaveBeenLastCalledWith("s1", "World");
    });

    test("renders float input and calls onInputChange", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();
        const inputs = [{ id: "f1", name: "Weight", type: "float", value: 2.5 }];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);
        const input = screen.getByRole("spinbutton");
        expect(input).toHaveValue(2.5);

        await user.clear(input);
        await user.type(input, "3.14");

        expect(handleChange).toHaveBeenLastCalledWith("f1", 3.14);
    });

    test("renders boolean input and toggles", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();
        const inputs = [{ id: "b1", name: "Active", type: "boolean", value: true }];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);
        const checkbox = screen.getByRole("checkbox", { name: /active/i });
        expect(checkbox).toBeChecked();

        await user.click(checkbox);
        expect(handleChange).toHaveBeenLastCalledWith("b1", false);
    });

    test("renders enum input with options and calls onInputChange", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();
        const inputs = [{
            id: "e1",
            name: "Status",
            type: "enum",
            value: "OPEN",
            enumOptions: ["OPEN", "CLOSED"]
        }];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);
        const select = screen.getByRole("combobox");
        expect(select).toHaveValue("OPEN");

        await user.selectOptions(select, "CLOSED");
        expect(handleChange).toHaveBeenLastCalledWith("e1", "CLOSED");
    });

    test("generates dynamic id when missing", async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();
        const inputs = [{ name: "AutoID", type: "string", value: "" }];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);
        const input = screen.getByRole("textbox");

        await user.type(input, "X");
        expect(handleChange).toHaveBeenCalled();
        const [generatedId] = handleChange.mock.calls[0];
        expect(generatedId).toMatch(/^input_0_AutoID/);
    });

    test("handles fallback parseInput with dict-like name", () => {
        const handleChange = jest.fn();
        const inputs = [{
            id: "p1",
            name: "{'name':'Parsed','interface':'IEnumStr(enum=['C','F'])','value':'C'}",
        }];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);
        const select = screen.getByRole("combobox");
        expect(select).toHaveValue("C");
        expect(screen.getByRole("option", { name: "C" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "F" })).toBeInTheDocument();
    });

    test("handles input with undefined value fallback", () => {
        const handleChange = jest.fn();
        const inputs = [
            { id: "s2", name: "StringFallback", type: "string" },
            { id: "f2", name: "FloatFallback", type: "float" },
            { id: "b2", name: "BoolFallback", type: "boolean" }
        ];

        render(<NodeInput inputs={inputs} onInputChange={handleChange} />);
        expect(screen.getByRole("textbox")).toHaveValue("");
        expect(screen.getByRole("spinbutton")).toHaveValue(0);
        expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    // Fallback case for unknown input type

        test("renders fallback string input when type is unknown", () => {
        const inputs = [{ id: "x", name: "X", type: "unknown", value: "foo" }];
        render(<NodeInput inputs={inputs} />);
        expect(screen.getByRole("textbox")).toHaveValue("foo");
    });

    test("renders string input when value is null or undefined", () => {
        const inputs = [
            { id: "n1", name: "N1", type: "string", value: null },
            { id: "n2", name: "N2", type: "string" }, // value undefined
        ];
        render(<NodeInput inputs={inputs} />);
        const allTextboxes = screen.getAllByRole("textbox");
        expect(allTextboxes[0]).toHaveValue("");
        expect(allTextboxes[1]).toHaveValue("");
    });

    test("renders enum input with no options fallback", () => {
        const inputs = [
            { id: "status", name: "Status", type: "enum", value: "" }
        ];
        render(<NodeInput inputs={inputs} />);
        expect(screen.getByText("-- No options --")).toBeInTheDocument();
    });

    test("boolean input toggle triggers onInputChange", async () => {
        const user = userEvent.setup();
        const handleInputChange = jest.fn();
        const inputs = [{ id: "active", name: "Active", type: "boolean", value: false }];
        render(<NodeInput inputs={inputs} onInputChange={handleInputChange} />);
        const checkbox = screen.getByRole("checkbox", { name: /active/i });
        await user.click(checkbox);
        expect(handleInputChange).toHaveBeenCalledWith("active", true);
    });

    test("enum input select triggers onInputChange", async () => {
        const user = userEvent.setup();
        const handleInputChange = jest.fn();
        const inputs = [
            { id: "mode", name: "Mode", type: "enum", value: "A", enumOptions: ["A", "B"] }
        ];
        render(<NodeInput inputs={inputs} onInputChange={handleInputChange} />);
        const select = screen.getByRole("combobox");
        await user.selectOptions(select, "B");
        expect(handleInputChange).toHaveBeenCalledWith("mode", "B");
    });

    test("generates id if missing and triggers onChange", async () => {
        const user = userEvent.setup();
        const handleInputChange = jest.fn();
        const inputs = [{ name: "AutoID", type: "string", value: "" }];
        render(<NodeInput inputs={inputs} onInputChange={handleInputChange} />);
        const input = screen.getByRole("textbox");
        await user.type(input, "X");
        const [generatedId, val] = handleInputChange.mock.calls[0];
        expect(generatedId).toMatch(/^input_0_AutoID/);
        expect(val).toBe("X");
    });

});
