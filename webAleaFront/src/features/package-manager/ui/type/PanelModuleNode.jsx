import { useEffect, useCallback } from 'react';
import { RichTreeView } from '@mui/x-tree-view';
import { FiPackage, FiLoader } from 'react-icons/fi';
import { getVisualPackagesList, getNodesList } from '../../../../service/PackageService.js';

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

                const items = [{
                    id: 'root',
                    label: 'OpenAlea Packages',
                    children: visualPackages.map(pkg => ({
                        id: pkg.name,
                        label: pkg.name,
                        module: pkg.module,
                        children: [],
                    }))
                }];

                setTreeItems(items);
            } catch (error) {
                console.error("Error fetching visual packages:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPackages();
    }, [version]);

    const loadPackageNodes = useCallback(async (packageId) => {
        if (loadedPackages.has(packageId) || loadingPackage === packageId) {
            return;
        }

        setLoadingPackage(packageId);

        try {
            const packageNodes = await getNodesList({ name: packageId });

            const nodeItems = packageNodes.map(node => ({
                id: `${packageId}::${node.name}`,
                label: node.name,
                description: node.description || "",
                inputs: node.inputs || [],
                outputs: node.outputs || [],
                callable: node.callable,
                packageName: packageId,
                isNode: true,
            }));

            setTreeItems(prevItems => {
                return prevItems.map(root => ({
                    ...root,
                    children: root.children.map(pkg =>
                        pkg.id === packageId
                            ? { ...pkg, children: nodeItems }
                            : pkg
                    )
                }));
            });

            setLoadedPackages(prev => new Set([...prev, packageId]));

        } catch (error) {
            console.error(`Error loading nodes for ${packageId}:`, error);
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

        if (clickedItem.children !== undefined && !clickedItem.isNode && itemId !== 'root') {
            if (!loadedPackages.has(itemId)) {
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
            if (item && !item.isNode) {
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

    const hasPackages = treeItems.length > 0 &&
        treeItems[0]?.children &&
        treeItems[0].children.length > 0;

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
                            '& .MuiTreeItem-content': {
                                borderRadius: '4px',
                                padding: '4px 8px',
                                margin: '2px 0',
                                '&:hover': {
                                    backgroundColor: '#f5f5f5',
                                },
                                '&.Mui-selected': {
                                    backgroundColor: '#e8e8e8',
                                    '&:hover': {
                                        backgroundColor: '#e0e0e0',
                                    },
                                },
                            },
                            '& .MuiTreeItem-label': {
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#333',
                            },
                            '& .MuiTreeItem-group': {
                                marginLeft: '16px',
                                borderLeft: '1px solid #e0e0e0',
                                paddingLeft: '8px',
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
