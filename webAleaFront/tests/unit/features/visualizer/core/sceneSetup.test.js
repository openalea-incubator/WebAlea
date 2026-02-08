import { describe, test, expect, jest } from "@jest/globals";

jest.mock("three", () => {
    const actual = jest.requireActual("three");
    return {
        ...actual,
        WebGLRenderer: jest.fn().mockImplementation(() => ({
            setPixelRatio: jest.fn(),
            setSize: jest.fn(),
            domElement: {}
        }))
    };
});

jest.mock("three/examples/jsm/controls/OrbitControls.js", () => ({
    OrbitControls: jest.fn().mockImplementation(() => ({
        enableDamping: true,
        screenSpacePanning: true
    }))
}));

import * as THREE from "three";
import {
    createCamera,
    createControls,
    createRenderer,
    createScene
} from "../../../../../src/features/visualizer/core/sceneSetup";

describe("sceneSetup", () => {
    test("createScene returns a THREE.Scene", () => {
        const scene = createScene();
        expect(scene).toBeInstanceOf(THREE.Scene);
    });

    test("createCamera builds a perspective camera", () => {
        const mountRef = { current: { clientWidth: 100, clientHeight: 50 } };
        const camera = createCamera(mountRef);
        expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
        expect(camera.aspect).toBe(2);
    });

    test("createRenderer configures renderer and attaches canvas", () => {
        const mountRef = {
            current: {
                clientWidth: 100,
                clientHeight: 50,
                innerHTML: "",
                appendChild: jest.fn()
            }
        };

        const renderer = createRenderer(mountRef);
        expect(renderer.setSize).toHaveBeenCalledWith(100, 50);
        expect(mountRef.current.appendChild).toHaveBeenCalled();
    });

    test("createControls returns orbit controls", () => {
        const camera = new THREE.PerspectiveCamera();
        const renderer = { domElement: {} };
        const controls = createControls(camera, renderer);
        expect(controls.enableDamping).toBe(false);
        expect(controls.screenSpacePanning).toBe(false);
    });
});
