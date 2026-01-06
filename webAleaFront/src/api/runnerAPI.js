// runnerAPI.js
import { fetchJSON } from "./utils.js";


const BASE_URL = "http://localhost:8000/api/v1/runner";



// ===============================
// NODE EXECUTION - OpenAlea
// ===============================
/**
 * Execute a single OpenAlea node with given inputs
 * @param {Object} nodeData - Node execution data
 * @param {string} nodeData.nodeId - Unique node identifier
 * @param {string} nodeData.packageName - OpenAlea package name
 * @param {string} nodeData.nodeName - Node name within the package
 * @param {Array} nodeData.inputs - Array of input objects {id, name, type, value}
 * @returns {Promise<Object>} Execution result
 */
export async function executeNode(nodeData) {
    const { nodeId, packageName, nodeName, inputs } = nodeData;

    return fetchJSON(`${BASE_URL}/execute/node`, "POST", {
        node_id: nodeId,
        package_name: packageName,
        node_name: nodeName,
        inputs: inputs.map(input => ({
            id: input.id,
            name: input.name,
            type: input.type,
            value: input.value
        }))
    });
}
