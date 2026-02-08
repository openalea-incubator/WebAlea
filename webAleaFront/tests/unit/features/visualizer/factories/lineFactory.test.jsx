import { describe, test, expect } from "@jest/globals";
import * as THREE from "three";
import { lineFromJSON } from "../../../../../src/features/visualizer/factories/lineFactory";

describe("lineFactory", () => {
    test("builds a line with geometry and transform", () => {
        const lineJSON = {
            geometry: {
                vertices: [
                    [0, 0, 0],
                    [1, 1, 1]
                ]
            },
            material: {
                color: [1, 0, 0],
                opacity: 0.7
            },
            transform: {
                position: [1, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            }
        };

        const line = lineFromJSON(lineJSON);
        expect(line).toBeInstanceOf(THREE.Line);
        expect(line.geometry.attributes.position.count).toBe(2);
        expect(line.position.x).toBe(1);
    });
});
