import * as THREE from "three";
import { meshFromJSON } from "./factories/meshFactory";
import { lineFromJSON } from "./factories/lineFactory";
import { textFromJSON } from "./factories/textFactory";
import { applyTransform } from "./utils/transforms";

// Factory registry mapping object types to their respective builder functions
const FACTORY_REGISTRY = {
    mesh: meshFromJSON,
    line: lineFromJSON,
    text: textFromJSON,
    group: (objJSON) => {
        const group = new THREE.Group();
        if (objJSON?.transform) {
            applyTransform(group, objJSON.transform);
        }
        return group;
    }
};

/**
 * Recursively builds a Three.js object and its children from a JSON description.
 * @param {object} objJSON
 * @returns {THREE.Object3D | null}
 */
export function buildObjectNode(objJSON) {
    const object3D = objectFromJSON(objJSON);
    if (!object3D) return null;

    if (objJSON.children) {
        objJSON.children.forEach(childJSON => {
            const child = buildObjectNode(childJSON);
            if (child) object3D.add(child);
        });
    }

    return object3D;
}

/**
 * Builds a Three.js object from a JSON description.
 * @param {object} objJSON
 * @returns {THREE.Object3D | null}
 */
function objectFromJSON(objJSON) {
    const factory = FACTORY_REGISTRY[objJSON?.objectType];
    if (!factory) {
        console.warn("Unknown objectType:", objJSON?.objectType);
        return null;
    }
    return factory(objJSON);
}

/**
 * Applies animation to a Three.js object based on the animation description.
 * @param {THREE.Object3D} object
 * @param {object} animation
 */
export function applyAnimation(object, animation) {
    if (!animation) return;

    switch (animation.type) {
        case "rotation":
            object.rotation.x += animation.speed.x;
            object.rotation.y += animation.speed.y;
            object.rotation.z += animation.speed.z;
            break;
        case "translation":
            object.position.x += animation.speed.x;
            object.position.y += animation.speed.y;
            object.position.z += animation.speed.z;
            break;
        case "scaling":
            object.scale.x += animation.speed.x;
            object.scale.y += animation.speed.y;
            object.scale.z += animation.speed.z;
            break;
        default:
            console.warn("Unknown animation type:", animation.type);
    }
}
