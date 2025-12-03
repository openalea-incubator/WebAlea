import { render, screen } from "@testing-library/react";
import ConsoleLog from "../../../../src/components/ConsoleLog/ConsoleLog.jsx";

// Mock du hook useLog
jest.mock("../../../../src/providers/LogContextDefinition.jsx", () => ({
    useLog: () => ({
        logs: [
            { header: "Action A", value: "OK" },
            { header: "Action B", value: "Done" },
        ],
    }),
}));

describe("ConsoleLog component", () => {

    test("affiche les logs passés par le hook", () => {
        render(<ConsoleLog />);

        expect(screen.getByText("Action A")).toBeInTheDocument();
        expect(screen.getByText("Action B")).toBeInTheDocument();
    });
});

