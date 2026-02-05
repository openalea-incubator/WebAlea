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
import { NodeType, DataType, DefaultValues, INDEX } from "../../constants/workflowConstants.js";

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
            case NodeType.FLOAT:
                return DefaultValues.FLOAT;
            case NodeType.STRING:
                return DefaultValues.STRING;
            case NodeType.BOOLEAN:
                return DefaultValues.BOOLEAN;
            case NodeType.DICT:
                return DefaultValues.DICT;
            default:
                return null;
        }
    };

    const initialValue = data.outputs?.[INDEX.DEFAULT_OUTPUT]?.value ?? getDefaultValue();
    const initialOutputId = data.outputs?.[INDEX.DEFAULT_OUTPUT]?.id ?? `out-${id}-${INDEX.DEFAULT_OUTPUT}`;

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

    // Style constants
    const STYLE_CONSTANTS = {
        PADDING_STRING: 6,
        PADDING_DEFAULT: 10,
        MIN_WIDTH_BOOLEAN: 120,
        HANDLE_SIZE_SMALL: 10,
        HANDLE_SIZE_DEFAULT: 12,
        INPUT_WIDTH_FLOAT: '50%',
        INPUT_WIDTH_DEFAULT: 80
    };

    const isStringType = type === NodeType.STRING;
    const isBooleanType = type === NodeType.BOOLEAN;
    const isFloatType = type === NodeType.FLOAT;

    // If custom input element provided, clone it with handlers
    let renderedInput;
    if (inputElement) {
        renderedInput = React.cloneElement(inputElement, {
            value: isBooleanType ? (value ? 'true' : 'false') : value,
            onChange: handleChange,
            onBlur: handleBlur
        });
    } else {
        // Default input element
        renderedInput = (
            <input
                type={isFloatType ? 'number' : 'text'}
                step={isFloatType ? '1' : undefined}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                className="node-input"
                style={{
                    width: isFloatType ? STYLE_CONSTANTS.INPUT_WIDTH_FLOAT : STYLE_CONSTANTS.INPUT_WIDTH_DEFAULT,
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
                padding: isStringType ? STYLE_CONSTANTS.PADDING_STRING : STYLE_CONSTANTS.PADDING_DEFAULT,
                borderRadius: 6,
                width: isStringType ? 'fit-content' : 'auto',
                minWidth: isBooleanType ? STYLE_CONSTANTS.MIN_WIDTH_BOOLEAN : 'auto',
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
                    width: isStringType ? STYLE_CONSTANTS.HANDLE_SIZE_SMALL : STYLE_CONSTANTS.HANDLE_SIZE_DEFAULT,
                    height: isStringType ? STYLE_CONSTANTS.HANDLE_SIZE_SMALL : STYLE_CONSTANTS.HANDLE_SIZE_DEFAULT,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    cursor: "pointer",
                }}
                dataType="output"
            />
        </div>
    );
}
