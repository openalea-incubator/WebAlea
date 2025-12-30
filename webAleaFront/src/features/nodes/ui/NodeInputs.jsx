import React from "react";
import NodeInputFloat from "../model/NodeInputFloat";
import NodeInputString from "../model/NodeInputStr";
import NodeInputBoolean from "../model/NodeInputBool";
import NodeInputEnum from "../model/NodeInputEnum";

/**
 * Parse input data from backend or legacy malformed OpenAlea format.
 * Now the backend pre-parses dict-like strings, so we primarily use backend data.
 * Fallback parsing kept for backwards compatibility with cached data.
 */
function parseInput(input, index) {
    let parsedName = input.name;
    let parsedInterface = input.interface || "None";
    let parsedType = input.type || null;
    let parsedValue = input.value ?? input.default;
    let enumOptions = input.enumOptions || null;

    // Fallback: Check if name contains a dict-like string (legacy/cached data)
    if (input.name && typeof input.name === 'string' && input.name.startsWith("{")) {
        try {
            // Extract name
            const nameMatch = input.name.match(/'name':\s*'([^']+)'/);
            if (nameMatch) parsedName = nameMatch[1];

            // Extract interface type
            const ifaceMatch = input.name.match(/'interface':\s*(\w+)/);
            if (ifaceMatch) parsedInterface = ifaceMatch[1];

            // Extract enum options: IEnumStr(enum=['C', 'F'])
            const enumMatch = input.name.match(/IEnumStr\(enum=\[([^\]]+)\]\)/);
            if (enumMatch) {
                parsedInterface = "IEnumStr";
                parsedType = "enum";
                enumOptions = enumMatch[1]
                    .split(',')
                    .map(s => s.trim().replace(/'/g, ''));
            }

            // Extract default value
            const valueMatch = input.name.match(/'value':\s*'?([^',}]+)'?/);
            if (valueMatch && parsedValue === undefined) {
                let val = valueMatch[1].trim().replace(/'/g, '');
                // Convert string representations to proper types
                if (val === 'None') val = null;
                else if (val === 'True') val = true;
                else if (val === 'False') val = false;
                else if (!isNaN(parseFloat(val))) val = parseFloat(val);
                parsedValue = val;
            }
        } catch (e) {
            console.warn("Failed to parse input:", input.name, e);
        }
    }

    // Generate ID if missing
    const id = input.id || `input_${index}_${parsedName}`;

    return {
        id,
        name: parsedName,
        interface: parsedInterface,
        type: parsedType,
        value: parsedValue,
        enumOptions,
        optional: input.optional || false,
        desc: input.desc || ""
    };
}

/**
 * Map OpenAlea interface types to our internal types.
 * Uses 'type' field from backend if available, otherwise falls back to interface parsing.
 */
function getInputType(parsedInput) {
    // Use type from backend if available (preferred)
    if (parsedInput.type && parsedInput.type !== 'any') {
        return parsedInput.type;
    }

    // Fallback: parse from interface name
    const iface = (parsedInput.interface || "").toLowerCase();

    // Enum type
    if (iface.includes("enum")) return "enum";

    // Float/Int types
    if (iface.includes("float") || iface.includes("ifloat")) return "float";
    if (iface.includes("int") || iface.includes("iint")) return "float";

    // String type
    if (iface.includes("str") || iface.includes("istr")) return "string";

    // Boolean type
    if (iface.includes("bool") || iface.includes("ibool")) return "boolean";

    // File/Path types -> string
    if (iface.includes("file") || iface.includes("path") || iface.includes("dir")) return "string";

    // Default to string for "None" or unknown types
    return "string";
}

export default function NodeInput({ inputs, onInputChange }) {

    const handleChange = (inputId, newValue) => {
        if (onInputChange) {
            onInputChange(inputId, newValue);
        }
    };

    if (!inputs || inputs.length === 0) {
        return <div className="text-muted small">No inputs</div>;
    }

    return (
        <div className="node-inputs">
            {inputs.map((input, index) => {
                const parsed = parseInput(input, index);
                const inputType = getInputType(parsed);

                switch (inputType) {
                    case "float":
                        return (
                            <NodeInputFloat
                                key={parsed.id}
                                inputName={parsed.name}
                                value={parsed.value ?? 0}
                                onChange={(val) => handleChange(parsed.id, val)}
                            />
                        );
                    case "string":
                        return (
                            <NodeInputString
                                key={parsed.id}
                                inputName={parsed.name}
                                value={parsed.value ?? ""}
                                onChange={(val) => handleChange(parsed.id, val)}
                            />
                        );
                    case "boolean":
                        return (
                            <NodeInputBoolean
                                key={parsed.id}
                                inputName={parsed.name}
                                value={parsed.value ?? false}
                                onChange={(val) => handleChange(parsed.id, val)}
                            />
                        );
                    case "enum":
                        return (
                            <NodeInputEnum
                                key={parsed.id}
                                inputName={parsed.name}
                                value={parsed.value ?? ""}
                                options={parsed.enumOptions || []}
                                onChange={(val) => handleChange(parsed.id, val)}
                            />
                        );
                    default:
                        return (
                            <NodeInputString
                                key={parsed.id}
                                inputName={parsed.name}
                                value={parsed.value ?? ""}
                                onChange={(val) => handleChange(parsed.id, val)}
                            />
                        );
                }
            })}
        </div>
    );
}
