import { describe, test, expect } from "@jest/globals";
import * as THREE from "three";
import { meshFromJSON } from "../../../../../src/features/visualizer/factories/meshFactory";

describe("meshFactory", () => {
    test("builds a mesh with geometry, material, and transform", () => {
        const meshJSON = {
            geometry: {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0]
                ],
                indices: [[0, 1, 2]]
            },
            material: {
                color: [0.1, 0.2, 0.3],
                opacity: 0.5
            },
            transform: {
                position: [1, 2, 3],
                rotation: [0, 0, 0],
                scale: [2, 2, 2]
            }
        };

        const mesh = meshFromJSON(meshJSON);
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh.geometry.attributes.position.count).toBe(3);
        expect(mesh.geometry.index.count).toBe(3);
        expect(mesh.position.x).toBe(1);
        expect(mesh.scale.x).toBe(2);
    });
});
