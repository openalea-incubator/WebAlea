import React, { useEffect, useMemo, useState } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import "../../../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";
import CustomHandle from "../../ui/CustomHandle.jsx";
import { NodeType, DefaultValues, INDEX } from "../../constants/workflowConstants.js";

export default function ArrayNode(nodeProps) {
    const { id, data = {} } = nodeProps;
    const { updateNode } = useFlow();
    const { addLog } = useLog();
    const updateNodeInternals = useUpdateNodeInternals();

    const initialOutputId = data.outputs?.[INDEX.DEFAULT_OUTPUT]?.id ?? `out-${id}-${INDEX.DEFAULT_OUTPUT}`;
    const inputs = data.inputs || [];

    const [outputId] = useState(initialOutputId);

    const arrayValue = useMemo(() => {
        if (!Array.isArray(inputs) || inputs.length === 0) return DefaultValues.ARRAY;
        return inputs.map((input) => (input.value !== undefined ? input.value : null));
    }, [inputs]);

    useEffect(() => {
        const existingOutput = data.outputs?.[INDEX.DEFAULT_OUTPUT];
        const existingValue = existingOutput?.value;
        const nextValueJson = JSON.stringify(arrayValue);
        const existingValueJson = JSON.stringify(existingValue ?? DefaultValues.ARRAY);
        const shouldUpdate =
            !existingOutput ||
            existingOutput.id !== outputId ||
            existingOutput.type !== NodeType.ARRAY ||
            existingValueJson !== nextValueJson;

        if (!shouldUpdate) return;

        updateNode(id, {
            outputs: [
                {
                    ...(existingOutput || {}),
                    value: arrayValue,
                    id: outputId,
                    type: NodeType.ARRAY
                }
            ]
        });
        addLog(`ArrayNode ${id} updated. value = ${JSON.stringify(arrayValue)}`);
    }, [id, arrayValue, outputId, updateNode, addLog, data.outputs]);

    const dynamicNodeStyle = useMemo(() => {
        const count = Array.isArray(inputs) && inputs.length > 0 ? inputs.length : 1;
        return {
            background: "#f0f0f0",
            border: "2px solid #00838f",
            padding: 10,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 90,
            height: 44 + 12 * count,
        };
    }, [inputs]);

    useEffect(() => {
        updateNodeInternals(id);
    }, [id, inputs.length, updateNodeInternals]);

    return (
        <div
            className="custom-node"
            style={dynamicNodeStyle}
            data-node-id={id}
        >
            <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>
                Array
            </span>

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
                })}
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
