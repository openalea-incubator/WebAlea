/**
 * packageTreeBuilder.js
 * 
 * Utility functions for building hierarchical tree structures from flat package lists.
 * Organizes packages by their namespace (e.g., "openalea.numpy.creation" → openalea/numpy/creation).
 */

/**
 * Builds a hierarchical tree structure from a flat list of packages.
 * Packages with dots in their names are organized into folders recursively.
 * 
 * @param {Array<{name: string, [key: string]: any}>} packages - Flat list of packages
 * @returns {Array} Tree structure compatible with MUI TreeView
 * 
 * @example
 * Input: [
 *   {name: "openalea.numpy.creation", module: "..."},
 *   {name: "openalea.numpy.demo", module: "..."},
 *   {name: "openalea.color", module: "..."},
 *   {name: "oalab", module: "..."}
 * ]
 * 
 * Output: [
 *   {
 *     id: "namespace:openalea",
 *     label: "openalea",
 *     children: [
 *       {
 *         id: "namespace:openalea.numpy",
 *         label: "numpy",
 *         children: [
 *           {id: "openalea.numpy.creation", label: "creation", ...},
 *           {id: "openalea.numpy.demo", label: "demo", ...}
 *         ]
 *       },
 *       {id: "openalea.color", label: "color", ...}
 *     ]
 *   },
 *   {id: "oalab", label: "oalab", ...}
 * ]
 */
export function buildPackageTree(packages) {
    if (!Array.isArray(packages) || packages.length === 0) {
        return [];
    }

    // Root of the tree
    const root = {
        id: '__root__',
        children: []
    };

    packages.forEach(pkg => {
        if (!pkg.name) return;

        const parts = pkg.name.split('.');
        let currentNode = root;

        // Navigate/create the tree path for this package
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLeaf = i === parts.length - 1;
            const pathSoFar = parts.slice(0, i + 1).join('.');

            if (isLeaf) {
                // This is the actual package (leaf node)
                currentNode.children.push({
                    id: pkg.name,
                    label: part,
                    fullName: pkg.name,
                    ...extractPackageData(pkg),
                    children: []
                });
            } else {
                // This is a namespace folder (intermediate node)
                let namespaceNode = currentNode.children.find(
                    child => child.id === `namespace:${pathSoFar}`
                );

                if (!namespaceNode) {
                    namespaceNode = {
                        id: `namespace:${pathSoFar}`,
                        label: part,
                        children: [],
                        isNamespace: true
                    };
                    currentNode.children.push(namespaceNode);
                }

                currentNode = namespaceNode;
            }
        }
    });

    // Sort recursively
    sortTreeNodes(root.children);

    return root.children;
}

/**
 * Recursively sort tree nodes: namespaces first, then packages, alphabetically
 * @param {Array} nodes - Array of tree nodes to sort
 */
function sortTreeNodes(nodes) {
    nodes.sort((a, b) => {
        // Namespaces come before packages
        if (a.isNamespace && !b.isNamespace) return -1;
        if (!a.isNamespace && b.isNamespace) return 1;
        // Alphabetical order
        return a.label.localeCompare(b.label);
    });

    // Recursively sort children
    nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
            sortTreeNodes(node.children);
        }
    });
}

/**
 * Extracts package data (excluding name) to preserve all properties
 * @param {Object} pkg - Package object
 * @returns {Object} Package data without name
 */
function extractPackageData(pkg) {
    const { name, ...rest } = pkg;
    return rest;
}

/**
 * Finds a package in the tree by its full name
 * @param {Array} tree - Tree structure
 * @param {string} fullName - Full package name (e.g., "openalea.numpy.creation")
 * @returns {Object|null} Package node or null if not found
 */
export function findPackageInTree(tree, fullName) {
    for (const item of tree) {
        if (item.id === fullName || item.fullName === fullName) {
            return item;
        }
        if (item.children) {
            const found = findPackageInTree(item.children, fullName);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Gets the full package name from a tree node
 * @param {Object} node - Tree node
 * @returns {string} Full package name
 */
export function getFullPackageName(node) {
    // If node has fullName, use it (for actual packages)
    if (node.fullName) {
        return node.fullName;
    }
    // For namespace nodes, strip the prefix
    if (node.isNamespace && node.id.startsWith('namespace:')) {
        return node.id.replace('namespace:', '');
    }
    // Otherwise, use the id (for root-level packages)
    return node.id;
}