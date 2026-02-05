/**
 * PackageService - Service layer for package management operations.
 *
 * All methods return consistent, validated data structures.
 * Handles API response parsing and error recovery gracefully.
 *
 * @module PackageService
 */

import {
    installPackages,
    fetchLatestPackageVersions,
} from "../api/managerAPI";

import {
    fetchInstalledOpenAleaPackages,
    fetchWraleaPackages,
    fetchPackageNodes
} from "../api/inspectorAPI";

// ============================================================================
// TYPE DEFINITIONS (JSDoc for IDE support)
// ============================================================================

/**
 * @typedef {Object} Package
 * @property {string} name - Package name (e.g., "openalea.plantgl")
 * @property {string} version - Package version (e.g., "3.0.0")
 */

/**
 * @typedef {Object} VisualPackage
 * @property {string} name - Package name
 * @property {string} module - Module path for wralea entry point
 */

/**
 * @typedef {Object} InstallResult
 * @property {boolean} success - Whether at least one package was installed
 * @property {string[]} installed - List of successfully installed packages
 * @property {Array<{package: string, error: string}>} failed - List of failed installations
 */

/**
 * @typedef {Object} NodePort
 * @property {string} id - Unique port identifier
 * @property {string} name - Port name
 * @property {string} interface - OpenAlea interface type (e.g., "IFloat", "IInt", "None")
 * @property {string} type - Frontend-compatible type (e.g., "float", "string", "boolean")
 * @property {boolean} optional - Whether the port is optional
 * @property {string} desc - Description
 * @property {*} [default] - Default value (optional)
 */

/**
 * @typedef {Object} PackageNode
 * @property {string} name - Node name
 * @property {string} description - Node description
 * @property {NodePort[]} inputs - Input ports
 * @property {NodePort[]} outputs - Output ports
 * @property {string|null} callable - Callable class path
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely extracts a string value with fallback.
 * @param {*} value - Value to extract
 * @param {string} fallback - Fallback value if extraction fails
 * @returns {string}
 */
function safeString(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

/**
 * Safely extracts an array with fallback.
 * @param {*} value - Value to extract
 * @returns {Array}
 */
function safeArray(value) {
    if (Array.isArray(value)) return value;
    return [];
}

/**
 * Maps OpenAlea interface name to frontend-compatible type.
 * Used as fallback if backend doesn't provide type.
 * @param {string} interfaceName - The interface name (e.g., "IFloat")
 * @returns {string} The frontend type (e.g., "float")
 */
function mapInterfaceToType(interfaceName) {
    const iface = (interfaceName || "").toLowerCase();
    if (iface.includes("float")) return "float";
    if (iface.includes("int")) return "float"; // Treated as numeric
    if (iface.includes("bool")) return "boolean";
    if (iface.includes("enum")) return "enum";
    if (iface.includes("sequence") || iface.includes("tuple")) return "array";
    if (iface.includes("dict")) return "object";
    if (iface.includes("str") || iface.includes("file") || iface.includes("dir")) return "string";
    if (iface === "none") return "any";
    return "any";
}

/**
 * Parses a node port from backend format.
 * Backend can return either object or string representation.
 * Now includes id and type fields from backend.
 * @param {Object|string} port - Port data from backend
 * @param {number} index - Index for fallback ID generation
 * @returns {NodePort}
 */
function parseNodePort(port, index = 0) {
    // Default structure
    const defaultPort = {
        id: `port_${index}`,
        name: "unknown",
        interface: "None",
        type: "any",
        optional: false,
        desc: ""
    };

    if (!port) return defaultPort;

    // If it's already an object with expected fields
    if (typeof port === "object" && port.name !== undefined) {
        const interfaceValue = safeString(port.interface, "None");
        const result = {
            id: safeString(port.id, `port_${index}_${port.name}`),
            name: safeString(port.name, "unknown"),
            interface: interfaceValue,
            type: safeString(port.type, mapInterfaceToType(interfaceValue)),
            optional: Boolean(port.optional),
            desc: safeString(port.desc || port.description, ""),
            default: port.default ?? null
        };
        // Include enum options if available
        if (port.enum_options && Array.isArray(port.enum_options)) {
            result.enumOptions = port.enum_options;
        }
        return result;
    }

    // If it's a string representation (e.g., "{'name': 'x', ...}")
    if (typeof port === "string") {
        try {
            // Try to parse as JSON-like string (replace single quotes)
            const cleanedStr = port.replace(/'/g, '"').replace(/None/g, 'null');
            const parsed = JSON.parse(cleanedStr);
            const interfaceValue = safeString(parsed.interface, "None");
            const result = {
                id: safeString(parsed.id, `port_${index}_${parsed.name}`),
                name: safeString(parsed.name, "unknown"),
                interface: interfaceValue,
                type: safeString(parsed.type, mapInterfaceToType(interfaceValue)),
                optional: Boolean(parsed.optional),
                desc: safeString(parsed.desc || parsed.description, ""),
                default: parsed.default ?? null
            };
            if (parsed.enum_options && Array.isArray(parsed.enum_options)) {
                result.enumOptions = parsed.enum_options;
            }
            return result;
        } catch {
            // Failed to parse, return default with the string as name
            return { ...defaultPort, name: port };
        }
    }

    return defaultPort;
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

/**
 * Fetches all available conda OpenAlea packages with their LATEST versions.
 * Uses the /latest endpoint which correctly determines the newest version.
 * Used for the installation panel.
 *
 * @returns {Promise<Package[]>} Array of packages with name and latest version
 *
 * @example
 * const packages = await getPackagesList();
 * // Returns: [{name: "openalea.plantgl", version: "3.22.3"}, ...]
 */
export async function getPackagesList() {
    try {
        // Use /latest endpoint - backend correctly picks newest version
        const response = await fetchLatestPackageVersions();

        // Validate response is an object
        if (!response || typeof response !== "object") {
            console.warn("getPackagesList: Invalid response format", response);
            return [];
        }

        // Transform: {pkgName: {version: "x", ...}, ...} → [{name, version}, ...]
        // Note: /latest returns single object per package, not array
        const packages = Object.entries(response)
            .map(([name, pkgInfo]) => {
                return {
                    name: safeString(name),
                    version: safeString(pkgInfo?.version, "unknown")
                };
            })
            .filter(pkg => pkg.name); // Remove entries with empty names

        return packages;

    } catch (error) {
        console.error("getPackagesList: Error fetching packages:", error);
        return [];
    }
}

/**
 * Fetches only packages that have visual nodes (wralea entry points).
 * These are the packages usable in the visual workflow editor.
 *
 * @returns {Promise<VisualPackage[]>} Array of visual packages
 *
 * @example
 * const visualPkgs = await getVisualPackagesList();
 * // Returns: [{name: "openalea.plantgl", module: "openalea.plantgl_wralea"}, ...]
 */
export async function getVisualPackagesList() {
    try {
        const response = await fetchWraleaPackages();

        // Backend returns: {wralea_packages: [{name: "...", module: "..."}, ...]}
        const wraleaPackages = safeArray(response?.wralea_packages);

        return wraleaPackages
            .map(pkg => ({
                name: safeString(pkg?.name),
                module: safeString(pkg?.module)
            }))
            .filter(pkg => pkg.name); // Remove entries with empty names

    } catch (error) {
        console.error("getVisualPackagesList: Error fetching visual packages:", error);
        return [];
    }
}

/**
 * Checks if a package is currently installed in the OpenAlea environment.
 *
 * @param {string} packageName - Name of the package to check
 * @returns {Promise<boolean>} True if package is installed
 *
 * @example
 * const isInstalled = await isInstalledPackage("openalea.plantgl");
 * // Returns: true or false
 */
export async function isInstalledPackage(packageName) {
    try {
        if (!packageName || typeof packageName !== "string") {
            console.warn("isInstalledPackage: Invalid package name", packageName);
            return false;
        }

        const response = await fetchInstalledOpenAleaPackages();

        // Backend returns: {installed_openalea_packages: [...]}
        const installedList = safeArray(response?.installed_openalea_packages);

        // Check exact match or with/without "openalea." prefix
        const normalizedName = packageName.toLowerCase();
        return installedList.some(pkg => {
            const pkgLower = safeString(pkg).toLowerCase();
            return pkgLower === normalizedName ||
                   pkgLower === `openalea.${normalizedName}` ||
                   `openalea.${pkgLower}` === normalizedName;
        });

    } catch (error) {
        console.error("isInstalledPackage: Error checking installation:", error);
        return false;
    }
}

/**
 * Installs a package into the conda environment.
 *
 * @param {Object} pkg - Package to install
 * @param {string} pkg.name - Package name
 * @param {string} [pkg.version] - Optional specific version
 * @returns {Promise<InstallResult>} Installation result
 *
 * @example
 * const result = await installPackage({name: "openalea.plantgl", version: "3.0.0"});
 * // Returns: {success: true, installed: ["openalea.plantgl"], failed: []}
 */
export async function installPackage(pkg) {
    // Default result for error cases
    const defaultResult = {
        success: false,
        installed: [],
        failed: []
    };

    try {
        if (!pkg?.name) {
            console.warn("installPackage: Invalid package specification", pkg);
            return { ...defaultResult, failed: [{ package: "unknown", error: "Invalid package specification" }] };
        }

        const response = await installPackages([{
            name: pkg.name,
            version: pkg.version || null
        }]);

        // Backend returns: {installed: [...], failed: [...]}
        const installed = safeArray(response?.installed);
        const failed = safeArray(response?.failed).map(f => ({
            package: safeString(f?.package || f?.name, pkg.name),
            error: safeString(f?.error || f?.message, "Unknown error")
        }));

        return {
            success: installed.length > 0,
            installed: installed.map(p => safeString(p)),
            failed
        };

    } catch (error) {
        console.error("installPackage: Error installing package:", error);
        return {
            ...defaultResult,
            failed: [{ package: pkg?.name || "unknown", error: error.message || "Installation failed" }]
        };
    }
}

/**
 * Fetches all nodes from a package.
 * Automatically installs the package if not already installed.
 *
 * @param {Object} pkg - Package to get nodes from
 * @param {string} pkg.name - Package name
 * @param {string} [pkg.version] - Optional version
 * @returns {Promise<PackageNode[]>} Array of nodes in the package
 *
 * @example
 * const nodes = await getNodesList({name: "openalea.plantgl"});
 * // Returns: [{name: "Sphere", description: "...", inputs: [...], outputs: [...]}, ...]
 */
export async function getNodesList(pkg) {
    try {
        if (!pkg?.name) {
            console.warn("getNodesList: Invalid package specification", pkg);
            return [];
        }

        // Check if package is installed, install if needed
        const isInstalled = await isInstalledPackage(pkg.name);
        if (!isInstalled) {
            console.log(`getNodesList: Package "${pkg.name}" not installed. Installing...`);
            const installResult = await installPackage(pkg);
            if (!installResult.success) {
                console.error(`getNodesList: Failed to install package "${pkg.name}"`, installResult.failed);
                return [];
            }
        }

        // Fetch nodes from backend
        const response = await fetchPackageNodes(pkg.name);

        // Backend returns: {package_name: "...", nodes: {nodeName: {...}}, has_wralea: bool}
        if (!response || typeof response !== "object") {
            console.warn("getNodesList: Invalid response format", response);
            return [];
        }

        // Check if package has visual nodes
        if (response.has_wralea === false) {
            console.info(`getNodesList: Package "${pkg.name}" has no visual nodes`);
            return [];
        }

        // Transform nodes object to array
        const nodesObj = response.nodes || {};
        const nodes = Object.entries(nodesObj).map(([nodeName, nodeData]) => {
            // Parse inputs and outputs with index for ID generation
            const inputs = safeArray(nodeData?.inputs).map((port, idx) => parseNodePort(port, idx));
            const outputs = safeArray(nodeData?.outputs).map((port, idx) => parseNodePort(port, idx));

            return {
                name: safeString(nodeName),
                description: safeString(nodeData?.description),
                inputs,
                outputs,
                callable: nodeData?.callable ?? null
            };
        });

        return nodes;

    } catch (error) {
        console.error(`getNodesList: Error fetching nodes for "${pkg?.name}":`, error);
        return [];
    }
}

/**
 * Fetches the list of currently installed OpenAlea packages.
 *
 * @returns {Promise<string[]>} Array of installed package names
 *
 * @example
 * const installed = await getInstalledPackagesList();
 * // Returns: ["openalea.core", "openalea.plantgl", ...]
 */
export async function getInstalledPackagesList() {
    try {
        const response = await fetchInstalledOpenAleaPackages();
        return safeArray(response?.installed_openalea_packages).map(p => safeString(p));
    } catch (error) {
        console.error("getInstalledPackagesList: Error fetching installed packages:", error);
        return [];
    }
}
