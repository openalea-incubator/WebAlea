export function buildFloat32Array(points = []) {
    const count = points.length * 3;
    const array = new Float32Array(count);
    let offset = 0;
    for (let i = 0; i < points.length; i += 1) {
        const point = points[i] ?? [0, 0, 0];
        array[offset] = point[0] ?? 0;
        array[offset + 1] = point[1] ?? 0;
        array[offset + 2] = point[2] ?? 0;
        offset += 3;
    }
    return array;
}

export function buildIndexArray(indices = []) {
    if (!indices.length) return null;

    let maxIndex = 0;
    for (let i = 0; i < indices.length; i += 1) {
        const tri = indices[i] ?? [0, 0, 0];
        if (tri[0] > maxIndex) maxIndex = tri[0];
        if (tri[1] > maxIndex) maxIndex = tri[1];
        if (tri[2] > maxIndex) maxIndex = tri[2];
    }

    const ArrayType = maxIndex > 65535 ? Uint32Array : Uint16Array;
    const array = new ArrayType(indices.length * 3);
    let offset = 0;
    for (let i = 0; i < indices.length; i += 1) {
        const tri = indices[i] ?? [0, 0, 0];
        array[offset] = tri[0] ?? 0;
        array[offset + 1] = tri[1] ?? 0;
        array[offset + 2] = tri[2] ?? 0;
        offset += 3;
    }
    return array;
}
