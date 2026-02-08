import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { buildSceneFromJSON } from "../../../../src/features/visualizer/SceneBuilder";

const mockScene = { add: jest.fn() };
const mockCamera = {};
const mockRenderer = {
    dispose: jest.fn(),
    domElement: { remove: jest.fn(), parentNode: {} }
};
const mockControls = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispose: jest.fn()
};

const mockDetachResize = jest.fn();
const mockRenderOnce = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();

jest.mock("../../../../src/features/visualizer/core/sceneSetup", () => ({
    createScene: jest.fn(() => mockScene),
    createCamera: jest.fn(() => mockCamera),
    createRenderer: jest.fn(() => mockRenderer),
    createControls: jest.fn(() => mockControls)
}));

jest.mock("../../../../src/features/visualizer/core/objectPipeline", () => ({
    buildSceneObjects: jest.fn(() => ({
        objects: [{ object3D: { traverse: jest.fn() } }],
        hasAnimations: false
    }))
}));

jest.mock("../../../../src/features/visualizer/core/lighting", () => ({
    addDefaultLights: jest.fn()
}));

jest.mock("../../../../src/features/visualizer/core/framing", () => ({
    frameCameraToScene: jest.fn()
}));

jest.mock("../../../../src/features/visualizer/core/resize", () => ({
    attachResizeHandler: jest.fn(() => mockDetachResize)
}));

jest.mock("../../../../src/features/visualizer/core/animation", () => ({
    createRenderLoop: jest.fn(() => ({
        start: mockStart,
        stop: mockStop,
        renderOnce: mockRenderOnce
    }))
}));

jest.mock("../../../../src/features/visualizer/core/dispose", () => ({
    disposeSceneResources: jest.fn()
}));

jest.mock("../../../../src/features/visualizer/utils/debug", () => ({
    debugLog: jest.fn()
}));

describe("SceneBuilder", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns null when mountRef or sceneJSON is missing", () => {
        expect(buildSceneFromJSON(null, { current: null })).toBeNull();
        expect(buildSceneFromJSON({}, { current: null })).toBeNull();
    });

    test("builds scene and returns dispose handler", () => {
        const mountRef = {
            current: {
                clientWidth: 100,
                clientHeight: 100,
                innerHTML: "",
                appendChild: jest.fn()
            }
        };

        const sceneJSON = { objects: [] };
        const result = buildSceneFromJSON(sceneJSON, mountRef);

        expect(result).toBeTruthy();
        expect(mockRenderOnce).toHaveBeenCalled();

        result.dispose();

        expect(mockStop).toHaveBeenCalled();
        expect(mockDetachResize).toHaveBeenCalled();
        expect(mockControls.dispose).toHaveBeenCalled();
        expect(mockRenderer.dispose).toHaveBeenCalled();
    });
});
