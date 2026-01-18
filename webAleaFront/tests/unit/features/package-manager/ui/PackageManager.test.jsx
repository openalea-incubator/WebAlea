import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { getInstalledPackagesList } from "../../../../../src/service/PackageService.js";

import PackageManager from "../../../../../src/features/package-manager/ui/PackageManager";

/* ===========================
    Mocks
=========================== */

// Mock du contexte Flow
const mockAddNode = jest.fn();

jest.mock(
    "../../../../../src/features/workspace/providers/FlowContextDefinition.jsx",
    () => ({
        useFlow: () => ({
            addNode: mockAddNode,
        }),
    })
);

jest.mock(
    "../../../../../src/service/PackageService.js",
    () => ({
        getInstalledPackagesList: jest.fn().mockResolvedValue([
                { name: "packageA" },
                { name: "packageB" },
        ]),
    })
);

jest.mock(
    "../../../../../src/features/package-manager/ui/type/PanelModuleNode.jsx",
    () => (props) => (
        <div data-testid="panel-module">
            <button onClick={() => props.onAddNode({ name: "TestNode" })}>
                add-node
            </button>
        </div>
    )
);

jest.mock(
    "../../../../../src/features/package-manager/ui/type/PanelPrimitiveNode.jsx",
    () => () => <div data-testid="panel-primitive" />
);

jest.mock(
    "../../../../../src/features/package-manager/ui/type/PanelInstallPackage.jsx",
    () => (props) => (
        <div data-testid="panel-install">
            <button
                onClick={() =>
                    props.onPackageInstalled({ name: "new-package" })}>
                install
            </button>
        </div>
    )
);

/* ===========================
    Tests
=========================== */

describe("PackageManager Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders visual panel by default", async () => {
        render(<PackageManager />);

        expect(await screen.findByTestId("panel-module")).toBeInTheDocument();
    });

    test("switches to primitive panel when clicking tab", () => {
        render(<PackageManager />);

        fireEvent.click(screen.getByText("Primitives"));
        expect(screen.getByTestId("panel-primitive")).toBeInTheDocument();
    });

    test("switches to install panel when clicking tab", () => {
        render(<PackageManager />);

        fireEvent.click(screen.getByText("Install"));

        expect(screen.getByTestId("panel-install")).toBeInTheDocument();
    });

    test("fetches installed packages on mount", async () => {
        render(<PackageManager />);

        await screen.findByTestId("panel-module");

        expect(getInstalledPackagesList).toHaveBeenCalledTimes(1);
    });

    test("handleAddNode creates a node and calls addNode", async () => {
        render(<PackageManager />);

        fireEvent.click(await screen.findByText("add-node"));

        expect(mockAddNode).toHaveBeenCalledTimes(1);

        const nodeArg = mockAddNode.mock.calls[0][0];

        expect(nodeArg).toHaveProperty("id");
        expect(nodeArg).toHaveProperty("data.label", "TestNode");
        expect(nodeArg).toHaveProperty("data.inputs");
        expect(nodeArg).toHaveProperty("data.outputs");
    });

    test("handlePackageInstalled increments refresh key", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        render(<PackageManager />);

        fireEvent.click(screen.getByText("Install"));
        fireEvent.click(screen.getByText("install"));

        expect(consoleSpy).toHaveBeenCalledWith(
            "Package installed:",
            "new-package"
        );

        consoleSpy.mockRestore();
    });

});
