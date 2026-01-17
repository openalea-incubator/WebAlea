// managerAPI.js
import { fetchJSON } from "./utils.js";


const BASE_URL = "http://localhost:8000/api/v1/manager";

// ==============================
// PACKAGE LIST
// ==============================
/**
 * Fetch the list of all conda packages.
 * @returns {Promise<Object>}
 */
export async function fetchPackageList() {
    return fetchJSON(`${BASE_URL}/`);
}

/**
 * Fetch the latest versions of all conda packages.
 * @returns {Promise<Object>}
 */
export async function fetchLatestPackageVersions() {
    return fetchJSON(`${BASE_URL}/latest`);
}

// ===============================
// INSTALLATION DES PACKAGES
// ===============================

/**
 * Install packages in the conda environment.
 * @param {Array} packages 
 * @param {string|null} envName 
 * @returns {Promise<Object>}
 */
export async function installPackages(packages, envName = null) {
    console.log("Installing packages:", packages, "in env:", envName);
    return fetchJSON(`${BASE_URL}/install`, "POST", {
        packages: packages,   // [{name: "pkg", version: "1.2"}]
        env_name: envName,
    });
}

// ===============================
// INSTALLED OPENALEA PACKAGES
// ===============================
/**
 * Fetch the list of all installed OpenAlea packages.
 * @returns {Promise<Object>}
 */
export async function fetchInstalledOpenAleaPackages() {
    return fetchJSON(`${BASE_URL}/installed`);
}

/**
 * Fetch the list of packages that have visual nodes (wralea entry points).
 * Only installed packages can be checked for wralea.
 * @returns {Promise<Object>}
 */
export async function fetchWraleaPackages() {
    return fetchJSON(`${BASE_URL}/wralea`);
}

/**
 * Fetch the list of nodes for a given package.
 * @param {string} packageName - The name of the package to fetch nodes for.
 * @returns {Promise<Object>} - The list of nodes for the given package.
 */
export async function fetchPackageNodes(packageName) {
    return fetchJSON(`${BASE_URL}/installed/${packageName}`);   
}

// ===============================
// NODE EXECUTION
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

// ===============================
// UTILITY FUNCTIONS
// ===============================
/**
 * Fetch data from the API and return it as JSON.
 * @param {string} url - The URL to fetch from.
 * @param {string} method - The HTTP method to use (GET, POST, etc.).
 * @param {Object} body - The body of the request (JSON object).
 * @returns {Promise<Object>} - The JSON data from the API.
 */
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
