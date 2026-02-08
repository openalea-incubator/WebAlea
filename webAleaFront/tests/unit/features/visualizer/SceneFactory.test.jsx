import { describe, test, expect } from "@jest/globals";
import * as THREE from "three";
import { applyAnimation, buildObjectNode } from "../../../../src/features/visualizer/SceneFactory";

describe("SceneFactory", () => {
    test("buildObjectNode builds group with children", () => {
        const objJSON = {
            objectType: "group",
            children: [
                {
                    objectType: "mesh",
                    geometry: { vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] }
                }
            ]
        };

        const group = buildObjectNode(objJSON);
        expect(group).toBeInstanceOf(THREE.Group);
        expect(group.children.length).toBe(1);
    });

    test("buildObjectNode returns null for unknown type", () => {
        const objJSON = { objectType: "unknown" };
        expect(buildObjectNode(objJSON)).toBeNull();
    });

    test("applyAnimation supports rotation, translation, scaling", () => {
        const object = new THREE.Object3D();
        applyAnimation(object, {
            type: "rotation",
            speed: { x: 0.1, y: 0.2, z: 0.3 }
        });
        expect(object.rotation.x).toBeCloseTo(0.1);

        applyAnimation(object, {
            type: "translation",
            speed: { x: 1, y: 2, z: 3 }
        });
        expect(object.position.x).toBe(1);

        applyAnimation(object, {
            type: "scaling",
            speed: { x: 0.5, y: 0.5, z: 0.5 }
        });
        expect(object.scale.x).toBeCloseTo(1.5);
    });
});
