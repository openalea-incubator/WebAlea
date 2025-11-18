import React from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";

/**
 * Node.jsx
 * Un noeud React Flow "custom" basique, avec de nouvelles propriétés et une méthode de sérialisation.
 *
 * Usage:
 * - data: {
 *     title: string,
 *     color: string,      // couleur d'arrière-plan
 *     status: string,     // exemple: "ready" | "running" | "error"
 *     metadata: object    // informations additionnelles
 *   }
 *
 * Exports:
 * - default: composant React pour le rendu du noeud
 * - serializeNode(node): sérialise un objet node (depuis l'état React Flow) en JS object
 * - serializeNodeToJSON(node): sérialise et retourne une chaîne JSON
 */

export default function CustomNode({ id, data = {} }) {

    const { setNodes } = useReactFlow();

    // valeurs par défaut pour rester robuste si data manquant
    const {
        title = "Noeud",
        status = "unknown",
        metadata = {}
    } = data || {};

    const borderColor = (() => {
        switch (status) {
            case "running":
                return "#2b8a3e";
            case "error":
                return "#c62828";
            case "ready":
                return "#1976d2";
            default:
                return "#999";
        }
    })();

    const nextStatus = (() => {
        switch (status) {
            case "ready": return "running";
            case "running": return "error";
            default: return "ready";
        }
    })();

    const handleClick = () => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id
                    ? { ...n, data: { ...n.data, status: nextStatus } }
                    : n
            )
        );
    };

    return (
        <div
            style={{
                minWidth: 160,
                padding: 10,
                borderRadius: 6,
                backgroundColor: data.color || "#f0f0f0",
                border: `2px solid ${borderColor}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                fontFamily: "sans-serif",
            }}
            data-node-id={id}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: borderColor,
                    }}
                    title={`status: ${status}`}
                    onClick={handleClick}
                />
                <strong style={{ fontSize: 13 }}>{title}</strong>
            </div>

            {metadata && typeof metadata === "object" && Object.keys(metadata).length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#333" }}>
                    <details>
                        <summary style={{ cursor: "pointer", userSelect: "none" }}>Détails</summary>
                        <pre style={{ whiteSpace: "pre-wrap", marginTop: 6, background: "#d6d6d6ff", fontSize: 8, padding: 6, borderRadius: 4, maxHeight: 100, overflow: "auto" }}>
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: "#2b8a3e",
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    border: "2px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                }}
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: "#555",
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    border: "2px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                }}
            />
        </div>
    );
}

export class Node {
    constructor({ id, type = "custom", position = { x: 0, y: 0 }, title, color, status, metadata }) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.data = { title, color, status, metadata };
    }

    /**
     * Sérialise un node (objet tel qu'il existe dans le state de React Flow)
     * Renvoie un objet minimal prêt à être stocké.
     */
    serialize() {
        if (!this || typeof this !== "object") return null;
        const { id, type, position, data = {} } = this;
        return {
            id,
            type,
            position: position ?? { x: 0, y: 0 },
            data: {
                title: data.title ?? null,
                color: data.color ?? null,
                status: data.status ?? null,
                metadata: data.metadata ?? null,
            },
        };
    }

    /**
     * Sérialise et renvoie une chaîne JSON.
     */
    serializeToJSON(spacing = 2) {
        const obj = this.serialize();
        return obj ? JSON.stringify(obj, null, spacing) : null;
    }
}