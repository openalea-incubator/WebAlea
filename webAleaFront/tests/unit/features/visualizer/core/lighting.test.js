import { describe, test, expect } from "@jest/globals";
import * as THREE from "three";
import { addDefaultLights } from "../../../../../src/features/visualizer/core/lighting";

describe("lighting", () => {
    test("adds default lights to scene", () => {
        const scene = new THREE.Scene();
        const lights = addDefaultLights(scene);
        expect(lights).toHaveLength(2);
        expect(scene.children.length).toBeGreaterThanOrEqual(2);
    });
});
