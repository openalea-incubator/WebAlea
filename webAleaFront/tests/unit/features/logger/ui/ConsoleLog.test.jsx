import { render, screen } from "@testing-library/react";
import ConsoleLog from "../../../../../src/features/logger/ui/ConsoleLog.jsx";
import React from "react";
import {describe, test, expect} from "@jest/globals";

// Mock the useLog hook
import * as LogContext from "../../../../../src/features/logger/providers/LogContextDefinition.jsx";

// eslint-disable-next-line no-undef
jest.mock("../../../../../src/features/logger/providers/LogContextDefinition.jsx");

describe("logger component", () => {

    test("displays the logs provided by the hook", () => {
        LogContext.useLog.mockReturnValue({
            logs: [
                { header: "Action A", value: "OK" },
                { header: "Action B", value: "Done" },
            ],
        });

        render(<ConsoleLog />);
        expect(screen.getByText("Action A")).toBeInTheDocument();
        expect(screen.getByText("Action B")).toBeInTheDocument();
        expect(screen.getByText("OK")).toBeInTheDocument();
        expect(screen.getByText("Done")).toBeInTheDocument();
    });

    test("renders correctly even without logs", () => {
        LogContext.useLog.mockReturnValue({ logs: [] });

        render(<ConsoleLog />);
        expect(screen.queryByText(/Action/)).not.toBeInTheDocument();
    });

    test("contains the main structural elements", () => {
        LogContext.useLog.mockReturnValue({ logs: [] });

        render(<ConsoleLog />);
        expect(screen.getByText("Détails des opérations")).toBeInTheDocument();
        expect(document.querySelector("hr")).toHaveClass("border-top border-dark mb-2");
        expect(document.querySelector("div.flex-fill")).toBeInTheDocument();
    });

    test("renders a LogLine for each log", () => {
        LogContext.useLog.mockReturnValue({
            logs: [
                { header: "Action A", value: "OK" },
                { header: "Action B", value: "Done" },
            ],
        });

        render(<ConsoleLog />);
        expect(document.querySelectorAll("div.flex.flex-col").length).toBe(2);
    });

});
