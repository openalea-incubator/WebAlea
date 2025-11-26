import React from "react";
import { Handle, Position } from "@xyflow/react";

export default function StringNode({ id, data, selected }) {
    const { value = "", label = "String", onChange, onDelete, isConnectable } = data;

    return (
        <div
            className={`bg-white rounded shadow w-[180px] text-sm overflow-hidden ${
                selected ? "ring-2 ring-indigo-400" : ""
            }`}
        >
            {/* header */}
            <div className="flex items-center justify-between bg-gray-100 px-2 py-1 text-xs">
                <span className="font-medium">{label}</span>
                {onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(id)}
                        className="text-red-500 hover:underline"
                    >
                        x
                    </button>
                )}
            </div>

            {/* body */}
            <div className="p-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange?.(id, e.target.value)}
                    className="border rounded px-2 py-1 w-full text-sm"
                />
            </div>

            {/* handles */}
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
}
