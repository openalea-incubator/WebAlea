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
