import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals";
import * as THREE from "three";
import { textFromJSON } from "../../../../../src/features/visualizer/factories/textFactory";

describe("textFactory", () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;

    beforeAll(() => {
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
            font: "",
            textBaseline: "",
            measureText: jest.fn(() => ({ width: 100 })),
            fillText: jest.fn(),
            fillRect: jest.fn()
        }));
    });

    afterAll(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    test("builds a sprite with cached texture", () => {
        const json = {
            text: "Hello",
            fontSize: 24,
            color: [1, 0, 0],
            opacity: 0.8,
            position: [1, 2, 3]
        };

        const sprite1 = textFromJSON(json);
        const sprite2 = textFromJSON(json);

        expect(sprite1).toBeInstanceOf(THREE.Sprite);
        expect(sprite1.material.map).toBe(sprite2.material.map);
        expect(sprite1.position.x).toBe(1);
    });
});
