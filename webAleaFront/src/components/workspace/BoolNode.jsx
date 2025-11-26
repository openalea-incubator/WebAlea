import { Handle, Position } from "@xyflow/react";
import "../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";

export default function BoolNode(nodeProps) {
    const { id, data = {}, selected } = nodeProps;
    const { updateNode } = useFlow();

    const handleChange = (e) => {
        const next = e.target.value === "true";
        updateNode(id, { outputs: [{ value: next }] });  
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
                value={data.outputs?.[0]?.value ? "true" : "false"}
                onChange={handleChange}
                className="node-select w-full px-2 py-1 border rounded"
            >
                <option value="true">true</option>
                <option value="false">false</option>
            </select>


            {/* OUTPUT */}
            <Handle
                type="source"
                position={Position.Right}
                id={`out-${id}-value`}
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
