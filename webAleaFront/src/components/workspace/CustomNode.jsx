import React, { useCallback, useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useFlow } from '../../providers/FlowContextDefinition.jsx';

/**
 * CustomNode.jsx
 * Un noeud React Flow "custom" basique, avec titre, couleur, statut et métadonnées.
 * Le statut peut être cliqué pour changer entre "ready", "running" et "error".
 * Les métadonnées sont affichées dans un panneau déroulant.
 */

const getBorderColor = (status) => {
    switch (status) {
        case "running":
            return "#2b8a3e"; // Vert
        case "error":
            return "#c62828"; // Rouge
        case "ready":
            return "#1976d2"; // Bleu
        default:
            return "#999"; // Gris
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
        data: { label, color, status, metadata }
    } = nodeProps;


    const borderColor = useMemo(() => getBorderColor(status), [status]);
    const nextStatus = useMemo(() => getNextStatus(status), [status]);

    const handleStatusClick = useCallback(() => {
        updateNode(id, { status: nextStatus });
    }, [id, nextStatus, updateNode]);

    // Style principal du noeud
    const nodeStyle = {
        minWidth: 160,
        padding: 10,
        borderRadius: 6,
        backgroundColor: color || "#f0f0f0",
        border: `2px solid ${borderColor}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        fontFamily: "sans-serif",
    };

    // Style des handles (connecteurs)
    const handleStyle = {
        width: 12,
        height: 12,
        borderRadius: 6,
        border: "2px solid rgba(255,255,255,0.6)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        cursor: "pointer",
    };

    return (
        <div style={nodeStyle} data-node-id={id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: borderColor,
                        cursor: "pointer",
                    }}
                    title={`status: ${label}`}
                    onClick={handleStatusClick}
                />
                <strong style={{ fontSize: 13 }}>{label}</strong>
            </div>

            {metadata && typeof metadata === "object" && Object.keys(metadata).length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#333" }}>
                    <details>
                        <summary style={{ cursor: "pointer", userSelect: "none" }}>Détails</summary>
                        <pre style={{ whiteSpace: "pre-wrap", marginTop: 6, background: "#e9e9e9", fontSize: 8, padding: 6, borderRadius: 4, maxHeight: 100, overflow: "auto" }}>
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                style={{
                    ...handleStyle,
                    background: "#2b8a3e",
                }}
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    ...handleStyle,
                    background: "#555",
                }}
            />
        </div>
    );
}
