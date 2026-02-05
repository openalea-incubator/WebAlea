import React from "react";
import "../../../../assets/css/custom_node.css";
import CustomHandle from "../../ui/CustomHandle.jsx";
import { NodeType, INDEX, DataType } from "../../constants/workflowConstants.js";
import { useEffect, useMemo, useState } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { useFlow } from "../../providers/FlowContextDefinition.jsx";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";

export default function DictNode({ id, data = {} }) {
    const { updateNode } = useFlow();
    const { addLog } = useLog();
    const updateNodeInternals = useUpdateNodeInternals();

    const initialOutputId = data.outputs?.[INDEX.DEFAULT_OUTPUT]?.id ?? `out-${id}-${INDEX.DEFAULT_OUTPUT}`;
    const [outputId] = useState(initialOutputId);
    const inputs = data.inputs || [];

    const dictValue = useMemo(() => {
        if (!Array.isArray(inputs) || inputs.length === 0) return {};
        return inputs.reduce((acc, input, idx) => {
            const key = input.name || `key_${idx}`;
            acc[key] = input.value !== undefined ? input.value : null;
            return acc;
        }, {});
    }, [inputs]);

    useEffect(() => {
        const existingOutput = data.outputs?.[INDEX.DEFAULT_OUTPUT];
        const existingValue = existingOutput?.value;
        const nextValueJson = JSON.stringify(dictValue);
        const existingValueJson = JSON.stringify(existingValue ?? {});
        const shouldUpdate =
            !existingOutput ||
            existingOutput.id !== outputId ||
            existingOutput.type !== DataType.OBJECT ||
            existingValueJson !== nextValueJson;

        if (!shouldUpdate) return;

        updateNode(id, {
            outputs: [
                {
                    ...(existingOutput || {}),
                    value: dictValue,
                    id: outputId,
                    type: DataType.OBJECT
                }
            ]
        });
        addLog(`DictNode ${id} updated. value = ${JSON.stringify(dictValue)}`);
    }, [id, dictValue, outputId, updateNode, addLog, data.outputs]);

    useEffect(() => {
        updateNodeInternals(id);
    }, [id, inputs.length, updateNodeInternals]);

    return (
        <div
            className="custom-node"
            style={{
                background: "#f0f0f0",
                border: "2px solid #4527a0",
                padding: 10,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 44 + 12 * (inputs.length || 1),
            }}
            data-node-id={id}
        >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Dict</span>

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
                    background: "#4527a0",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
                dataType="output"
                interfaceType={NodeType.DICT}
            />
        </div>
    );
}
