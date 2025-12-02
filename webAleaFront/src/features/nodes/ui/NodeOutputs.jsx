import React from "react";

export default function NodeOutput({ outputs }) {
    return (
        <div className="node-outputs">
            {outputs.map((output, index) => (
                <div key={index} className="mb-3">
                    <label className="form-label fw-semibold">{output.name}</label>
                    <input
                    type="text"
                    className="form-control"
                    value={output.value}
                    readOnly
                    />
            </div>
        ))}
        </div>
        );
}
