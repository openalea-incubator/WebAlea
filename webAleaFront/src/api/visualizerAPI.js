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

export async function fetchNodeScene() {
    return fetchJSON(`${API_BASE_URL_VISUALIZER}/visualize`, "POST", {
        node_id: "123",
        visualization_data: {}
    });
}