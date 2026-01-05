import * as React from 'react';
import { Node } from '../../workspace/model/Node.jsx';
import { useFlow } from '../../workspace/providers/FlowContextDefinition.jsx';
import PanelModuleNode from './type/PanelModuleNode.jsx';
import PanelPrimitiveNode from './type/PanelPrimitiveNode.jsx';
import PanelInstallPackage from './type/PanelInstallPackage.jsx';
import { FiPackage, FiBox, FiDownload } from 'react-icons/fi';
import '../../../assets/css/package_manager.css';

/**
 * Package Manager - Main component for managing OpenAlea packages and nodes.
 * Features three tabs: Visual Packages, Primitives, and Install.
 */
export default function PackageManager() {
    const { addNode } = useFlow();
    const [currentPanel, setCurrentPanel] = React.useState("visual");

    /**
     * Handle Visual Node Panel
     */
    const [treeItemsVisual, setTreeItemsVisual] = React.useState([]);
    const [loadingVisual, setLoadingVisual] = React.useState(true);
    const [loadingPackageVisual, setLoadingPackageVisual] = React.useState(null);
    const [loadedPackagesVisual, setLoadedPackagesVisual] = React.useState(new Set());
    const [expandedItemsVisual, setExpandedItemsVisual] = React.useState(['root']);

    /**
     *  Handle Install Package Panel
     */
    const [packagesInstall, setPackagesInstall] = React.useState([]);
    const [filteredPackagesInstall, setFilteredPackagesInstall] = React.useState([]);
    const [loadingInstall, setLoadingInstall] = React.useState(true);
    const [installing, setInstalling] = React.useState(null);
    const [installedPackages, setInstalledPackages] = React.useState(new Set());
    const [searchTermInstall, setSearchTermInstall] = React.useState('');
    const [snackbarInstall, setSnackbarInstall] = React.useState({ open: false, message: '', severity: 'success' });
    /**
     * Handles adding a node to the workspace.
     * Supports two formats:
     * - TreeNode wrapper: { node: Node } (from PanelPrimitiveNode)
     * - Flat structure: { id, label, inputs, outputs, ... } (from PanelModuleNode)
     */
    const handleAddNode = (item) => {
        const uniqueId = `n${Math.floor(Math.random() * 10000)}`;

        // Check if it's a TreeNode wrapper (has .node property with Node instance)
        if (item.node && item.node.id !== undefined) {
            // TreeNode wrapper format (primitives)
            item.node.id = `${uniqueId}-${item.node.id}`;
            addNode(item.node);
        } else {
            // Flat structure format (visual package nodes from OpenAlea)
            const nodeName = item.name || item.label;
            const newNode = new Node({
                id: `${uniqueId}-${item.id || nodeName}`,
                type: "custom",
                label: nodeName,
                inputs: item.inputs || [],
                outputs: item.outputs || [],
                data: {
                    description: item.description,
                    packageName: item.packageName,
                    nodeName: nodeName,
                    callable: item.callable,
                }
            });
            addNode(newNode);
        }
    };

    const handlePackageInstalled = (pkg) => {
        console.log("Package installed:", pkg.name);
        // Refresh the visual packages list by incrementing the key
        setRefreshKey(prev => prev + 1);
    };

    const tabs = [
        { id: 'visual', label: 'Packages', icon: FiPackage },
        { id: 'primitive', label: 'Primitives', icon: FiBox },
        { id: 'install', label: 'Install', icon: FiDownload },
    ];

    const renderTabContent = () => {
        switch (currentPanel) {
            case "visual":
                return <PanelModuleNode onAddNode={handleAddNode} treeItems={treeItemsVisual} setTreeItems={setTreeItemsVisual} loading={loadingVisual} setLoading={setLoadingVisual} loadingPackage={loadingPackageVisual} setLoadingPackage={setLoadingPackageVisual} loadedPackages={loadedPackagesVisual} setLoadedPackages={setLoadedPackagesVisual} expandedItems={expandedItemsVisual} setExpandedItems={setExpandedItemsVisual} />;
            case "primitive":
                return <PanelPrimitiveNode onAddNode={handleAddNode} />;
            case "install":
                return <PanelInstallPackage onPackageInstalled={handlePackageInstalled} packages={packagesInstall} setPackages={setPackagesInstall} filteredPackages={filteredPackagesInstall} setFilteredPackages={setFilteredPackagesInstall} loading={loadingInstall} setLoading={setLoadingInstall} installing={installing} setInstalling={setInstalling} installedPackages={installedPackages} setInstalledPackages={setInstalledPackages} searchTerm={searchTermInstall} setSearchTerm={setSearchTermInstall} snackbar={snackbarInstall} setSnackbar={setSnackbarInstall} />;
            default:
                return null;
        }
    };

    return (
        <div className="package-manager">
            {/* Header with Tabs */}
            <div className="package-manager-header">
                <div className="package-manager-tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentPanel(tab.id)}
                                className={`package-manager-tab ${currentPanel === tab.id ? 'active' : ''}`}
                            >
                                <Icon className="package-manager-tab-icon" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="package-manager-content">
                {renderTabContent()}
            </div>
        </div>
    );
}
