import { useEffect, useCallback, useRef } from 'react';
import { RichTreeView } from '@mui/x-tree-view';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { FiPackage, FiLoader } from 'react-icons/fi';
import { getVisualPackagesList, getNodesList } from '../../../../service/PackageService.js';
import { buildPackageTree, getFullPackageName } from '../../utils/packageTreeBuilder.js';

/**
 * Panel displaying visual OpenAlea packages and their nodes.
 * Uses lazy loading - nodes are fetched when a package is expanded.
 * 
 * TODO: Refactor this component :
 * * It is a duplicate of the PanelInstallPackage component.
 * * It is not using the TreePackage component.
 * * There are too many parameters.
 * 
 */
export default function PanelModuleNode({ onAddNode, version, treeItems, setTreeItems, loading, setLoading, loadingPackage, setLoadingPackage, loadedPackages, setLoadedPackages, expandedItems, setExpandedItems }) {
    // Ref to access current treeItems in callbacks
    const treeItemsRef = useRef(treeItems);
    
    useEffect(() => {
        treeItemsRef.current = treeItems;
    }, [treeItems]);

    /**
     * Use effect to fetch the visual packages.
     */
    useEffect(() => {

        if (treeItems.length > 0) {
            return;
        }

        async function fetchPackages() {
            setLoading(true);
            try {
                const visualPackages = await getVisualPackagesList();

                // Build hierarchical tree structure
                const treeStructure = buildPackageTree(visualPackages);

                // Wrap in root node for TreeView
                const items = [{
                    id: 'root',
                    label: 'OpenAlea Packages',
                    children: treeStructure
                }];

                setTreeItems(items);

                // Auto-expand root and all namespace folders
                const namespaceIds = ['root'];
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
        }
        fetchPackages();
    }, [version, setExpandedItems]);

    const loadPackageNodes = useCallback(async (packageId) => {
        // Helper to find package in tree
        const findPackageInTree = (items, id) => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findPackageInTree(item.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        // Get current tree items from ref
        const currentItems = treeItemsRef.current;
        const packageNode = findPackageInTree(currentItems, packageId);
        const fullPackageName = packageNode ? getFullPackageName(packageNode) : packageId;

        // Check if already loaded or loading
        if (loadedPackages.has(fullPackageName) || loadingPackage === fullPackageName) {
            return;
        }

        setLoadingPackage(fullPackageName);

        try {
            const packageNodes = await getNodesList({ name: fullPackageName });

            const nodeItems = packageNodes.map(node => ({
                id: `${fullPackageName}::${node.name}`,
                label: node.name,
                description: node.description || "",
                inputs: node.inputs || [],
                outputs: node.outputs || [],
                callable: node.callable,
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
    }, [loadedPackages, loadingPackage]);

    const handleItemClick = useCallback(async (_event, itemId) => {
        const findItem = (items, id) => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findItem(item.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const clickedItem = findItem(treeItems, itemId);
        if (!clickedItem) return;

        if (clickedItem.isNode && onAddNode) {
            onAddNode(clickedItem);
            return;
        }

        // Only load nodes for actual packages (not namespace folders)
        if (clickedItem.children !== undefined && !clickedItem.isNode && itemId !== 'root' && !clickedItem.isNamespace) {
            const fullPackageName = getFullPackageName(clickedItem);
            if (!loadedPackages.has(fullPackageName)) {
                await loadPackageNodes(itemId);
            }
        }
    }, [treeItems, onAddNode, loadedPackages, loadPackageNodes]);

    const handleItemExpansionToggle = useCallback(async (_event, itemId, isExpanded) => {
        if (isExpanded && itemId !== 'root' && !loadedPackages.has(itemId)) {
            const findItem = (items, id) => {
                for (const item of items) {
                    if (item.id === id) return item;
                    if (item.children) {
                        const found = findItem(item.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const item = findItem(treeItems, itemId);
            // Only load nodes for actual packages (not namespace folders or root)
            if (item && !item.isNode && !item.isNamespace && itemId !== 'root') {
                await loadPackageNodes(itemId);
            }
        }
    }, [treeItems, loadedPackages, loadPackageNodes]);

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

    const hasPackages = treeItems.length > 0 && hasAnyPackages(treeItems[0]?.children);

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