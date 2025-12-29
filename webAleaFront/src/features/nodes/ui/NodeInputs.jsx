import React from "react";
import NodeInputFloat from "../model/NodeInputFloat";
import NodeInputString from "../model/NodeInputStr";
import NodeInputBoolean from "../model/NodeInputBool";
import NodeInputEnum from "../model/NodeInputEnum";

/**
 * Parse malformed input data from OpenAlea
 * Some inputs have name like: "{'name': 'order', 'interface': IEnumStr(enum=['C', 'F']), 'value': 'C'}"
 */
function parseInput(input, index) {
    let parsedName = input.name;
    let parsedInterface = input.interface || "None";
    let parsedValue = input.value;
    let enumOptions = null;

    // Check if name contains a dict-like string
    if (input.name && input.name.startsWith("{")) {
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
                enumOptions = enumMatch[1]
                    .split(',')
                    .map(s => s.trim().replace(/'/g, ''));
            }

            // Extract default value
            const valueMatch = input.name.match(/'value':\s*'?([^',}]+)'?/);
            if (valueMatch && parsedValue === undefined) {
                parsedValue = valueMatch[1].trim().replace(/'/g, '');
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
        value: parsedValue,
        enumOptions,
        optional: input.optional || false,
        desc: input.desc || ""
    };
}

/**
 * Map OpenAlea interface types to our internal types
 */
function getInputType(parsedInput) {
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
