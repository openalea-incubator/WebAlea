import { useRef } from "react";
import { fetchNodeScene } from "../../../../api/visualizerAPI";
import { buildSceneFromJSON } from "../../../visualizer/SceneBuilder";

export default function NodeResultRender() {
    const mountRef = useRef(null);

    const handleRender = async () => {
        const sceneJSON = await fetchNodeScene();
        if (!sceneJSON) return;

        buildSceneFromJSON(sceneJSON, mountRef);
    };

    return (
    <div className="p-3 bg-white rounded shadow-sm">
        <h5 className="mb-3">Node Result</h5>
        <p>Click "Launch Render" to visualize the 3D node result.</p>
        <button className="btn btn-primary btn-sm mb-3" onClick={handleRender}>
        Launch Render
        </button>
        <div ref={mountRef} style={{ width: "100%", height: "400px" }}></div>
    </div>
    );
}
