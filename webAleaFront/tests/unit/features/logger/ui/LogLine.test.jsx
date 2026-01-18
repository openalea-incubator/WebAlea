import { render, screen } from "@testing-library/react";
import LogLine from "../../../../../src/features/logger/ui/LogLine.jsx";
import { expect, test, describe } from '@jest/globals';

describe("LogLine", () => {

    test("displays the header", () => {
        render(<LogLine header="Test Header" value="OK" />);
        expect(screen.getByText("Test Header")).toBeInTheDocument();
    });

    test("displays the value when it is a string", () => {
        render(<LogLine header="H" value="Simple value" />);
        expect(screen.getByText("Simple value")).toBeInTheDocument();
    });

    test("displays the JSON-stringified value when value is an object", () => {
        const obj = { a: 1, b: "test" };
        const { container } = render(<LogLine header="H" value={obj} />);

        const p = container.querySelector("p");

        // Normalize spaces for comparison
        const displayed = p.textContent.replace(/\s+/g, "");
        const expected = JSON.stringify(obj, null, 2).replace(/\s+/g, "");

        expect(displayed).toBe(expected);
    });

    test("contains the expected CSS classes", () => {
        const { container } = render(<LogLine header="H" value="V" />);

        const wrapper = container.querySelector("div.flex.flex-col.mb-2");
        expect(wrapper).not.toBeNull();

        const header = container.querySelector("h6.font-mono.text-sm.text-gray-400");
        expect(header).not.toBeNull();

        const value = container.querySelector("p.font-mono.text-md.text-dark.pl-2");
        expect(value).not.toBeNull();
    });

    test("handles a null value correctly", () => {
        render(<LogLine header="H" value={null} />);
        expect(screen.getByText("null")).toBeInTheDocument();
    });

    test("handles an undefined value correctly", () => {
        const { container } = render(<LogLine header="H" value={undefined} />);
        const p = container.querySelector("p");

        expect(p).toBeInTheDocument();
        expect(p.textContent).toBe("");
    });

});
