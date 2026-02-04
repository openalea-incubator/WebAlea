const LOCAL_PACKAGES_KEY = "localCompositePackages";

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

export function clearLocalPackages() {
    try {
        localStorage.removeItem(LOCAL_PACKAGES_KEY);
    } catch (error) {
        console.warn("clearLocalPackages: Failed to clear local packages", error);
    }
}

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
