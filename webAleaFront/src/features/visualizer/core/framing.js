import * as THREE from "three";

export function frameCameraToScene(scene, camera, controls) {
    const bounds = new THREE.Box3().setFromObject(scene);
    if (!bounds.isEmpty()) {
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        bounds.getSize(size);
        bounds.getCenter(center);

        const maxSize = Math.max(size.x, size.y, size.z);
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (maxSize / 2) / Math.tan(fov / 2);

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
}
