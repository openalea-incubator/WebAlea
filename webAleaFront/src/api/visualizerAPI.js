import { fetchJSON } from "./utils.js";
import { API_BASE_URL_VISUALIZER } from "../config/api";
import { debugLog } from "../features/visualizer/utils/debug";

// ===============================
// VISUALIZER API
// ===============================

/**
 * Fetch a serialized PlantGL scene from the backend
 * @param {Object} visualizerData - Data required for visualization
 * @returns {Promise<Object>} Serialized scene data
 **/

export async function fetchNodeScene({ nodeId = "123", visualizationData = {} } = {}) {
    return fetchJSON(`${API_BASE_URL_VISUALIZER}/visualize`, "POST", {
        node_id: nodeId,
        visualization_data: visualizationData
    });
}
