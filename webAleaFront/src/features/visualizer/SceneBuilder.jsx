// SceneBuilder.js
import * as THREE from "three";

export function buildSceneFromJSON(sceneJSON, mountRef) {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // --- Lumières ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Création des objets depuis JSON ---
    const meshes = [];
    sceneJSON.scene.objects.forEach(obj => {
    if (obj.objectType === "mesh") {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(obj.geometry.vertices.flat());
        geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

        const indices = new Uint32Array(obj.geometry.indices.flat());
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        geometry.computeVertexNormals();

        const color = new THREE.Color(...obj.material.color);
        const material = new THREE.MeshStandardMaterial({
        color: color,
        opacity: obj.material.opacity,
        transparent: obj.material.opacity < 1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...obj.transform.position);
        mesh.rotation.set(...obj.transform.rotation);
        mesh.scale.set(...obj.transform.scale);

        scene.add(mesh);
        meshes.push(mesh);
    }
    });

    camera.position.z = 5;

    // --- Animation loop ---
    function animate() {
    requestAnimationFrame(animate);
    meshes.forEach(mesh => (mesh.rotation.y += 0.01));
    renderer.render(scene, camera);
    }

    animate();

    return { scene, camera, renderer, meshes };
}
