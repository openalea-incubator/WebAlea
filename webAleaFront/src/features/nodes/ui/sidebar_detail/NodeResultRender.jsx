import { useRef } from "react";
import { fetchNodeScene } from "../../../../api/visualizerAPI";
import { buildSceneFromJSON } from "../../../visualizer/SceneBuilder";

export default function NodeResultRender() {
    const mountRef = useRef(null);
    const sceneRef = useRef(null); 

    const handleRender = async () => {
        const sceneData = await fetchNodeScene();
        if (!sceneData) {
            alert("Failed to fetch scene data.");
            return;
        }

        const { scene, camera, renderer, objects, dispose } = buildSceneFromJSON(sceneData, mountRef);
        sceneRef.current = { scene, camera, renderer, objects, dispose };
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
