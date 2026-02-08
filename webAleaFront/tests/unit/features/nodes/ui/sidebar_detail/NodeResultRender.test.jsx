import { describe, test, expect, jest } from "@jest/globals";
import { render, fireEvent, screen } from "@testing-library/react";
import NodeResultRender from "../../../../../../src/features/nodes/ui/sidebar_detail/NodeResultRender";
import { useVisualizerScene } from "../../../../../../src/features/visualizer/hooks/useVisualizerScene";

jest.mock("../../../../../../src/features/visualizer/hooks/useVisualizerScene", () => ({
    useVisualizerScene: jest.fn()
}));

jest.mock("../../../../../../src/features/visualizer/VisualizerModal", () => {
    return function MockVisualizerModal() {
        return <div data-testid="visualizer-modal" />;
    };
});

jest.mock("../../../../../../src/features/workspace/providers/FlowContextDefinition.jsx", () => ({
    useFlow: () => ({ currentNode: "node-1", nodes: [] })
}));

describe("NodeResultRender", () => {
    test("renders actions and triggers render", () => {
        const handleRender = jest.fn();
        const clearScene = jest.fn();

        useVisualizerScene.mockReturnValue({
            isLoading: false,
            error: null,
            warning: null,
            showModal: false,
            sceneVersion: 0,
            sceneJSON: null,
            hasScene: true,
            setShowModal: jest.fn(),
            handleRender,
            clearScene
        });

        render(<NodeResultRender />);

        expect(screen.getByRole("heading", { name: /Node Result/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /View Render/i }));
        expect(handleRender).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /Stop Render/i }));
        expect(clearScene).toHaveBeenCalled();
    });
});
