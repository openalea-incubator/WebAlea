// SceneBuilder.jsx
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildObjectNode, applyAnimation } from "./SceneFactory";
import { lightFromJSON } from "./factories/lightFactory";

function buildFloat32Array(points) {
    const count = points.length * 3;
    const array = new Float32Array(count);
    let offset = 0;
    for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        array[offset] = p[0];
        array[offset + 1] = p[1];
        array[offset + 2] = p[2];
        offset += 3;
    }
    return array;
}

function buildUint32Array(indices) {
    const count = indices.length * 3;
    const array = new Uint32Array(count);
    let offset = 0;
    for (let i = 0; i < indices.length; i += 1) {
        const tri = indices[i];
        array[offset] = tri[0];
        array[offset + 1] = tri[1];
        array[offset + 2] = tri[2];
        offset += 3;
    }
    return array;
}

/**
 * Builds a Three.js scene from a JSON description.
 * @param {object} sceneJSON 
 * @param {React.RefObject} mountRef 
 * @returns 
 */
export function buildSceneFromJSON(sceneJSON, mountRef) {
    if (!mountRef.current || !sceneJSON) return;

    let animationId;
    console.log("Building scene from JSON:", sceneJSON);

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

    // Renderer setup (performance tuned)
    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Controls (interactive: orbit/zoom/pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = false;

    // Objects creation
    const objects = [];
    const staticMeshes = [];
    const otherObjects = [];

    (sceneJSON.objects ?? []).forEach(obj => {
        if (obj?.objectType === "mesh" && !obj.animation && !obj.children) {
            staticMeshes.push(obj);
        } else {
            otherObjects.push(obj);
        }
    });

    // Merge static meshes by material to reduce draw calls
    if (staticMeshes.length > 0) {
        const groups = new Map();
        const nonMerged = [];

        const hasSimpleTransform = (meshJSON) => {
            if (!meshJSON.transform) return true;
            const t = meshJSON.transform;
            const pos = t.position ?? [0, 0, 0];
            const rot = t.rotation ?? [0, 0, 0];
            const scale = t.scale ?? [1, 1, 1];
            const isIdentityPos = pos[0] === 0 && pos[1] === 0 && pos[2] === 0;
            const isIdentityRot = rot[0] === 0 && rot[1] === 0 && rot[2] === 0;
            const isIdentityScale = scale[0] === 1 && scale[1] === 1 && scale[2] === 1;
            return isIdentityPos && isIdentityRot && isIdentityScale;
        };

        staticMeshes.forEach(obj => {
            const color = obj.material?.color ?? [0.8, 0.8, 0.8];
            const opacity = obj.material?.opacity ?? 1;
            const hasIndices = Boolean(obj.geometry?.indices);
            const key = `${color.join(",")}|${opacity}|${hasIndices ? "idx" : "noidx"}`;

            if (!hasSimpleTransform(obj)) {
                nonMerged.push(obj);
                return;
            }

            if (!groups.has(key)) groups.set(key, { color, opacity, items: [] });
            groups.get(key).items.push(obj);
        });

        groups.forEach(group => {
            const geometries = [];
            group.items.forEach(meshJSON => {
                const geometry = new THREE.BufferGeometry();
                const vertices = buildFloat32Array(meshJSON.geometry.vertices || []);
                geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

                if (meshJSON.geometry.indices) {
                    const indices = buildUint32Array(meshJSON.geometry.indices || []);
                    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
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
                scene.add(mesh);
                objects.push({ object3D: mesh, animation: null });
            }

            geometries.forEach(g => g.dispose());
        });

        // Render non-merged static meshes normally
        nonMerged.forEach(obj => {
            const object3D = buildObjectNode(obj);
            if (object3D) {
                scene.add(object3D);
                objects.push({ object3D, animation: obj.animation ?? null });
            }
        });
    }

    // Create remaining objects normally
    otherObjects.forEach(obj => {
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
    // (sceneJSON.lights ?? []).forEach(lightJSON => {
    //     const light = lightFromJSON(lightJSON);
    //     if (light) scene.add(light);
    // });
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 10, 10);
    scene.add(dir);

    // Fit camera to scene bounds (adaptive framing)
    const bounds = new THREE.Box3().setFromObject(scene);
    if (!bounds.isEmpty()) {
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        bounds.getSize(size);
        bounds.getCenter(center);

        const maxSize = Math.max(size.x, size.y, size.z);
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (maxSize / 2) / Math.tan(fov / 2);

        // Position camera along Z with a small offset
        camera.position.set(center.x, center.y, center.z + distance * 1.2);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
    } else {
        camera.position.z = 5;
        controls.update();
    }

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


    const hasAnimations = objects.some(({ animation }) => Boolean(animation));

    function renderOnce() {
        renderer.render(scene, camera);
    }

    // --- Animation loop (only if needed) ---
    function animate() {
        animationId = requestAnimationFrame(animate);

        objects.forEach(({ object3D, animation }) => {
            if (animation) applyAnimation(object3D, animation);
        });

        renderer.render(scene, camera);
    }

    // --- Cleanup function ---
    function dispose() {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener("resize", onResize);
        controls.removeEventListener("change", renderOnce);

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
        controls.dispose();
        renderer.dispose();
        // Clear the mount element
        if (renderer.domElement.parentNode) {
            renderer.domElement.remove();
        }
    }



    if (hasAnimations) {
        animate();
    } else {
        controls.addEventListener("change", renderOnce);
        renderOnce();
    }

    return { scene, camera, renderer, objects, dispose };
}
