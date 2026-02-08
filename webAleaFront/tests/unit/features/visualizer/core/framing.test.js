import { describe, test, expect, jest } from "@jest/globals";
import * as THREE from "three";
import { frameCameraToScene } from "../../../../../src/features/visualizer/core/framing";

describe("frameCameraToScene", () => {
    test("frames camera when scene has bounds", () => {
        const scene = new THREE.Scene();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial();
        scene.add(new THREE.Mesh(geometry, material));

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const controls = {
            target: new THREE.Vector3(),
            update: jest.fn()
        };

        frameCameraToScene(scene, camera, controls);

        expect(camera.position.z).not.toBe(0);
        expect(controls.update).toHaveBeenCalled();
    });

    test("falls back to default camera position when scene is empty", () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const controls = { target: new THREE.Vector3(), update: jest.fn() };

        frameCameraToScene(scene, camera, controls);

        expect(camera.position.z).toBe(5);
    });
});
