import React, { useCallback, useMemo } from "react";
import { useFlow } from '../providers/FlowContextDefinition.jsx';
import "../../../assets/css/custom_node.css";
import CustomHandle from "./CustomHandle.jsx";
import { NodeState, getNodeStateColor } from '../constants/nodeState.js';

/**
 * CustomNode.jsx
 * A customizable node component for a workflow editor.
 * The node displays a label, status indicator, metadata details,
 * and dynamically renders input and output handles based on provided props.
 *
 * Props:
 * - id: Unique identifier for the node.
 * - data: An object containing:
 *   - label: The display label of the node.
 *   - color: Background color of the node.
 *   - status: Current state of the node (NodeState constant).
 *   - metadata: Additional information to display in a collapsible section.
 *   - inputs: Array of input handle definitions.
 *   - outputs: Array of output handle definitions.
 *
 * The node's border color changes based on its state.
 */

const getNextState = (currentState) => {
    switch (currentState) {
        case NodeState.READY:
            return NodeState.RUNNING;
        case NodeState.RUNNING:
            return NodeState.ERROR;
        default:
            return NodeState.READY;
    }
};

export default function CustomNode(nodeProps) {
    const { updateNode } = useFlow();

    const {
        id,
        data: { label, color, status, metadata, inputs, outputs },
    } = nodeProps;

    // Use NodeState directly - if status is an old string value, default to READY
    const nodeState = status && Object.values(NodeState).includes(status) 
        ? status 
        : NodeState.READY;
    
    const borderColor = useMemo(() => getNodeStateColor(nodeState), [nodeState]);
    const nextState = useMemo(() => getNextState(nodeState), [nodeState]);

    // eslint-disable-next-line no-unused-vars
    const handleStatusClick = useCallback(() => {
        updateNode(id, { status: nextState });
    }, [id, nextState, updateNode]);

    // Dynamic styles based on inputs/outputs
    const dynamicNodeStyle = {
        backgroundColor: color || "#f0f0f0",
        border: `2px solid ${borderColor}`,
        height: 44 + 12 * ((inputs.length > 0 || outputs.length > 0) ? Math.max(inputs.length, outputs.length) : 1),
    };

    return (
        <div className="custom-node" style={dynamicNodeStyle} data-node-id={id}>
            <div className="custom-node-header">
                <div
                    className="custom-node-status"
                    style={{ background: borderColor }}
                    title={`state: ${nodeState}`}
                />
                <strong style={{ fontSize: 13 }}>{label}</strong>
            </div>

            {/* INPUTS */}
            {Array.isArray(inputs) &&
                inputs.map((input, index) => {
                    const topPercent = ((index + 1) / (inputs.length + 1)) * 100;
                    const handleId = input.id || `input_${index}`;
                    return (
                        <CustomHandle
                            key={handleId + "_" + index}
                            id={handleId}
                            interfaceType={input.type || input.interface}
                            style={{
                                top: `${topPercent}%`,
                            }}
                            dataType="input"
                        />
                    );
                })
            }

            {/* OUTPUTS */}
            {Array.isArray(outputs) &&
                outputs.map((output, index) => {
                    const topPercent = ((index + 1) / (outputs.length + 1)) * 100;
                    const handleId = output.id || `output_${index}`;
                    return (
                        <CustomHandle
                            key={handleId + "_" + index}
                            id={handleId}
                            interfaceType={output.type || output.interface}
                            style={{
                                top: `${topPercent}%`,
                            }}
                            dataType="output"
                        />
                    );
                })}
        </div>
    );
}
