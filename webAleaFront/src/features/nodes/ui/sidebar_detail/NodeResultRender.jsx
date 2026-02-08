import VisualizerModal from "../../../visualizer/VisualizerModal";
import { useVisualizerScene } from "../../../visualizer/hooks/useVisualizerScene";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

export default function NodeResultRender() {
    const { currentNode, nodes } = useFlow();
    const {
        isLoading,
        error,
        warning,
        showModal,
        sceneVersion,
        sceneJSON,
        hasScene,
        setShowModal,
        handleRender,
        clearScene
    } = useVisualizerScene({ currentNodeId: currentNode, nodes });

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
                    {isLoading ? "Rendering..." : (hasScene ? "View Render" : "Launch Render")}
                </button>
                <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={clearScene}
                    disabled={!hasScene || isLoading}
                >
                    Stop Render
                </button>
            </div>
            {isLoading && (
                <div className="text-muted small mb-2">Loading 3D scene...</div>
            )}
            {warning && !error && (
                <div className="text-warning small mb-2">
                    {warning}
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
                sceneJSON={sceneJSON}
                key={`scene-${sceneVersion}`}
            />
        </div>
    );
}
