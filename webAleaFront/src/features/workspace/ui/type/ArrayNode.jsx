import React, { useEffect, useState } from "react";
import "../../../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";
import CustomHandle from "../../ui/CustomHandle.jsx";
import { NodeType, DefaultValues, INDEX } from "../../constants/workflowConstants.js";

export default function ArrayNode(nodeProps) {
    const { id, data = {} } = nodeProps;
    const { updateNode } = useFlow();
    const { addLog } = useLog();

    const initialValue = data.outputs?.[INDEX.DEFAULT_OUTPUT]?.value ?? DefaultValues.ARRAY;
    const initialOutputId = data.outputs?.[INDEX.DEFAULT_OUTPUT]?.id ?? `out-${id}-${INDEX.DEFAULT_OUTPUT}`;

    const [outputId] = useState(initialOutputId);
    const [arrayValue, setArrayValue] = useState(Array.isArray(initialValue) ? initialValue : DefaultValues.ARRAY);

    useEffect(() => {
        updateNode(id, { outputs: [{ value: arrayValue, id: outputId, type: NodeType.ARRAY }] });
        addLog(`ArrayNode ${id} updated. value = ${JSON.stringify(arrayValue)}`);
    }, [id, arrayValue, outputId, updateNode, addLog]);

    return (
        <div
            className="custom-node"
            style={{
                background: "#f0f0f0",
                border: "2px solid #00838f",
                padding: 10,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 90
            }}
            data-node-id={id}
        >
            <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>
                Array
            </span>
            <CustomHandle
                id={outputId}
                className="node-handle"
                style={{
                    background: "#00838f",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
                dataType="output"
            />
        </div>
    );
}
