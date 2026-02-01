// lineFactory.jsx

import * as THREE from "three";

/**
 * 
 * @param {string} lineJSON 
 * @returns Three.Line
 */
export function lineFromJSON(lineJSON) {
    const points = lineJSON.geometry.vertices.map(
        v => new THREE.Vector3(v[0], v[1], v[2])
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const color = lineJSON.material?.color ?? [0, 0, 0]; // noir par défaut
    const opacity = lineJSON.material?.opacity ?? 1;

    const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(...color),
        opacity: opacity,
        transparent: opacity < 1
    });

    const line = new THREE.Line(geometry, material);
    if (lineJSON.transform) {
        const t = lineJSON.transform;
        line.position.set(...(t.position ?? [0,0,0]));
        line.rotation.set(...(t.rotation ?? [0,0,0]));
        line.scale.set(...(t.scale ?? [1,1,1]));
    }

    return line;
}
