import { describe, test, expect, jest } from "@jest/globals";
import { disposeSceneResources } from "../../../../../src/features/visualizer/core/dispose";

describe("disposeSceneResources", () => {
    test("disposes geometries, materials, and textures", () => {
        const geometry = { dispose: jest.fn() };
        const texture = { dispose: jest.fn() };
        const material = {
            dispose: jest.fn(),
            map: texture,
            alphaMap: null,
            normalMap: null,
            roughnessMap: null,
            metalnessMap: null,
            emissiveMap: null
        };

        const child = { geometry, material };
        const object3D = {
            traverse: (cb) => cb(child)
        };

        disposeSceneResources([{ object3D }]);

        expect(geometry.dispose).toHaveBeenCalled();
        expect(texture.dispose).toHaveBeenCalled();
        expect(material.dispose).toHaveBeenCalled();
    });
});
