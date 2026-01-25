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

/**
 * Install packages with Server-Sent Events (SSE) for real-time progress updates.
 * @param {Array} packages - Array of package specs [{name: "pkg", version: "1.2"}]
 * @param {string|null} envName - Environment name
 * @param {Function} onProgress - Callback function called for each progress event
 * @returns {Promise<Object>} Final installation result with installed and failed arrays
 */
export async function installPackagesWithProgress(packages, envName = null, onProgress = null) {
    console.log("Installing packages with progress:", packages, "in env:", envName);
    
    return new Promise((resolve, reject) => {
        const url = `${API_BASE_URL_MANAGER}/install/stream`;
        
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                packages: packages,
                env_name: envName,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let finalResult = {
                installed: [],
                failed: []
            };

            function processChunk() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        resolve(finalResult);
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                
                                // Call progress callback if provided
                                if (onProgress && typeof onProgress === "function") {
                                    onProgress(data);
                                }

                                // Update final result
                                if (data.type === "installation_complete") {
                                    finalResult = {
                                        installed: data.installed || [],
                                        failed: data.failed || []
                                    };
                                } else if (data.type === "package_complete") {
                                    // Track successful package installations
                                    if (!finalResult.installed.includes(data.package)) {
                                        finalResult.installed.push(data.package);
                                    }
                                } else if (data.type === "package_error") {
                                    // Track failed package installations
                                    const failedEntry = finalResult.failed.find(
                                        f => f.package === data.package
                                    );
                                    if (!failedEntry) {
                                        finalResult.failed.push({
                                            package: data.package,
                                            error: data.error || "Unknown error"
                                        });
                                    }
                                } else if (data.type === "error") {
                                    // Global error
                                    reject(new Error(data.message || "Installation failed"));
                                    return;
                                }
                            } catch (e) {
                                console.error("Error parsing SSE data:", e, line);
                            }
                        }
                    }

                    processChunk();
                }).catch(error => {
                    console.error("Error reading SSE stream:", error);
                    reject(error);
                });
            }

            processChunk();
        })
        .catch(error => {
            console.error("Error starting SSE connection:", error);
            reject(error);
        });
    });
}