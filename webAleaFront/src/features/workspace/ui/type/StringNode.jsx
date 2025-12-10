import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import "../../../../assets/css/custom_node.css";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";
import { useFlow } from "../../providers/FlowContextDefinition";
import CustomHandle from "../../ui/CustomHandle.jsx";

export default function StringNode(nodeProps) {
    const { id, data = {} } = nodeProps;
    const { updateNode } = useFlow();
    const { addLog } = useLog();

    const initialValue = data.outputs?.[0]?.value ?? "";
    const initialOutputId = data.outputs?.[0]?.id ?? `out-${id}-0`;

    const [value, setValue] = useState(initialValue);
    const [outputId] = useState(initialOutputId); 

    // Sync initial value
    useEffect(() => {
        updateNode(id, { outputs: [{ value, id: outputId, type: "string" }] });
        addLog(`StringNode ${id} updated. value = ${value}`);
    }, [id, value, outputId, updateNode, addLog]);

    const handleChange = (e) => {
        setValue(e.target.value);
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
            <CustomHandle
                id={outputId}
                className="node-handle"
                style={{
                    background: "#1976d2",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
                dataType="output"
            />
        </div>
    );
}
