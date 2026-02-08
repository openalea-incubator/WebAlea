function disposeTexture(texture) {
    if (texture && typeof texture.dispose === "function") {
        texture.dispose();
    }
}

function disposeMaterial(material) {
    if (!material) return;
    if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
        return;
    }

    disposeTexture(material.map);
    disposeTexture(material.alphaMap);
    disposeTexture(material.normalMap);
    disposeTexture(material.roughnessMap);
    disposeTexture(material.metalnessMap);
    disposeTexture(material.emissiveMap);

    if (typeof material.dispose === "function") {
        material.dispose();
    }
}

export function disposeSceneResources(objects) {
    objects.forEach(({ object3D }) => {
        object3D.traverse(child => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                disposeMaterial(child.material);
            }
        });
    });
}
