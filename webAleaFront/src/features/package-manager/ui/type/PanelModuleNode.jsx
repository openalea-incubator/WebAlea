import { useEffect, useCallback, useRef } from 'react';
import { RichTreeView } from '@mui/x-tree-view';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { FiPackage, FiLoader } from 'react-icons/fi';
import { FaTrash, FaProjectDiagram } from 'react-icons/fa';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { getVisualPackagesList, getNodesList } from '../../../../service/PackageService.js';
import { buildPackageTree, getFullPackageName } from '../../utils/packageTreeBuilder.js';
import { loadLocalPackages, removeLocalComposite, removeLocalPackage } from '../../utils/localPackages.js';

/**
 * Panel displaying visual OpenAlea packages and their nodes.
 * Uses lazy loading - nodes are fetched when a package is expanded.
 */
export default function PanelModuleNode({ onAddNode, version, treeItems, setTreeItems, loading, setLoading, loadingPackage, setLoadingPackage, loadedPackages, setLoadedPackages, expandedItems, setExpandedItems }) {
    // Ref to access current tree items map in callbacks
    const itemMetaRef = useRef(new Map());

    useEffect(() => {
        const map = new Map();
        const visit = (items) => {
            items.forEach(item => {
                map.set(item.id, item);
                if (item.children) visit(item.children);
            });
        };
        if (Array.isArray(treeItems)) {
            visit(treeItems);
        }
        itemMetaRef.current = map;
    }, [treeItems]);

    /**
     * Resolve a tree item by its id from the current tree map.
     * @param {string} itemId
     * @returns {object|null}
     */
    const getItemById = useCallback((itemId) => {
        return itemMetaRef.current.get(itemId) || null;
    }, []);


    /**
     * Build tree items for locally stored composites.
     * @param {Array} localPackages
     * @returns {Array}
     */
    const buildLocalPackageItems = useCallback((localPackages) => {
        if (!Array.isArray(localPackages) || localPackages.length === 0) return [];
        return localPackages.map(pkg => {
            const pkgId = `local:${pkg.name}`;
            const nodeItems = (pkg.nodes || []).map(node => {
                const nodeId = `${pkgId}::${node.name}`;
                return {
                    id: nodeId,
                    label: node.name,
                    rawName: node.name,
                    description: node.description || "",
                    inputs: node.inputs || [],
                    outputs: node.outputs || [],
                    callable: node.callable ?? null,
                    nodekind: node.nodekind || "atomic",
                    graph: node.graph ?? null,
                    packageName: null,
                    metadata: { localPackage: pkg.name },
                    isNode: true,
                    isLocalNode: true,
                    isLocalPackage: true
                };
            });

            return {
                id: pkgId,
                label: pkg.name,
                children: nodeItems,
                isLocalPackage: true
            };
        });
    }, []);

    /**
     * Fetch visual packages and rebuild tree structure.
     */
    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            const visualPackages = await getVisualPackagesList();

            // Build hierarchical tree structure
            const treeStructure = buildPackageTree(visualPackages);

            const localPackages = loadLocalPackages();
            const localItems = buildLocalPackageItems(localPackages);

            // Wrap in root nodes for TreeView
            const items = [
                {
                    id: 'root',
                    label: 'OpenAlea Packages',
                    children: treeStructure
                },
                {
                    id: 'local-root',
                    label: 'Local Packages',
                    children: localItems
                }
            ];

            setTreeItems(items);

            // Auto-expand root and all namespace folders
            const namespaceIds = ['root', 'local-root'];
            treeStructure.forEach(item => {
                if (item.isNamespace) {
                    namespaceIds.push(item.id);
                }
            });
            setExpandedItems(prev => [...new Set([...prev, ...namespaceIds])]);
        } catch (error) {
            console.error("Error fetching visual packages:", error);
        } finally {
            setLoading(false);
        }
    }, [buildLocalPackageItems, setExpandedItems, setLoading, setTreeItems]);

    /**
     * Use effect to fetch the visual packages.
     */
    useEffect(() => {
        if (treeItems.length > 0) {
            return;
        }
        fetchPackages();
    }, [version, fetchPackages, treeItems.length]);

    useEffect(() => {
        const handleLocalPackagesUpdate = () => {
            setLoadedPackages(new Set());
            setLoadingPackage(null);
            fetchPackages();
        };

        window.addEventListener("local-packages-updated", handleLocalPackagesUpdate);
        return () => window.removeEventListener("local-packages-updated", handleLocalPackagesUpdate);
    }, [fetchPackages, setLoadedPackages, setLoadingPackage]);

    /**
     * Lazy-load nodes for a package and inject them into the tree.
     * @param {string} packageId
     */
    const loadPackageNodes = useCallback(async (packageId) => {
        const packageNode = getItemById(packageId);
        if (packageNode?.isLocalPackage) {
            return;
        }
        const fullPackageName = packageNode ? getFullPackageName(packageNode) : packageId;
        const installName = packageNode?.installName || packageNode?.distName || fullPackageName;

        // Check if already loaded or loading
        if (loadedPackages.has(fullPackageName) || loadingPackage === fullPackageName) {
            return;
        }

        setLoadingPackage(fullPackageName);

        try {
            const packageNodes = await getNodesList({
                name: fullPackageName,
                packageName: fullPackageName,
                installName,
            });

            const nodeItems = packageNodes.map(node => ({
                id: `${fullPackageName}::${node.name}`,
                label: node.name,
                description: node.description || "",
                inputs: node.inputs || [],
                outputs: node.outputs || [],
                callable: node.callable,
                nodekind: node.nodekind || "atomic",
                graph: node.graph ?? null,
                packageName: fullPackageName,
                isNode: true,
            }));

            // Recursive function to update tree items
            const updateTreeItems = (items) => {
                return items.map(item => {
                    if (item.id === packageId) {
                        return { ...item, children: nodeItems };
                    }
                    if (item.children && item.children.length > 0) {
                        return { ...item, children: updateTreeItems(item.children) };
                    }
                    return item;
                });
            };

            setTreeItems(prevItems => {
                return prevItems.map(root => ({
                    ...root,
                    children: updateTreeItems(root.children)
                }));
            });

            setLoadedPackages(prev => new Set([...prev, fullPackageName]));

        } catch (error) {
            console.error(`Error loading nodes for ${fullPackageName}:`, error);
        } finally {
            setLoadingPackage(null);
        }
    }, [getItemById, loadedPackages, loadingPackage, setLoadedPackages, setLoadingPackage, setTreeItems]);

    const handleItemClick = useCallback(async (_event, itemId) => {
        const clickedItem = getItemById(itemId);
        if (!clickedItem) return;

        if (clickedItem.isNode && onAddNode) {
            onAddNode(clickedItem);
            return;
        }

        // Only load nodes for actual packages (not namespace folders)
        if (clickedItem.children !== undefined && !clickedItem.isNode && itemId !== 'root' && itemId !== 'local-root' && !clickedItem.isNamespace && !clickedItem.isLocalPackage) {
            const fullPackageName = getFullPackageName(clickedItem);
            if (!loadedPackages.has(fullPackageName)) {
                await loadPackageNodes(itemId);
            }
        }
    }, [getItemById, onAddNode, loadedPackages, loadPackageNodes]);

    /**
     * Delete a local package or composite node.
     * @param {object} item
     */
    const handleDeleteItem = useCallback((item) => {
        if (!item) return;
        if (item.isNode && item.metadata?.localPackage) {
            removeLocalComposite(item.metadata.localPackage, item.rawName || item.label);
        } else if (item.isLocalPackage && !item.isNode) {
            removeLocalPackage(item.label);
        }
        window.dispatchEvent(new Event("local-packages-updated"));
    }, []);

    /**
     * Custom TreeItem renderer with composite icon and delete action.
     */
    const CustomTreeItem = useCallback((props) => {
        const { itemId, label, children, ...other } = props;
        const item = itemMetaRef.current.get(itemId);
        const isComposite = item?.nodekind === "composite";
        const canDelete = item?.isLocalPackage && (item?.isLocalNode || !item?.isNode);

        return (
            <TreeItem
                {...other}
                itemId={itemId}
                label={
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                        {isComposite && (
                            <FaProjectDiagram style={{ fontSize: "0.85rem", color: "#5c6bc0" }} />
                        )}
                        <span>{label}</span>
                        {canDelete && (
                            <button
                                type="button"
                                title="Supprimer"
                                aria-label="Supprimer"
                                className="btn btn-sm btn-outline-danger"
                                style={{ marginLeft: "auto", padding: "2px 6px", lineHeight: 1 }}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleDeleteItem(item);
                                }}
                            >
                                <FaTrash style={{ fontSize: "0.85rem", border: "none" }} />
                            </button>
                        )}
                    </div>
                }
            >
                {children}
            </TreeItem>
        );
    }, [handleDeleteItem]);


    const handleItemExpansionToggle = useCallback(async (_event, itemId, isExpanded) => {
        if (isExpanded && itemId !== 'root' && itemId !== 'local-root' && !loadedPackages.has(itemId)) {
            const item = getItemById(itemId);
            // Only load nodes for actual packages (not namespace folders or root)
            if (item && !item.isNode && !item.isNamespace && !item.isLocalPackage && itemId !== 'root' && itemId !== 'local-root') {
                await loadPackageNodes(itemId);
            }
        }
    }, [getItemById, loadedPackages, loadPackageNodes]);

    // Loading state
    if (loading) {
        return (
            <div className="panel-container">
                <div className="panel-loading">
                    <FiLoader className="loading-pulse" style={{ fontSize: '1.5rem' }} />
                    <span className="panel-loading-text">Loading packages...</span>
                </div>
            </div>
        );
    }

    // Check if there are any packages (recursively check children)
    const hasAnyPackages = (items) => {
        if (!items || items.length === 0) return false;
        return items.some(item => {
            // If it's a namespace folder, check its children
            if (item.isNamespace && item.children) {
                return hasAnyPackages(item.children);
            }
            // If it's a package (not a namespace), it counts
            return !item.isNamespace;
        });
    };

    const hasPackages = treeItems.length > 0 &&
        (hasAnyPackages(treeItems[0]?.children) || hasAnyPackages(treeItems[1]?.children));

    // Empty state
    if (!hasPackages) {
        return (
            <div className="panel-container">
                <div className="panel-empty">
                    <FiPackage className="panel-empty-icon" />
                    <div className="panel-empty-title">No visual packages installed</div>
                    <div className="panel-empty-subtitle">
                        Install OpenAlea packages with visual nodes from the Install tab
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="panel-container">
            {/* Loading indicator for specific package */}
            {loadingPackage && (
                <div className="loading-package-bar">
                    <FiLoader className="loading-pulse" />
                    <span>Loading {loadingPackage}...</span>
                </div>
            )}

            {/* Tree View */}
            <div className="panel-scrollable">
                <div className="tree-container">
                    <RichTreeView
                        items={treeItems}
                        expandedItems={expandedItems}
                        onExpandedItemsChange={(_, ids) => setExpandedItems(ids)}
                        onItemClick={handleItemClick}
                        onItemExpansionToggle={handleItemExpansionToggle}
                        slots={{ item: CustomTreeItem }}
                        sx={{
                            // Item content styling
                            [`& .${treeItemClasses.content}`]: {
                                borderRadius: '4px',
                                padding: '6px 8px',
                                margin: '0',
                                gap: '4px !important', // Override MUI default gap
                                transition: 'background-color 0.15s ease',
                                '&:hover': {
                                    backgroundColor: '#f0f0f0',
                                },
                                '&.Mui-selected': {
                                    backgroundColor: '#e3f2fd',
                                    '&:hover': {
                                        backgroundColor: '#bbdefb',
                                    },
                                },
                            },
                            
                            // Label styling
                            [`& .${treeItemClasses.label}`]: {
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#2c3e50',
                                paddingLeft: '4px',
                            },
                            
                            // IMPORTANT: Group transition for visual hierarchy
                            [`& .${treeItemClasses.groupTransition}`]: {
                                marginLeft: '12px',
                                paddingLeft: '8px',
                                borderLeft: '2px solid #d0d0d0',
                            },
                            
                            // Icon styling
                            [`& .${treeItemClasses.iconContainer}`]: {
                                
                                '& svg': {
                                    fontSize: '1rem',
                                    color: '#546e7a',
                                },
                            },
                        }}
                    />
                </div>
            </div>

        </div>
    );
}
