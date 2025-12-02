import { Handle, Position } from "@xyflow/react";
import "../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";
import { useEffect, useState } from "react";

export default function FloatNode(nodeProps) {
    const { id, data = {} } = nodeProps;
    const { updateNode } = useFlow();

    const [value, setValue] = useState(data.outputs?.[0]?.value ?? 0);

    useEffect(() => {
        updateNode(id, { outputs: [{ value }] });
    }, []);

    const handleChange = (e) => {
        setValue(e.target.value);
        updateNode(id, { outputs: [{ value: e.target.value ? Number.parseFloat(e.target.value) : 0 }] });
    };

    const handleBlur = () => {
        let next = Number.parseFloat(value);

        if (Number.isNaN(next)) next = 0;

        setValue(next);
        updateNode(id, { outputs: [{ value: next }] });
    };

    return (
        <div className="custom-node"
            style={{
                background: "#f0f0f0",
                border: `2px solid #8e24aa`,
                padding: 10,
                borderRadius: 6,
            }}>
            <input
                type="number"
                step="1"
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}  
                className="node-input"
                style={{ width: "100%" }}
            />

            <Handle
                type="target"
                position={Position.Right}
                id={`out-${id}-value`}
                data-handle={data.outputs[0].id ? data.outputs[0].id : `out-${id}-0`}
                className="node-handle"
                style={{
                    background: "#8e24aa",
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
