// managerAPI.js
import { API_BASE_URL_MANAGER } from "../config/api";
import { fetchJSON } from "./utils.js";

// ==============================
// PACKAGE LIST
// ==============================
/**
 * Fetch the list of all conda packages.
 * @returns {Promise<Object>}
 */
export async function fetchPackageList() {
    return fetchJSON(`${API_BASE_URL_MANAGER}/`);
}

/**
 * Fetch the latest versions of all conda packages.
 * @returns {Promise<Object>}
 */
export async function fetchLatestPackageVersions() {
    return fetchJSON(`${API_BASE_URL_MANAGER}/latest`);
}

// ===============================
// PACKAGE INSTALLATION
// ===============================

/**
 * Install packages in the conda environment.
 * @param {Array} packages 
 * @param {string|null} envName 
 * @returns {Promise<Object>}
 */
export async function installPackages(packages, envName = null) {
    console.log("Installing packages:", packages, "in env:", envName);
    return fetchJSON(`${API_BASE_URL_MANAGER}/install`, "POST", {
        packages: packages,   // [{name: "pkg", version: "1.2"}]
        env_name: envName,
    });
}
