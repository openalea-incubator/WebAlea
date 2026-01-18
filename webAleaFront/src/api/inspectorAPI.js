// inspectorAPI.js
import { fetchJSON } from "./utils.js";
import { API_BASE_URL } from "../config/api";


// ===============================
// OPENALEA PACKAGES INSTALLÉS
// ===============================
/**
 * Fetch the list of all installed OpenAlea packages.
 * @returns {Promise<Object>}
 */
export async function fetchInstalledOpenAleaPackages() {
    return fetchJSON(`${API_BASE_URL}/installed`);
}

/**
 * Fetch the list of packages that have visual nodes (wralea entry points).
 * Only installed packages can be checked for wralea.
 * @returns {Promise<Object>}
 */
export async function fetchWraleaPackages() {
    return fetchJSON(`${API_BASE_URL}/wralea`);
}

/**
 * Fetch the list of nodes for a given package.
 * @param {string} packageName - The name of the package to fetch nodes for.
 * @returns {Promise<Object>} - The list of nodes for the given package.
 */
export async function fetchPackageNodes(packageName) {
    return fetchJSON(`${API_BASE_URL}/installed/${packageName}`);   
}
