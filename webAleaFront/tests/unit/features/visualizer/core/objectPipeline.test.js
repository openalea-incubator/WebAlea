import { describe, test, expect, jest } from "@jest/globals";
import * as THREE from "three";

jest.mock("three/examples/jsm/utils/BufferGeometryUtils.js", () => {
    const { BufferGeometry } = jest.requireActual("three");
    return {
        mergeGeometries: jest.fn(() => new BufferGeometry())
    };
});

import { buildSceneObjects } from "../../../../../src/features/visualizer/core/objectPipeline";

describe("objectPipeline", () => {
    test("buildSceneObjects merges static meshes and returns objects", () => {
        const scene = new THREE.Scene();
        const sceneJSON = {
            objects: [
                {
                    objectType: "mesh",
                    geometry: { vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] },
                    material: { color: [0.5, 0.5, 0.5], opacity: 1 }
                },
                {
                    objectType: "mesh",
                    geometry: { vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] },
                    transform: { position: [1, 0, 0] }
                },
                {
                    objectType: "line",
                    geometry: { vertices: [[0, 0, 0], [1, 1, 1]] }
                }
            ]
        };

        const result = buildSceneObjects(scene, sceneJSON);
        expect(result.objects.length).toBe(3);
        expect(scene.children.length).toBe(3);
        expect(result.hasAnimations).toBe(false);
    });
});
