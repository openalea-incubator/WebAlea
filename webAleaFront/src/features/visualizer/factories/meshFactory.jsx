// meshFactory.jsx

import * as THREE from "three";

/**
 * Builds a Three.js mesh from a JSON description.
 * @param {string} meshJSON 
 * @returns Three.Mesh
 */
export function meshFromJSON(meshJSON) {
    const geometry = new THREE.BufferGeometry();
    const points = meshJSON.geometry.vertices || [];
    const vertices = new Float32Array(points.length * 3);
    let offset = 0;
    for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        vertices[offset] = p[0];
        vertices[offset + 1] = p[1];
        vertices[offset + 2] = p[2];
        offset += 3;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    if (meshJSON.geometry.indices) {
        const faces = meshJSON.geometry.indices || [];
        const indices = new Uint32Array(faces.length * 3);
        offset = 0;
        for (let i = 0; i < faces.length; i += 1) {
            const tri = faces[i];
            indices[offset] = tri[0];
            indices[offset + 1] = tri[1];
            indices[offset + 2] = tri[2];
            offset += 3;
        }
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    geometry.computeVertexNormals();

    // Material par défaut si absent
    const color = meshJSON.material?.color ?? [0.8, 0.8, 0.8]; // gris clair
    const opacity = meshJSON.material?.opacity ?? 1;

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(...color),
        opacity: opacity,
        transparent: opacity < 1
    });

    const mesh = new THREE.Mesh(geometry, material);

    if (meshJSON.transform) {
        const t = meshJSON.transform;
        mesh.position.set(...(t.position ?? [0,0,0]));
        mesh.rotation.set(...(t.rotation ?? [0,0,0]));
        mesh.scale.set(...(t.scale ?? [1,1,1]));
    }

    return mesh;
}
