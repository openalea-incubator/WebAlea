import React from "react";

function formatPrimitiveValue(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function renderObjectValue(value) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function NodeOutputValue({ value }) {
    if (isPlainObject(value) && typeof value.__type__ === "string") {
        const typeName = value.__type__;
        const data = value.data !== undefined ? value.data : value;
        return (
            <div>
                <div className="small text-muted mb-1">
                    Type: <code>{typeName}</code>
                </div>
                <textarea
                    className="form-control bg-light"
                    value={renderObjectValue(data)}
                    rows={4}
                    readOnly
                />
            </div>
        );
    }

    if (Array.isArray(value)) {
        return (
            <textarea
                className="form-control bg-light"
                value={renderObjectValue(value)}
                rows={4}
                readOnly
            />
        );
    }

    if (isPlainObject(value)) {
        return (
            <textarea
                className="form-control bg-light"
                value={renderObjectValue(value)}
                rows={4}
                readOnly
            />
        );
    }

    return (
        <input
            type="text"
            className="form-control bg-light"
            value={formatPrimitiveValue(value)}
            placeholder="--"
            readOnly
        />
    );
}

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

                return (
                    <div key={output.id || `output_${index}`} className="mb-3">
                        <label className="form-label fw-semibold">{name}</label>
                        <NodeOutputValue value={output.value} />
                    </div>
                );
            })}
        </div>
    );
}
