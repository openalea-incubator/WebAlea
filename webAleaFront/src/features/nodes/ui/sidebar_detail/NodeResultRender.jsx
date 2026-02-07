import { useCallback, useRef, useState } from "react";
import { fetchNodeScene } from "../../../../api/visualizerAPI";
import VisualizerModal from "../../../visualizer/VisualizerModal";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

export default function NodeResultRender() {
    const { currentNode, nodes } = useFlow();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const sceneJSONRef = useRef(null);
    const sceneNodeIdRef = useRef(null);
    const [sceneVersion, setSceneVersion] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [sceneWarning, setSceneWarning] = useState(null);

    const handleRender = useCallback(async () => {
        if (sceneJSONRef.current && sceneNodeIdRef.current === currentNode) {
            console.log("[Visualizer] Reusing cached scene for node", currentNode);
            setShowModal(true);
            return;
        }
        if (sceneNodeIdRef.current !== currentNode) {
            console.log("[Visualizer] Switching node, clearing previous scene cache", {
                previousNode: sceneNodeIdRef.current,
                nextNode: currentNode
            });
            sceneJSONRef.current = null;
            sceneNodeIdRef.current = null;
        }

        const node = nodes.find(n => n.id === currentNode);
        if (!node) {
            setError("No node selected.");
            return;
        }

        const outputs = node.data?.outputs ?? [];
        if (!outputs.length) {
            setError("No outputs available for visualization.");
            return;
        }
        const outputWithSceneRef = outputs.find((output) =>
            output?.value &&
            typeof output.value === "object" &&
            (output.value.__type__ === "plantgl_scene_ref" || output.value.__type__ === "plantgl_scene_json_ref") &&
            Boolean(output.value.__ref__)
        );
        const sceneRef = outputWithSceneRef?.value?.__ref__ ?? null;
        const sceneRefExpectedShapeCount =
            outputWithSceneRef?.value?.__meta__?.shape_count ?? null;
        const outputSummary = outputs.map((out, idx) => ({
            idx,
            name: out?.name,
            type: out?.type,
            valueType: out?.value?.__type__ || typeof out?.value
        }));
        console.log("[Visualizer] Render request payload summary", {
            nodeId: node.id,
            outputCount: outputs.length,
            sceneRef,
            outputSummary
        });

        setIsLoading(true);
        setError(null);
        setSceneWarning(null);

        try {
            const sceneData = await fetchNodeScene({
                nodeId: node.id,
                visualizationData: sceneRef
                    ? {
                        scene_ref: sceneRef,
                        scene_ref_expected_shape_count: sceneRefExpectedShapeCount,
                        outputs
                    }
                    : { outputs }
            });
            console.log("Fetched scene data:", sceneData);
            if (!sceneData?.success) {
                console.error("[Visualizer] Backend visualize failed", sceneData);
                setError(sceneData?.error || "Rendering failed.");
                return;
            }

            const rawScene = sceneData.scene;
            const parsedScene = typeof rawScene === "string" ? JSON.parse(rawScene) : rawScene;
            const objectCount = Array.isArray(parsedScene?.objects) ? parsedScene.objects.length : 0;
            console.log("[Visualizer] Scene ready", {
                nodeId: node.id,
                cacheHit: sceneData?.cacheHit,
                warning: sceneData?.warning,
                objects: objectCount
            });
            sceneJSONRef.current = parsedScene;
            sceneNodeIdRef.current = currentNode;
            setSceneVersion(prev => prev + 1);
            if (sceneData?.warning) {
                setSceneWarning(sceneData.warning);
            } else if (parsedScene && Array.isArray(parsedScene.objects) && parsedScene.objects.length === 0) {
                setSceneWarning("Scene contains no objects.");
            }
            setShowModal(true);
        } catch (err) {
            console.error("[Visualizer] Unexpected render error", err);
            setError(err?.message || "Unexpected error while rendering.");
        } finally {
            setIsLoading(false);
        }
    }, [currentNode, nodes]);

    return (
        <div className="p-3 bg-white rounded shadow-sm">
            <h5 className="mb-3">Node Result</h5>
            <p>Click "Launch Render" to visualize the 3D node result.</p>
            <div className="d-flex gap-2 mb-3">
                <button
                    className="btn btn-dark btn-sm"
                    onClick={handleRender}
                    disabled={isLoading}
                >
                    {isLoading ? "Rendering..." : (sceneJSONRef.current ? "View Render" : "Launch Render")}
                </button>
                <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                        setShowModal(false);
                        sceneJSONRef.current = null;
                        sceneNodeIdRef.current = null;
                        setSceneVersion(prev => prev + 1);
                        setError(null);
                        setSceneWarning(null);
                    }}
                    disabled={!sceneJSONRef.current || isLoading}
                >
                    Stop Render
                </button>
            </div>
            {isLoading && (
                <div className="text-muted small mb-2">Loading 3D scene...</div>
            )}
            {sceneWarning && !error && (
                <div className="text-warning small mb-2">
                    {sceneWarning}
                </div>
            )}
            {error && (
                <div className="text-danger small mb-2">
                    {error}
                </div>
            )}
            <VisualizerModal
                show={showModal}
                onClose={() => setShowModal(false)}
                sceneJSON={sceneJSONRef.current}
                key={`scene-${sceneVersion}`}
            />
        </div>
    );
}
