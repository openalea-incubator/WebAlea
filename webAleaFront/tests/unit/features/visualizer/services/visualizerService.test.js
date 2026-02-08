import { describe, test, expect } from "@jest/globals";
import {
    buildOutputSummary,
    buildVisualizationData,
    extractSceneRef,
    parseSceneData
} from "../../../../../src/features/visualizer/services/visualizerService";

describe("visualizerService", () => {
    test("extractSceneRef returns ref and metadata when available", () => {
        const outputs = [
            {
                name: "out",
                value: {
                    __type__: "plantgl_scene_ref",
                    __ref__: "abc123",
                    __meta__: { shape_count: 7 }
                }
            }
        ];

        expect(extractSceneRef(outputs)).toEqual({
            sceneRef: "abc123",
            sceneRefExpectedShapeCount: 7
        });
    });

    test("extractSceneRef returns nulls when no scene ref exists", () => {
        const outputs = [{ name: "out", value: 42 }];
        expect(extractSceneRef(outputs)).toEqual({
            sceneRef: null,
            sceneRefExpectedShapeCount: null
        });
    });

    test("buildVisualizationData uses scene_ref when available", () => {
        const outputs = [
            {
                value: {
                    __type__: "plantgl_scene_json_ref",
                    __ref__: "scene-1",
                    __meta__: { shape_count: 3 }
                }
            }
        ];

        expect(buildVisualizationData(outputs)).toEqual({
            scene_ref: "scene-1",
            scene_ref_expected_shape_count: 3,
            outputs
        });
    });

    test("buildVisualizationData falls back to outputs only", () => {
        const outputs = [{ value: 12 }];
        expect(buildVisualizationData(outputs)).toEqual({ outputs });
    });

    test("buildOutputSummary maps outputs correctly", () => {
        const outputs = [
            { name: "a", type: "float", value: 1 },
            { name: "b", type: "Scene", value: { __type__: "plantgl_scene" } }
        ];

        expect(buildOutputSummary(outputs)).toEqual([
            { idx: 0, name: "a", type: "float", valueType: "number" },
            { idx: 1, name: "b", type: "Scene", valueType: "plantgl_scene" }
        ]);
    });

    test("parseSceneData handles JSON strings and objects", () => {
        const scene = { objects: [{ id: 1 }, { id: 2 }] };
        const fromString = parseSceneData({ scene: JSON.stringify(scene) });
        expect(fromString.parsedScene).toEqual(scene);
        expect(fromString.objectCount).toBe(2);

        const fromObject = parseSceneData({ scene });
        expect(fromObject.parsedScene).toEqual(scene);
        expect(fromObject.objectCount).toBe(2);
    });
});
