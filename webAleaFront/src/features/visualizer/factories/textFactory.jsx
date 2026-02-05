// textFactory.jsx

import * as THREE from "three";

/**
 * 
 * @param {string} textJSON 
 * @returns Three.Sprite
 */
export function textFromJSON(textJSON) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = "48px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(textJSON.text, 0, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    sprite.position.set(...textJSON.position);
    sprite.scale.set(1, 0.5, 1);

    return sprite;
}
