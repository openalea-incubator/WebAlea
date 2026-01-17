// inspectorAPI.js
import { fetchJSON } from "./utils.js";


const BASE_URL = "http://localhost:8000/api/v1/inspector";



// ===============================
// OPENALEA PACKAGES INSTALLÉS
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
