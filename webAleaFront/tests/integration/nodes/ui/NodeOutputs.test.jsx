import { render, screen } from "@testing-library/react";
import NodeOutput from "../../../../src/features/nodes/ui/NodeOutputs";
import { describe, test, expect } from "@jest/globals";


/* ======================
    Tests
====================== */

describe("NodeOutputs Unit Tests", () => {

    test("renders 'No outputs' when outputs array is empty", () => {
        render(<NodeOutput outputs={[]} />);

        expect(screen.getByText("No outputs")).toBeInTheDocument();
    });

    test("renders output name and value", () => {
        const outputs = [
            {
                id: "out1",
                name: "Result",
                value: 42
            }
        ];

        render(<NodeOutput outputs={outputs} />);

        expect(screen.getByText("Result")).toBeInTheDocument();

        const input = screen.getByDisplayValue("42");
        expect(input).toBeInTheDocument();
    });

    test("renders empty value when output value is undefined", () => {
        const outputs = [
            {
                id: "out1",
                name: "Result"
            }
        ];

        render(<NodeOutput outputs={outputs} />);

        const input = screen.getByPlaceholderText("--");
        expect(input).toHaveValue("");
    });

    test("output input is read-only", () => {
        const outputs = [
            {
                id: "out1",
                name: "Result",
                value: "test"
            }
        ];

        render(<NodeOutput outputs={outputs} />);

        const input = screen.getByDisplayValue("test");
        expect(input).toHaveAttribute("readonly");
    });

    test("parses legacy dict-like output name", () => {
        const outputs = [
            {
                id: "out1",
                name: "{'name': 'Temperature', 'type': 'float'}",
                value: 25
            }
        ];

        render(<NodeOutput outputs={outputs} />);

        expect(screen.getByText("Temperature")).toBeInTheDocument();
    });

    test("renders output without id using generated key", () => {
        const outputs = [
            {
                name: "Generated",
                value: "ok"
            }
        ];

        render(<NodeOutput outputs={outputs} />);

        expect(screen.getByText("Generated")).toBeInTheDocument();
        expect(screen.getByDisplayValue("ok")).toBeInTheDocument();
    });
});



