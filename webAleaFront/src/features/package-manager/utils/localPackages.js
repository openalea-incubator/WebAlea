/**
 * Storage key for local composite packages.
 * @type {string}
 */
const LOCAL_PACKAGES_KEY = "localCompositePackages";

/**
 * Load locally stored composite packages.
 * @returns {Array<{name: string, nodes: Array}>}
 */
export function loadLocalPackages() {
    try {
        const raw = localStorage.getItem(LOCAL_PACKAGES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("loadLocalPackages: Failed to parse local packages", error);
        return [];
    }
}

/**
 * Save or merge a local package entry.
 * Merges by package name and deduplicates composite nodes by name.
 * @param {{name: string, nodes: Array}} pkg
 */
export function saveLocalPackage(pkg) {
    if (!pkg || !pkg.name || !Array.isArray(pkg.nodes)) {
        console.warn("saveLocalPackage: Invalid package data", pkg);
        return;
    }

    const existing = loadLocalPackages();
    const next = [];
    let merged = false;

    for (const item of existing) {
        if (item?.name === pkg.name) {
            const existingNodes = Array.isArray(item.nodes) ? item.nodes : [];
            const newNodes = pkg.nodes.filter(n => !existingNodes.some(en => en.name === n.name));
            next.push({ ...item, nodes: [...existingNodes, ...newNodes] });
            merged = true;
        } else {
            next.push(item);
        }
    }

    if (!merged) {
        next.push(pkg);
    }

    try {
        localStorage.setItem(LOCAL_PACKAGES_KEY, JSON.stringify(next));
    } catch (error) {
        console.warn("saveLocalPackage: Failed to persist local packages", error);
    }
}

/**
 * Clear all local packages from storage.
 */
export function clearLocalPackages() {
    try {
        localStorage.removeItem(LOCAL_PACKAGES_KEY);
    } catch (error) {
        console.warn("clearLocalPackages: Failed to clear local packages", error);
    }
}

/**
 * Remove a local package by name.
 * @param {string} packageName
 */
export function removeLocalPackage(packageName) {
    if (!packageName) return;
    const existing = loadLocalPackages();
    const next = existing.filter(item => item?.name !== packageName);
    try {
        localStorage.setItem(LOCAL_PACKAGES_KEY, JSON.stringify(next));
    } catch (error) {
        console.warn("removeLocalPackage: Failed to persist local packages", error);
    }
}

/**
 * Remove a single composite node from a local package.
 * Automatically removes the package if it becomes empty.
 * @param {string} packageName
 * @param {string} nodeName
 */
export function removeLocalComposite(packageName, nodeName) {
    if (!packageName || !nodeName) return;
    const existing = loadLocalPackages();
    const next = existing.map(item => {
        if (item?.name !== packageName) return item;
        const nodes = Array.isArray(item.nodes) ? item.nodes : [];
        return {
            ...item,
            nodes: nodes.filter(node => node?.name !== nodeName)
        };
    }).filter(item => Array.isArray(item.nodes) && item.nodes.length > 0);
    try {
        localStorage.setItem(LOCAL_PACKAGES_KEY, JSON.stringify(next));
    } catch (error) {
        console.warn("removeLocalComposite: Failed to persist local packages", error);
    }
}
