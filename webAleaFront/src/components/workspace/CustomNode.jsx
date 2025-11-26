import React, { useCallback, useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useFlow } from '../../providers/FlowContextDefinition.jsx';
import "../../assets/css/custom_node.css";

/**
 * CustomNode.jsx
 * Noeud React Flow custom.
 */

const getBorderColor = (status) => {
    switch (status) {
        case "running": return "#2b8a3e";
        case "error": return "#c62828";
        case "ready": return "#1976d2";
        default: return "#999";
    }
};

const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
        case "ready": return "running";
        case "running": return "error";
        default: return "ready";
    }
};

const typeColors = {
    string: "#1976d2",
    float: "#8e24aa",
    boolean: "#2b8a3e",
    default: "#555",
};

const getTypeColor = (t) => typeColors[t] || typeColors.default;


export default function CustomNode(nodeProps) {
    const { updateNode } = useFlow();

    const {
        id,
        data: { label, color, status, metadata, inputs, outputs },
    } = nodeProps;

    const borderColor = useMemo(() => getBorderColor(status), [status]);
    const nextStatus = useMemo(() => getNextStatus(status), [status]);

    const handleStatusClick = useCallback(() => {
        updateNode(id, { status: nextStatus });
    }, [id, nextStatus, updateNode]);

    // Dynamiques : couleur, status, height selon inputs
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
                    title={`status: ${status}`}
                    onClick={handleStatusClick}
                />
                <strong style={{ fontSize: 13 }}>{label}</strong>
            </div>

            {metadata && typeof metadata === "object" && Object.keys(metadata).length > 0 && (
                <div className="custom-node-metadata">
                    <details>
                        <summary>Détails</summary>
                        <pre>{JSON.stringify(metadata, null, 2)}</pre>
                    </details>
                </div>
            )}

            {/* INPUTS */}
            {Array.isArray(inputs) &&
                inputs.map((input, index) => {
                    const topPercent = ((index + 1) / (inputs.length + 1)) * 100;
                    return (
                        <Handle
                            key={`in-${index}`}
                            type="source"
                            position={Position.Left}
                            id={`in-${id}-${index}`}
                            className="node-handle"
                            style={{
                                background: getTypeColor(input.type),
                                top: `${topPercent}%`,
                            }}
                        />
                    );
                })}

            {/* OUTPUTS */}
            {Array.isArray(outputs) &&
                outputs.map((output, index) => {
                    const topPercent = ((index + 1) / (outputs.length + 1)) * 100;
                    return (
                        <Handle
                            key={`out-${index}`}
                            type="target"
                            position={Position.Right}
                            id={`out-${id}-${index}`}
                            className="node-handle"
                            style={{
                                background: getTypeColor(output.type),
                                top: `${topPercent}%`,
                            }}
                        />
                    );
                })}
        </div>
    );
}
