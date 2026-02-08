import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useVisualizerScene } from "../../../../../src/features/visualizer/hooks/useVisualizerScene";
import { fetchNodeScene } from "../../../../../src/api/visualizerAPI";

jest.mock("../../../../../src/api/visualizerAPI", () => ({
    fetchNodeScene: jest.fn()
}));

jest.mock("../../../../../src/features/visualizer/utils/debug", () => ({
    debugLog: jest.fn()
}));

describe("useVisualizerScene", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("loads scene and caches it", async () => {
        fetchNodeScene.mockResolvedValueOnce({
            success: true,
            cacheHit: true,
            scene: { objects: [{ id: 1 }] }
        });

        const nodes = [
            {
                id: "node-1",
                data: {
                    outputs: [
                        {
                            value: {
                                __type__: "plantgl_scene_ref",
                                __ref__: "ref-1",
                                __meta__: { shape_count: 1 }
                            }
                        }
                    ]
                }
            }
        ];

        const { result } = renderHook(() =>
            useVisualizerScene({ currentNodeId: "node-1", nodes })
        );

        await act(async () => {
            await result.current.handleRender();
        });

        expect(fetchNodeScene).toHaveBeenCalledTimes(1);
        expect(result.current.showModal).toBe(true);
        expect(result.current.sceneJSON).toEqual({ objects: [{ id: 1 }] });

        await act(async () => {
            await result.current.handleRender();
        });

        expect(fetchNodeScene).toHaveBeenCalledTimes(1);
    });

    test("sets error when no outputs", async () => {
        const nodes = [{ id: "node-1", data: { outputs: [] } }];

        const { result } = renderHook(() =>
            useVisualizerScene({ currentNodeId: "node-1", nodes })
        );

        await act(async () => {
            await result.current.handleRender();
        });

        expect(result.current.error).toBe("No outputs available for visualization.");
    });

    test("clearScene resets state", async () => {
        fetchNodeScene.mockResolvedValueOnce({
            success: true,
            scene: { objects: [] }
        });

        const nodes = [{ id: "node-1", data: { outputs: [{ value: { __type__: "plantgl_scene_ref", __ref__: "ref" } }] } }];

        const { result } = renderHook(() =>
            useVisualizerScene({ currentNodeId: "node-1", nodes })
        );

        await act(async () => {
            await result.current.handleRender();
        });

        act(() => {
            result.current.clearScene();
        });

        expect(result.current.sceneJSON).toBeNull();
        expect(result.current.showModal).toBe(false);
    });
});
