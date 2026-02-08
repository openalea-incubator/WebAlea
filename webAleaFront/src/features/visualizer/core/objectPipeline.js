import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildObjectNode } from "../SceneFactory";
import { buildFloat32Array, buildIndexArray } from "../utils/geometry";
import { isIdentityTransform } from "../utils/transforms";

function isStaticMesh(objJSON) {
    return objJSON?.objectType === "mesh" && !objJSON.animation && !objJSON.children;
}

function splitObjects(objects = []) {
    const staticMeshes = [];
    const otherObjects = [];

    objects.forEach(obj => {
        if (isStaticMesh(obj)) {
            staticMeshes.push(obj);
        } else {
            otherObjects.push(obj);
        }
    });

    return { staticMeshes, otherObjects };
}

function groupStaticMeshes(staticMeshes) {
    const groups = new Map();
    const nonMerged = [];

    staticMeshes.forEach(obj => {
        if (!isIdentityTransform(obj.transform)) {
            nonMerged.push(obj);
            return;
        }

        const color = obj.material?.color ?? [0.8, 0.8, 0.8];
        const opacity = obj.material?.opacity ?? 1;
        const hasIndices = Boolean(obj.geometry?.indices);
        const key = `${color.join(",")}|${opacity}|${hasIndices ? "idx" : "noidx"}`;

        if (!groups.has(key)) {
            groups.set(key, { color, opacity, items: [] });
        }
        groups.get(key).items.push(obj);
    });

    return { groups, nonMerged };
}

function buildMergedMeshes(groups) {
    const mergedObjects = [];

    groups.forEach(group => {
        const geometries = [];

        group.items.forEach(meshJSON => {
            const geometry = new THREE.BufferGeometry();
            const vertices = buildFloat32Array(meshJSON.geometry?.vertices ?? []);
            geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

            if (meshJSON.geometry?.indices) {
                const indices = buildIndexArray(meshJSON.geometry.indices ?? []);
                if (indices) {
                    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                }
            }

            geometries.push(geometry);
        });

        const mergedGeometry = mergeGeometries(geometries, false);
        if (mergedGeometry) {
            mergedGeometry.computeVertexNormals();
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(...group.color),
                opacity: group.opacity,
                transparent: group.opacity < 1
            });

            const mesh = new THREE.Mesh(mergedGeometry, material);
            mergedObjects.push({ object3D: mesh, animation: null });
        }

        geometries.forEach(geometry => geometry.dispose());
    });

    return mergedObjects;
}

function buildObjectEntries(objects = []) {
    const entries = [];

    objects.forEach(obj => {
        const object3D = buildObjectNode(obj);
        if (!object3D) return;

        entries.push({
            object3D,
            animation: obj.animation ?? null
        });
    });

    return entries;
}

export function buildSceneObjects(scene, sceneJSON) {
    const objects = [];
    const rawObjects = Array.isArray(sceneJSON.objects) ? sceneJSON.objects : [];
    const { staticMeshes, otherObjects } = splitObjects(rawObjects);
    const { groups, nonMerged } = groupStaticMeshes(staticMeshes);
    const mergedObjects = buildMergedMeshes(groups);

    mergedObjects.forEach(entry => {
        scene.add(entry.object3D);
        objects.push(entry);
    });

    buildObjectEntries(nonMerged).forEach(entry => {
        scene.add(entry.object3D);
        objects.push(entry);
    });

    buildObjectEntries(otherObjects).forEach(entry => {
        scene.add(entry.object3D);
        objects.push(entry);
    });

    const hasAnimations = objects.some(({ animation }) => Boolean(animation));

    return { objects, hasAnimations };
}
