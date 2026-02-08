import { describe, test, expect } from "@jest/globals";
import { buildFloat32Array, buildIndexArray } from "../../../../../src/features/visualizer/utils/geometry";

describe("geometry utils", () => {
    test("buildFloat32Array flattens points", () => {
        const points = [
            [1, 2, 3],
            [4, 5, 6]
        ];
        const array = buildFloat32Array(points);
        expect(array).toBeInstanceOf(Float32Array);
        expect(Array.from(array)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test("buildIndexArray returns null for empty indices", () => {
        expect(buildIndexArray([])).toBeNull();
        expect(buildIndexArray()).toBeNull();
    });

    test("buildIndexArray returns Uint16Array for small indices", () => {
        const indices = [[0, 1, 2], [2, 3, 4]];
        const array = buildIndexArray(indices);
        expect(array).toBeInstanceOf(Uint16Array);
        expect(Array.from(array)).toEqual([0, 1, 2, 2, 3, 4]);
    });

    test("buildIndexArray returns Uint32Array for large indices", () => {
        const indices = [[70000, 1, 2]];
        const array = buildIndexArray(indices);
        expect(array).toBeInstanceOf(Uint32Array);
        expect(array[0]).toBe(70000);
    });
});
