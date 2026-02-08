import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { createRenderLoop } from "../../../../../src/features/visualizer/core/animation";

describe("animation loop", () => {
    beforeEach(() => {
        global.requestAnimationFrame = jest.fn(() => 101);
        global.cancelAnimationFrame = jest.fn();
    });

    test("renderOnce renders a frame", () => {
        const renderer = { render: jest.fn() };
        const scene = {};
        const camera = {};
        const objects = [];
        const loop = createRenderLoop({ renderer, scene, camera, objects, applyAnimation: jest.fn() });

        loop.renderOnce();
        expect(renderer.render).toHaveBeenCalledWith(scene, camera);
    });

    test("start and stop manage animation frames", () => {
        const renderer = { render: jest.fn() };
        const scene = {};
        const camera = {};
        const objects = [{ object3D: {}, animation: { type: "rotation", speed: { x: 0, y: 0, z: 0 } } }];
        const applyAnimation = jest.fn();
        const loop = createRenderLoop({ renderer, scene, camera, objects, applyAnimation });

        loop.start();

        expect(global.requestAnimationFrame).toHaveBeenCalled();
        expect(renderer.render).toHaveBeenCalledWith(scene, camera);
        expect(applyAnimation).toHaveBeenCalled();

        loop.stop();
        expect(global.cancelAnimationFrame).toHaveBeenCalledWith(101);
    });
});
