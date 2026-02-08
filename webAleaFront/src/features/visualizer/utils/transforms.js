const DEFAULT_POSITION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];

export function getTransformComponents(transform = {}) {
    const position = transform?.position ?? DEFAULT_POSITION;
    const rotation = transform?.rotation ?? DEFAULT_ROTATION;
    const scale = transform?.scale ?? DEFAULT_SCALE;

    return {
        position,
        rotation,
        scale
    };
}

export function isIdentityTransform(transform) {
    if (!transform) return true;
    const { position, rotation, scale } = getTransformComponents(transform);
    const isIdentityPos = position[0] === 0 && position[1] === 0 && position[2] === 0;
    const isIdentityRot = rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0;
    const isIdentityScale = scale[0] === 1 && scale[1] === 1 && scale[2] === 1;
    return isIdentityPos && isIdentityRot && isIdentityScale;
}

export function applyTransform(object3D, transform) {
    if (!object3D || !transform) return;
    const { position, rotation, scale } = getTransformComponents(transform);
    object3D.position.set(position[0], position[1], position[2]);
    object3D.rotation.set(rotation[0], rotation[1], rotation[2]);
    object3D.scale.set(scale[0], scale[1], scale[2]);
}
