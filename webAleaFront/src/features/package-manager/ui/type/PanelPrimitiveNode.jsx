import { useCallback } from 'react';
import { FiHash, FiType, FiToggleLeft, FiList, FiBox } from 'react-icons/fi';
import { Node } from '../../../workspace/model/Node.jsx';
import TreeNode from '../../model/TreeNode.jsx';

/**
 * Primitive node definitions for basic input types.
 */
const PRIMITIVE_NODES = [
    {
        id: 'float',
        label: 'Float',
        description: 'Numeric value input',
        type: 'float',
        icon: FiHash,
        iconClass: 'float',
        node: new Node({
            id: 'float',
            label: 'Float input',
            type: 'float',
            outputs: [{ name: 'Value', type: 'float', default: 0 }]
        })
    },
    {
        id: 'string',
        label: 'String',
        description: 'Text value input',
        type: 'string',
        icon: FiType,
        iconClass: 'string',
        node: new Node({
            id: 'string',
            label: 'String input',
            type: 'string',
            outputs: [{ name: 'Value', type: 'string', default: '' }]
        })
    },
    {
        id: 'boolean',
        label: 'Boolean',
        description: 'True/False toggle',
        type: 'boolean',
        icon: FiToggleLeft,
        iconClass: 'boolean',
        node: new Node({
            id: 'boolean',
            label: 'Boolean input',
            type: 'boolean',
            outputs: [{ name: 'Value', type: 'boolean', default: false }]
        })
    }
    ,
    {
        id: 'array',
        label: 'Array',
        description: 'JSON array input',
        type: 'array',
        icon: FiList,
        iconClass: 'array',
        node: new Node({
            id: 'array',
            label: 'Array input',
            type: 'array',
            outputs: [{ name: 'Value', type: 'array', default: [] }]
        })
    },
    {
        id: 'dict',
        label: 'Dict',
        description: 'Key/Value object input',
        type: 'dict',
        icon: FiBox,
        iconClass: 'object',
        node: new Node({
            id: 'dict',
            label: 'Dict input',
            type: 'dict',
            outputs: [{ name: 'Value', type: 'object', default: {} }]
        })
    }
];

/**
 * Panel displaying primitive input nodes (Float, String, Boolean).
 * Click on a node to add it to the workspace.
 * 
 * @param {function} onAddNode - The function to call when a node is added.
 * @returns {React.ReactNode} - The PanelPrimitiveNode component.
 */
export default function PanelPrimitiveNode({ onAddNode }) {

    /**
     * Function to handle node click.
     * @param {object} primitive - The primitive node.
     */
    const handleNodeClick = useCallback((primitive) => {
        if (onAddNode) {
            // Wrap in TreeNode format for consistency with PackageManager.handleAddNode
            const treeNode = new TreeNode(primitive.node);
            onAddNode(treeNode.serialize());
        }
    }, [onAddNode]);

    /**
     * Return the primitive nodes.
     * @returns {React.ReactNode} - The primitive nodes.
     */
    return (
        <div className="panel-container">
            <div className="package-count">
                {PRIMITIVE_NODES.length} primitive types available
            </div>

            <div className="panel-scrollable">
                <div className="primitive-list">
                    {PRIMITIVE_NODES.map((primitive) => {
                        const Icon = primitive.icon;
                        return (
                            <div
                                key={primitive.id}
                                className="primitive-item"
                                onClick={() => handleNodeClick(primitive)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleNodeClick(primitive);
                                    }
                                }}
                            >
                                <div className={`primitive-icon ${primitive.iconClass}`}>
                                    <Icon />
                                </div>
                                <div className="primitive-content">
                                    <div className="primitive-label">{primitive.label}</div>
                                    <div className="primitive-type">{primitive.description}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
