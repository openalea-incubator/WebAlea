import { useCallback, useState } from "react";
import { fetchNodeScene } from "../../../../api/visualizerAPI";
import VisualizerModal from "../../../visualizer/VisualizerModal";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

export default function NodeResultRender() {
    const { currentNode, nodes } = useFlow();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sceneJSON, setSceneJSON] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleRender = useCallback(async () => {
        if (sceneJSON) {
            setShowModal(true);
            return;
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

        setIsLoading(true);
        setError(null);

        try {
            const sceneData = await fetchNodeScene({
                nodeId: node.id,
                visualizationData: { outputs }
            });
            console.log("Fetched scene data:", sceneData);
            if (!sceneData?.success) {
                setError(sceneData?.error || "Rendering failed.");
                return;
            }

            const rawScene = sceneData.scene;
            const parsedScene = typeof rawScene === "string" ? JSON.parse(rawScene) : rawScene;
            setSceneJSON(parsedScene);
            setShowModal(true);
        } catch (err) {
            setError(err?.message || "Unexpected error while rendering.");
        } finally {
            setIsLoading(false);
        }
    }, [sceneJSON]);

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
                    {isLoading ? "Rendering..." : (sceneJSON ? "View Render" : "Launch Render")}
                </button>
                <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                        setShowModal(false);
                        setSceneJSON(null);
                        setError(null);
                    }}
                    disabled={!sceneJSON || isLoading}
                >
                    Stop Render
                </button>
            </div>
            {isLoading && (
                <div className="text-muted small mb-2">Loading 3D scene...</div>
            )}
            {error && (
                <div className="text-danger small mb-2">
                    {error}
                </div>
            )}
            <VisualizerModal
                show={showModal}
                onClose={() => setShowModal(false)}
                sceneJSON={sceneJSON}
            />
        </div>
    );
}
