export function extractSceneRef(outputs = []) {
    const outputWithSceneRef = outputs.find(output =>
        output?.value &&
        typeof output.value === "object" &&
        (output.value.__type__ === "plantgl_scene_ref" || output.value.__type__ === "plantgl_scene_json_ref") &&
        Boolean(output.value.__ref__)
    );

    return {
        sceneRef: outputWithSceneRef?.value?.__ref__ ?? null,
        sceneRefExpectedShapeCount: outputWithSceneRef?.value?.__meta__?.shape_count ?? null
    };
}

export function buildOutputSummary(outputs = []) {
    return outputs.map((out, idx) => ({
        idx,
        name: out?.name,
        type: out?.type,
        valueType: out?.value?.__type__ || typeof out?.value
    }));
}

export function buildVisualizationData(outputs = []) {
    const { sceneRef, sceneRefExpectedShapeCount } = extractSceneRef(outputs);
    if (sceneRef) {
        return {
            scene_ref: sceneRef,
            scene_ref_expected_shape_count: sceneRefExpectedShapeCount,
            outputs
        };
    }

    return { outputs };
}

export function parseSceneData(sceneData) {
    const rawScene = sceneData?.scene;
    const parsedScene = typeof rawScene === "string" ? JSON.parse(rawScene) : rawScene;
    const objectCount = Array.isArray(parsedScene?.objects) ? parsedScene.objects.length : 0;

    return { parsedScene, objectCount };
}
