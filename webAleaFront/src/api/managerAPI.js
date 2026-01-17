// managerAPI.js
import { API_BASE_URL } from "../config/api";
// ==============================
// LISTE DES PACKAGES
// ==============================
/**
 * 
 * @returns {Promise<Object>}
 */
export async function fetchPackageList() {
    return fetchJSON(`${API_BASE_URL}/`);
}

/**
 * 
 * @returns {Promise<Object>}
 */
export async function fetchLatestPackageVersions() {
    return fetchJSON(`${API_BASE_URL}/latest`);
}

// ===============================
// INSTALLATION DES PACKAGES
// ===============================

/**
 * 
 * @param {Array} packages 
 * @param {string|null} envName 
 * @returns {Promise<Object>}
 */
export async function installPackages(packages, envName = null) {
    console.log("Installing packages:", packages, "in env:", envName);
    return fetchJSON(`${API_BASE_URL}/install`, "POST", {
        packages: packages,   // [{name: "pkg", version: "1.2"}]
        env_name: envName,
    });
}

// ===============================
// OPENALEA PACKAGES INSTALLÉS
// ===============================
/**
 *
 * @returns {Promise<Object>}
 */
export async function fetchInstalledOpenAleaPackages() {
    return fetchJSON(`${API_BASE_URL}/installed`);
}

/**
 * Fetch packages that have visual nodes (wralea entry points).
 * Only installed packages can be checked for wralea.
 * @returns {Promise<Object>}
 */
export async function fetchWraleaPackages() {
    return fetchJSON(`${API_BASE_URL}/wralea`);
}

/**
 * 
 * @param {String} packageName 
 * @returns {Promise<Object>}
 */
export async function fetchPackageNodes(packageName) {
    return fetchJSON(`${API_BASE_URL}/installed/${packageName}`);   
}

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

    return fetchJSON(`${API_BASE_URL}/execute/node`, "POST", {
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

// ===============================
// WRAPPER UTILITAIRE
// ===============================
async function fetchJSON(url, method = "GET", body = null) {
    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null,
        });

        if (!res.ok) {
            throw new Error(`Erreur API : HTTP ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error("Erreur fetchJSON:", err);
        throw err;
    }
}
