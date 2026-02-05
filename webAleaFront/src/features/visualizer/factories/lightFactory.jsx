// lightFactory.jsx

import * as THREE from "three";

/**
 * 
 * @param {string} lightJSON 
 * @returns Three.Light
 */
export function lightFromJSON(lightJSON) {
    let light;
    const color = new THREE.Color(...lightJSON.color);
    switch (lightJSON.type) {
        case "ambient":
            light = new THREE.AmbientLight(color, lightJSON.intensity);
            break;
        case "directional":
            light = new THREE.DirectionalLight(color, lightJSON.intensity);
            light.position.set(...lightJSON.position);
            break;
        default:
            console.warn(`Unknown light type: ${lightJSON.type}`);
            return null;
    }
    return light;
}