import { describe, test, expect, jest } from "@jest/globals";
import { attachResizeHandler } from "../../../../../src/features/visualizer/core/resize";

describe("resize handler", () => {
    test("updates camera and renderer on resize", () => {
        const mountRef = { current: { clientWidth: 200, clientHeight: 100 } };
        const renderer = { setSize: jest.fn() };
        const camera = { aspect: 1, updateProjectionMatrix: jest.fn() };

        const detach = attachResizeHandler(mountRef, renderer, camera);
        window.dispatchEvent(new Event("resize"));

        expect(camera.aspect).toBe(2);
        expect(camera.updateProjectionMatrix).toHaveBeenCalled();
        expect(renderer.setSize).toHaveBeenCalledWith(200, 100);

        detach();
    });
});
