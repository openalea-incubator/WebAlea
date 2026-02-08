import * as THREE from "three";
import { buildFloat32Array } from "../utils/geometry";
import { applyTransform } from "../utils/transforms";

/**
 * Builds a Three.js line from a JSON description.
 * @param {object} lineJSON
 * @returns {THREE.Line}
 */
export function lineFromJSON(lineJSON) {
    const points = lineJSON?.geometry?.vertices ?? [];
    const vertices = buildFloat32Array(points);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const color = lineJSON?.material?.color ?? [0, 0, 0];
    const opacity = lineJSON?.material?.opacity ?? 1;

    const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(...color),
        opacity,
        transparent: opacity < 1
    });

    const line = new THREE.Line(geometry, material);
    if (lineJSON?.transform) {
        applyTransform(line, lineJSON.transform);
    }

    return line;
}
