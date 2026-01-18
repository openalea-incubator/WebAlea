import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NodeDetailSection from "../../../../../src/features/nodes/ui/sidebar_detail/NodeDetailSection";
import React from "react";
import { describe, test, expect } from "@jest/globals";

/* ======================
    Mocks
====================== */

// Mock of NodeParameters and NodeDescription components
jest.mock("../../../../../src/features/nodes/ui/sidebar_detail/NodeParameters", () => () => (
    <div data-testid="node-parameters">NodeParameters content</div>
));

jest.mock("../../../../../src/features/nodes/ui/sidebar_detail/NodeDescription", () => () => (
    <div data-testid="node-description">NodeDescription content</div>
));

/* ======================
    Tests
====================== */

describe("NodeDetailSection Integration Tests", () => {

    test("renders Parameters tab by default", () => {
        render(<NodeDetailSection />);

        expect(screen.getByTestId("node-parameters")).toBeInTheDocument();
        expect(
            screen.queryByTestId("node-description")
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /parameters/i })
        ).toHaveClass("btn-dark");
    });

    test("switches to Description tab when clicked", async () => {
        const user = userEvent.setup();
        render(<NodeDetailSection />);

        const descButton = screen.getByRole("button", { name: /description/i });

        await user.click(descButton);

        expect(screen.getByTestId("node-description")).toBeInTheDocument();
        expect(
            screen.queryByTestId("node-parameters")
        ).not.toBeInTheDocument();

        expect(descButton).toHaveClass("btn-dark");
    });

    test("renders view content when View tab is clicked", async () => {
        const user = userEvent.setup();
        render(<NodeDetailSection />);

        const viewButton = screen.getByRole("button", { name: /view/i });

        await user.click(viewButton);

        expect(
            screen.getByText("Preview...")
        ).toBeInTheDocument();
    });

    test("allows switching back and forth between tabs", async () => {
        const user = userEvent.setup();
        render(<NodeDetailSection />);

        await user.click(screen.getByRole("button", { name: /view/i }));
        expect(
            screen.getByText("Preview...")
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /parameters/i }));
        expect(screen.getByTestId("node-parameters")).toBeInTheDocument();
    });
});