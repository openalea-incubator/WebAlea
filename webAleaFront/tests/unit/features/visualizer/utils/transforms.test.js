import { describe, test, expect, jest } from "@jest/globals";
import {
    applyTransform,
    getTransformComponents,
    isIdentityTransform
} from "../../../../../src/features/visualizer/utils/transforms";

describe("transforms utils", () => {
    test("getTransformComponents returns defaults", () => {
        expect(getTransformComponents()).toEqual({
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        });
    });

    test("isIdentityTransform detects non-identity", () => {
        expect(isIdentityTransform()).toBe(true);
        expect(isIdentityTransform({ position: [0, 0, 0] })).toBe(true);
        expect(isIdentityTransform({ position: [1, 0, 0] })).toBe(false);
    });

    test("applyTransform sets object transforms", () => {
        const object3D = {
            position: { set: jest.fn() },
            rotation: { set: jest.fn() },
            scale: { set: jest.fn() }
        };
        const transform = {
            position: [1, 2, 3],
            rotation: [0.1, 0.2, 0.3],
            scale: [2, 2, 2]
        };

        applyTransform(object3D, transform);

        expect(object3D.position.set).toHaveBeenCalledWith(1, 2, 3);
        expect(object3D.rotation.set).toHaveBeenCalledWith(0.1, 0.2, 0.3);
        expect(object3D.scale.set).toHaveBeenCalledWith(2, 2, 2);
    });
});
