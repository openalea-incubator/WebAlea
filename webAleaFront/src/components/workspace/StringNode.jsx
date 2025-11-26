import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import "../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";

export default function StringNode(nodeProps) {
    const { id, data = {} } = nodeProps;
    const { updateNode } = useFlow();

    // --- valeur locale contrôlée ---
    const [value, setValue] = useState(data.outputs?.[0]?.value ?? "");

    // Sync initial value
    useEffect(() => {
        updateNode(id, { outputs: [{ value }] });
    }, []);

    const handleChange = (e) => {
        const nextValue = e.target.value;
        setValue(nextValue);
        updateNode(id, { outputs: [{ value: nextValue }] });
    };

    const handleBlur = () => {
        if (!value) {
            setValue("");
            updateNode(id, { outputs: [{ value: "" }] });
        }
    };

    return (
        <div
            className="custom-node"
            style={{
                background: "#f0f0f0",
                border: "2px solid #1976d2",
                padding: 6,
                borderRadius: 6,
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: 4,
            }}
            data-node-id={id}
        >
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                className="node-input"
                style={{
                    width: 80,
                    padding: "2px 4px",
                    fontSize: 13,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                }}
            />

            <Handle
                type="source"
                position={Position.Right}
                id={`out-${id}-value`}
                className="node-handle"
                style={{
                    background: "#1976d2",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
            />
        </div>
    );
}
