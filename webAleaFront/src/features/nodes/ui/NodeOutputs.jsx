import React from "react";

/**
 * Parse output name in case it contains a dict-like string
 */
function parseOutputName(output) {
    let name = output.name;

    // Check if name contains a dict-like string
    if (name && name.startsWith("{")) {
        try {
            const nameMatch = name.match(/'name':\s*'([^']+)'/);
            if (nameMatch) name = nameMatch[1];
        } catch (e) {
            console.warn("Failed to parse output name:", output.name, e);
        }
    }

    return name || "output";
}

/**
 * NodeOutput component.
 * This component is used to display the outputs of a node in the sidebar.
 * @param {object} outputs - The outputs data.
 * @returns {React.ReactNode} - The NodeOutput component.
 */
export default function NodeOutput({ outputs }) {
    if (!outputs || outputs.length === 0) {
        return <div className="text-muted small">No outputs</div>;
    }

    return (
        <div className="node-outputs">
            {outputs.map((output, index) => {
                const name = parseOutputName(output);
                const value = output.value !== undefined ? String(output.value) : "";

                return (
                    <div key={output.id || `output_${index}`} className="mb-3">
                        <label className="form-label fw-semibold">{name}</label>
                        <input
                            type="text"
                            className="form-control bg-light"
                            value={value}
                            placeholder="--"
                            readOnly
                        />
                    </div>
                );
            })}
        </div>
    );
}
