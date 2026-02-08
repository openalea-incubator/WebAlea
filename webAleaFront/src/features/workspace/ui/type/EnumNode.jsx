import React, { useEffect, useMemo } from "react";
import "../../../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition.jsx";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";
import CustomHandle from "../../ui/CustomHandle.jsx";
import { DataType, DefaultValues, INDEX, NodeType } from "../../constants/workflowConstants.js";

export default function EnumNode({ id, data = {} }) {
    const { updateNode } = useFlow();
    const { addLog } = useLog();

    const output = data.outputs?.[INDEX.DEFAULT_OUTPUT] ?? {};
    const outputId = output.id ?? `out-${id}-${INDEX.DEFAULT_OUTPUT}`;
    const options = Array.isArray(output.enumOptions) ? output.enumOptions : [];
    const value = output.value ?? (options[0] ?? DefaultValues.ENUM);

    useEffect(() => {
        const hasSameId = output?.id === outputId;
        const hasSameType = output?.type === DataType.ENUM;
        const hasSameValue = output?.value === value;
        const sameOptions =
            Array.isArray(output?.enumOptions) &&
            JSON.stringify(output.enumOptions) === JSON.stringify(options);

        if (hasSameId && hasSameType && hasSameValue && sameOptions) {
            return;
        }

        updateNode(id, {
            outputs: [{
                ...(output || {}),
                id: outputId,
                type: DataType.ENUM,
                enumOptions: options,
                value
            }]
        });
        addLog(`EnumNode ${id} updated. value = ${value}`);
    }, [id, output, outputId, options, value, updateNode, addLog]);

    const displayValue = useMemo(() => {
        if (value === undefined || value === null) return "";
        return String(value);
    }, [value]);

    return (
        <div
            className="custom-node"
            style={{
                background: "#f0f0f0",
                border: "2px solid #ff6f00",
                padding: 10,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 90,
            }}
            data-node-id={id}
        >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Enum</span>
            <span style={{ fontSize: 12, color: "#444" }}>
                {displayValue || "no value"}
            </span>

            <CustomHandle
                id={outputId}
                className="node-handle"
                style={{
                    background: "#ff6f00",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
                dataType="output"
                interfaceType={NodeType.ENUM}
            />
        </div>
    );
}
