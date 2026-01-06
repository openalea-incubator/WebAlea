// managerAPI.js
import { fetchJSON } from "./utils.js";


const BASE_URL = "http://localhost:8000/api/v1/manager";

// ==============================
// LISTE DES PACKAGES
// ==============================
/**
 * 
 * @returns {Promise<Object>}
 */
export async function fetchPackageList() {
    return fetchJSON(`${BASE_URL}/`);
}

/**
 * 
 * @returns {Promise<Object>}
 */
export async function fetchLatestPackageVersions() {
    return fetchJSON(`${BASE_URL}/latest`);
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
    return fetchJSON(`${BASE_URL}/install`, "POST", {
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
    return fetchJSON(`${BASE_URL}/installed`);
}

/**
 * Fetch packages that have visual nodes (wralea entry points).
 * Only installed packages can be checked for wralea.
 * @returns {Promise<Object>}
 */
export async function fetchWraleaPackages() {
    return fetchJSON(`${BASE_URL}/wralea`);
}

/**
 * 
 * @param {String} packageName 
 * @returns {Promise<Object>}
 */
export async function fetchPackageNodes(packageName) {
    return fetchJSON(`${BASE_URL}/installed/${packageName}`);   
}
