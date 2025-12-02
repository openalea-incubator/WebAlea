import { Handle, Position } from "@xyflow/react";
import "../../../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";
import { useEffect, useState } from "react";

export default function BoolNode(nodeProps) {
    const { id, data = {}, selected } = nodeProps;
    const { updateNode } = useFlow();
    const { addLog } = useLog();

    const initialValue = data.outputs?.[0]?.value ?? false;
    const initialOutputId = data.outputs?.[0]?.id ?? `out-${id}-0`;

    const [value, setValue] = useState(initialValue);
    const [outputId] = useState(initialOutputId); 

    useEffect(() => {
        updateNode(id, { outputs: [{ value, id: outputId }] });
        addLog(`BoolNode ${id} updated. value = ${value}`);
    }, [id, value, outputId, updateNode, addLog]);

    const handleChange = (e) => {
        const boolValue = e.target.value === "true";
        setValue(boolValue);
    };

    return (
        <div
            className="custom-node"
            style={{
                background: "#f0f0f0",
                border: `2px solid #2b8a3e`,
                padding: 10,
                borderRadius: 6,
                minWidth: 120,
            }}
            data-node-id={id}
            data-selected={selected ? "true" : "false"}
        >
            {/* Selector boolean */}
            <select
                value={value ? "true" : "false"}
                onChange={handleChange}
                className="node-select w-full px-2 py-1 border rounded"
            >
                <option value="true">true</option>
                <option value="false">false</option>
            </select>

            {/* OUTPUT */}
            <Handle
                type="target"
                position={Position.Right}
                id={`out-${id}-value`}
                data-handle={outputId}
                className="node-handle"
                style={{
                    background: "#2b8a3e",
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
            />
        </div>
    );
}
