/**
 * PrimitiveNode.jsx
 * 
 * Base component for primitive nodes (Float, String, Boolean).
 * This component eliminates code duplication by providing a reusable implementation
 * for all primitive node types.
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Node ID
 * @param {Object} props.data - Node data
 * @param {string} props.type - Node type ('float', 'string', 'boolean')
 * @param {string} props.borderColor - Border color for the node
 * @param {Function} props.parseValue - Function to parse input value
 * @param {Function} props.validateValue - Function to validate value on blur
 * @param {React.ReactNode} props.inputElement - Custom input element (optional)
 */

import React, { useEffect, useState } from "react";
import "../../../../assets/css/custom_node.css";
import { useFlow } from "../../providers/FlowContextDefinition";
import { useLog } from "../../../logger/providers/LogContextDefinition.jsx";
import CustomHandle from "../../ui/CustomHandle.jsx";

export default function PrimitiveNode({
    id,
    data = {},
    type,
    borderColor,
    parseValue = (val) => val,
    validateValue = (val) => val,
    inputElement = null,
    defaultValue = null
}) {
    const { updateNode } = useFlow();
    const { addLog } = useLog();

    // Determine default value based on type if not provided
    const getDefaultValue = () => {
        if (defaultValue !== null) return defaultValue;
        switch (type) {
            case 'float': return 0;
            case 'string': return '';
            case 'boolean': return false;
            default: return null;
        }
    };

    const initialValue = data.outputs?.[0]?.value ?? getDefaultValue();
    const initialOutputId = data.outputs?.[0]?.id ?? `out-${id}-0`;

    const [value, setValue] = useState(initialValue);
    const [outputId] = useState(initialOutputId);

    // Sync value changes to node
    useEffect(() => {
        updateNode(id, { outputs: [{ value, id: outputId, type }] });
        addLog(`${type.charAt(0).toUpperCase() + type.slice(1)}Node ${id} updated. value = ${value}`);
    }, [id, value, outputId, type, updateNode, addLog]);

    const handleChange = (e) => {
        const newValue = parseValue(e.target.value);
        setValue(newValue);
    };

    const handleBlur = () => {
        const validatedValue = validateValue(value);
        setValue(validatedValue);
        updateNode(id, { outputs: [{ value: validatedValue }] });
    };

    // If custom input element provided, clone it with handlers
    let renderedInput;
    if (inputElement) {
        renderedInput = React.cloneElement(inputElement, {
            value: type === 'boolean' ? (value ? 'true' : 'false') : value,
            onChange: handleChange,
            onBlur: handleBlur
        });
    } else {
        // Default input element
        renderedInput = (
            <input
                type={type === 'float' ? 'number' : 'text'}
                step={type === 'float' ? '1' : undefined}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                className="node-input"
                style={{
                    width: type === 'float' ? '50%' : 80,
                    padding: "2px 4px",
                    fontSize: 13,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                }}
            />
        );
    }

    return (
        <div
            className="custom-node"
            style={{
                background: "#f0f0f0",
                border: `2px solid ${borderColor}`,
                padding: type === 'string' ? 6 : type === 'boolean' ? 10 : 10,
                borderRadius: 6,
                width: type === 'string' ? 'fit-content' : type === 'boolean' ? 'auto' : 'auto',
                minWidth: type === 'boolean' ? 120 : 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
            }}
            data-node-id={id}
        >
            {renderedInput}
            <CustomHandle
                id={outputId}
                className="node-handle"
                style={{
                    background: borderColor,
                    width: type === 'string' ? 10 : 12,
                    height: type === 'string' ? 10 : 12,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
                dataType="output"
            />
        </div>
    );
}
