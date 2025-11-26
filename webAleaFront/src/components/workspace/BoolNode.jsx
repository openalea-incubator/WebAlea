import { Handle, Position } from "@xyflow/react"

export default function BoolNode(nodeProps) {
    const { id, data = {}, isConnectable, selected } = nodeProps;
    const value = !!data.value;

    const handleChange = (e) => {
        const next = e.target.value === "true";
        if (typeof data.onChange === "function") {
            data.onChange(id, next);
        } else if (typeof nodeProps.onChange === "function") {
            nodeProps.onChange(id, next);
        }
    };

    return (
        <div className={`bg-white px-3 py-2 rounded shadow w-[140px] text-center ${selected ? "ring-2 ring-blue-400" : ""}`}>
            <select
                value={value ? "true" : "false"}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
            >
                <option value="true">true</option>
                <option value="false">false</option>
            </select>

            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
}
