import * as THREE from "three";
import { buildFloat32Array, buildIndexArray } from "../utils/geometry";
import { applyTransform } from "../utils/transforms";

/**
 * Builds a Three.js mesh from a JSON description.
 * @param {object} meshJSON
 * @returns {THREE.Mesh}
 */
export function meshFromJSON(meshJSON) {
    const geometry = new THREE.BufferGeometry();
    const points = meshJSON?.geometry?.vertices ?? [];
    const vertices = buildFloat32Array(points);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const faces = meshJSON?.geometry?.indices ?? [];
    const indices = buildIndexArray(faces);
    if (indices) {
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    geometry.computeVertexNormals();

    const color = meshJSON?.material?.color ?? [0.8, 0.8, 0.8];
    const opacity = meshJSON?.material?.opacity ?? 1;

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(...color),
        opacity,
        transparent: opacity < 1
    });

    const mesh = new THREE.Mesh(geometry, material);
    if (meshJSON?.transform) {
        applyTransform(mesh, meshJSON.transform);
    }

    return mesh;
}
