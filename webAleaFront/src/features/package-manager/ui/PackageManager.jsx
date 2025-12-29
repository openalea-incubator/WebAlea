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
    const [refreshKey, setRefreshKey] = React.useState(0);

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
            // Flat structure format (visual package nodes)
            const newNode = new Node({
                id: `${uniqueId}-${item.id || item.label}`,
                type: "custom",
                label: item.label || item.name,
                inputs: item.inputs || [],
                outputs: item.outputs || [],
                data: {
                    description: item.description,
                    packageName: item.packageName,
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
                return <PanelModuleNode key={refreshKey} onAddNode={handleAddNode} />;
            case "primitive":
                return <PanelPrimitiveNode onAddNode={handleAddNode} />;
            case "install":
                return <PanelInstallPackage onPackageInstalled={handlePackageInstalled} />;
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
