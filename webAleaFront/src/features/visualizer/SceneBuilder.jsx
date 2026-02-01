// SceneBuilder.jsx
import * as THREE from "three";
import { buildObjectNode, applyAnimation } from "./SceneFactory";
import { lightFromJSON } from "./factories/lightFactory";

/**
 * Builds a Three.js scene from a JSON description.
 * @param {string} sceneJSON 
 * @param {React.RefObject} mountRef 
 * @returns 
 */
export function buildSceneFromJSON(sceneJSON, mountRef) {
    if (!mountRef.current) return;

    let animationId;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
    );

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Objects creation
    const objects = [];

    sceneJSON.objects.forEach(obj => {
        const object3D = buildObjectNode(obj);
        if (object3D) {
            scene.add(object3D);
            objects.push({
                object3D,
                animation: obj.animation ?? null
            });
        }
    });

    // Lights creation
    (sceneJSON.lights ?? []).forEach(lightJSON => {
        const light = lightFromJSON(lightJSON);
        if (light) scene.add(light);
    });

    camera.position.z = 5;

    // Handle window resize
    function onResize() {
        if (!mountRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    window.addEventListener("resize", onResize);


    // --- Animation loop ---
    function animate() {
        animationId = requestAnimationFrame(animate);

        objects.forEach(({ object3D, animation }) => {
            if (animation) applyAnimation(object3D, animation);
        });

        renderer.render(scene, camera);
    }

    // --- Cleanup function ---
    function dispose() {
        cancelAnimationFrame(animationId);
        window.removeEventListener("resize", onResize);

        objects.forEach(({ object3D }) => {
            object3D.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        renderer.dispose();
        // Clear the mount element
        if (renderer.domElement.parentNode) {
            renderer.domElement.remove();
        }
    }



    animate();

    return { scene, camera, renderer, objects, dispose };
}
