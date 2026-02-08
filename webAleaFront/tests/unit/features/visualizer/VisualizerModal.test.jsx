import { describe, test, expect, jest } from "@jest/globals";
import { render } from "@testing-library/react";
import VisualizerModal from "../../../../src/features/visualizer/VisualizerModal";
import { buildSceneFromJSON } from "../../../../src/features/visualizer/SceneBuilder";

jest.mock("../../../../src/features/visualizer/SceneBuilder", () => ({
    buildSceneFromJSON: jest.fn()
}));

describe("VisualizerModal", () => {
    test("builds and disposes scene on show toggle", () => {
        const dispose = jest.fn();
        buildSceneFromJSON.mockReturnValue({ dispose });

        const { rerender } = render(
            <VisualizerModal show={true} onClose={() => {}} sceneJSON={{ objects: [] }} />
        );

        expect(buildSceneFromJSON).toHaveBeenCalled();

        rerender(
            <VisualizerModal show={false} onClose={() => {}} sceneJSON={{ objects: [] }} />
        );

        expect(dispose).toHaveBeenCalled();
    });

    test("shows empty state when no sceneJSON", () => {
        const { getByText } = render(
            <VisualizerModal show={true} onClose={() => {}} sceneJSON={null} />
        );
        expect(getByText(/No scene loaded yet/i)).toBeInTheDocument();
    });
});
