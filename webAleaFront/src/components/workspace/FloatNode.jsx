import React, { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export default function FloatNode({ id, data }) {
    // local state to avoid uncontrolled -> controlled warnings and to format value
    const [value, setValue] = useState(
        typeof data.value === "number" ? data.value : 0
    );

    useEffect(() => {
        if (typeof data.value === "number" && data.value !== value) {
            setValue(data.value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.value]);

    const onChange = (e) => {
        const parsed = parseFloat(e.target.value);
        const newVal = Number.isNaN(parsed) ? 0 : parsed;
        setValue(newVal);
        if (typeof data.onChange === "function") {
            data.onChange(id, newVal);
        }
    };

    return (
        <div className="bg-white px-3 py-2 rounded shadow w-[140px] text-center">
            {data.label && <div className="text-sm font-medium mb-2">{data.label}</div>}

            <input
                type="number"
                step="0.01"
                value={value}
                onChange={onChange}
                className="border rounded px-2 py-1 w-full"
            />

            {/* optional description */}
            {data.description && <div className="text-xs text-gray-500 mt-1">{data.description}</div>}

            {/* named handles to match typical CustomNode patterns */}
            <Handle id={`${id}-in`} type="target" position={Position.Left} />
            <Handle id={`${id}-out`} type="source" position={Position.Right} />
        </div>
    );
}
