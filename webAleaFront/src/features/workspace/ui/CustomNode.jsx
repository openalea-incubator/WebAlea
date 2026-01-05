    import React, { useCallback, useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useFlow } from '../providers/FlowContextDefinition.jsx';
import "../../../assets/css/custom_node.css";
import CustomHandle from "./CustomHandle.jsx";

/**
 * CustomNode.jsx
 * Noeud React Flow custom.
 */

const getBorderColor = (status) => {
    switch (status) {
        case "queued": return "#ff9800";   // Orange - waiting in queue
        case "running": return "#8e24aa";  // Purple - currently executing
        case "done": return "#2b8a3e";     // Green - completed successfully
        case "error": return "#c62828";    // Red - failed
        case "ready": return "#1976d2";    // Blue - ready/idle
        default: return "#999";            // Gray - unknown
    }
};

const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
        case "ready": return "running";
        case "running": return "error";
        default: return "ready";
    }
};

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
