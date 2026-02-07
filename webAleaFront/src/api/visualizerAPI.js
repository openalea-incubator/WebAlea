// visualizerAPI.js
import { fetchJSON } from "./utils.js";
import { API_BASE_URL_VISUALIZER } from "../config/api";

// ===============================
// VISUALIZER API
// ===============================

/**
 * Fetch a serialized PlantGL scene from the backend
 * @param {Object} visualizerData - Data required for visualization
 * @returns {Promise<Object>} Serialized scene data
 **/

export async function fetchNodeScene({ nodeId = "123", visualizationData = {} } = {}) {
    const outputs = Array.isArray(visualizationData?.outputs) ? visualizationData.outputs : [];
    console.log("[visualizerAPI] POST /visualize", {
        nodeId,
        payloadKeys: Object.keys(visualizationData || {}),
        outputCount: outputs.length,
        hasSceneRef: Boolean(visualizationData?.scene_ref)
    });
    return fetchJSON(`${API_BASE_URL_VISUALIZER}/visualize`, "POST", {
        node_id: nodeId,
        visualization_data: visualizationData
    });
}

