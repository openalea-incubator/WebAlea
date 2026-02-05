import React, { useCallback, useState } from "react";
import NodeInput from "../NodeInputs.jsx";
import NodeOutput from "../NodeOutputs.jsx";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";
import { DataType, NodeType } from "../../../workspace/constants/workflowConstants.js";

/**
 * NodeParameters component.
 * This component is used to display the parameters of the current node in the sidebar.
 * It contains the inputs and outputs of the node.
 * @returns {React.ReactNode} - The NodeParameters component.
 */
export default function NodeParameters() {
    /**
     * State to store the current node.
     * @type {object}
     */
    const { currentNode, nodes, updateNode, onNodeExecute } = useFlow();
    /**
     * Node to display the parameters of.
     * @type {object}
     */
    const node = nodes.find(n => n.id === currentNode);
    /**
     * Inputs of the node.
     * @type {array}
     */
    const inputs = node ? node.data.inputs : [];
    /**
     * Outputs of the node.
     * @type {array}
     */
    const outputs = node ? node.data.outputs : [];
    const isArrayNode = node?.type === NodeType.ARRAY;
    const isDictNode = node?.type === NodeType.DICT;
    const isEnumNode = node?.type === NodeType.ENUM;
    const enumOutput = outputs?.[0] ?? null;
    const enumOptions = Array.isArray(enumOutput?.enumOptions) ? enumOutput.enumOptions : [];
    const enumValue = enumOutput?.value ?? "";
    const [enumOptionDraft, setEnumOptionDraft] = useState("");

    /**
     * Function to handle input value changes.
     * @param {string} inputId - The id of the input.
     * @param {any} newValue - The new value of the input.
     */
    const handleInputChange = useCallback((inputId, newValue) => {
        if (!node) return;

        const updatedInputs = inputs.map(input =>
            input.id === inputId ? { ...input, value: newValue } : input
        );

        updateNode(node.id, { inputs: updatedInputs });
    }, [node, inputs, updateNode]);


    /**
     * Function to launch the execution of the node.
     */
    const handleLaunch = () => {
        if (node) {
            onNodeExecute(node.id);
        }
    };

    const handleArrayInputNameChange = (inputId, newName) => {
        if (!node) return;
        const nextName = newName ?? "";
        let previousName = "";
        const updatedInputs = (inputs ?? []).map((input) => {
            if (input.id === inputId) {
                previousName = input.name || "";
                if (isDictNode && nextName.trim() === "") {
                    return input;
                }
                return { ...input, name: nextName };
            }
            return input;
        });
        const updatedData = { inputs: updatedInputs };
        updateNode(node.id, updatedData);
    };

    const handleArrayInputTypeChange = (inputId, newType) => {
        if (!node) return;
        const updatedInputs = (inputs ?? []).map((input) =>
            input.id === inputId ? { ...input, type: newType } : input
        );
        updateNode(node.id, { inputs: updatedInputs });
    };

    const handleArrayInputRemove = (inputId) => {
        if (!node) return;
        const updatedInputs = (inputs ?? []).filter((input) => input.id !== inputId);
        const updatedData = { inputs: updatedInputs };
        updateNode(node.id, updatedData);
    };

    const handleArrayInputAdd = () => {
        if (!node) return;
        const nextIndex = (inputs?.length ?? 0) + 1;
        const defaultName = isDictNode
            ? `Key ${nextIndex}`
            : `Input ${nextIndex}`;
        const newInput = {
            id: `arr_in_${node.id}_${Date.now()}`,
            name: defaultName,
            type: DataType.ANY,
            value: null
        };
        const updatedInputs = [...(inputs ?? []), newInput];
        const updatedData = { inputs: updatedInputs };
        updateNode(node.id, updatedData);
    };

    const updateEnumOutput = (nextOptions, nextValue) => {
        if (!node) return;
        const outputId = enumOutput?.id ?? `out-${node.id}-0`;
        const safeOptions = Array.isArray(nextOptions) ? nextOptions : [];
        const safeValue = safeOptions.includes(nextValue) ? nextValue : (safeOptions[0] ?? "");
        updateNode(node.id, {
            outputs: [{
                ...(enumOutput || {}),
                id: outputId,
                type: DataType.ENUM,
                enumOptions: safeOptions,
                value: safeValue
            }]
        });
    };

    const handleEnumAddOption = () => {
        const next = enumOptionDraft.trim();
        if (!next) return;
        if (enumOptions.includes(next)) {
            setEnumOptionDraft("");
            return;
        }
        const nextOptions = [...enumOptions, next];
        const nextValue = enumValue || next;
        updateEnumOutput(nextOptions, nextValue);
        setEnumOptionDraft("");
    };

    const handleEnumRemoveOption = (option) => {
        const nextOptions = enumOptions.filter((opt) => opt !== option);
        const nextValue = enumValue === option ? (nextOptions[0] ?? "") : enumValue;
        updateEnumOutput(nextOptions, nextValue);
    };

    const handleEnumValueChange = (nextValue) => {
        updateEnumOutput(enumOptions, nextValue);
    };

    /**
     * If no node is selected, return a message.
     * @returns {React.ReactNode} - The message.
     */
    if (!node) {
        return <div className="p-3 bg-white rounded shadow-sm">No node selected.</div>;
    }

    return (
        <div
            key={currentNode}
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {/* Header - fixed height */}
            <div
                style={{
                    flexShrink: 0,
                    padding: "12px",
                    borderBottom: "1px solid #eee",
                }}
            >
                <h6 style={{ margin: 0, fontSize: "0.95rem" }}>
                    {node.data.label}
                </h6>
            </div>

            {/* --- PARAMETERS with scrollbox --- */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "12px",
                }}
            >
                {!isArrayNode && !isDictNode && inputs.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                        <h6 style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
                            Inputs ({inputs.length})
                        </h6>
                        <NodeInput
                            inputs={inputs}
                            onInputChange={handleInputChange}
                        />
                    </div>
                )}


                {outputs.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                        <h6 style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
                            Outputs ({outputs.length})
                        </h6>
                        <NodeOutput outputs={outputs} />
                    </div>
                )}

                {isArrayNode && (
                    <div style={{ marginBottom: "16px" }}>
                        <h6 style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
                            Array Inputs ({inputs.length})
                        </h6>
                        <div className="d-flex flex-column gap-2">
                            {(inputs ?? []).map((input, idx) => (
                                <div key={input.id || `array-input-${idx}`} className="d-flex gap-2 align-items-center">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={input.name || ""}
                                        onChange={(e) => handleArrayInputNameChange(input.id, e.target.value)}
                                        placeholder={`Input ${idx + 1}`}
                                    />
                                    <select
                                        className="form-select form-select-sm"
                                        value={input.type || DataType.ANY}
                                        onChange={(e) => handleArrayInputTypeChange(input.id, e.target.value)}
                                    >
                                        <option value={DataType.ANY}>any</option>
                                        <option value={DataType.FLOAT}>float</option>
                                        <option value={DataType.STRING}>string</option>
                                        <option value={DataType.BOOLEAN}>boolean</option>
                                        <option value={DataType.ARRAY}>array</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleArrayInputRemove(input.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm align-self-start"
                                onClick={handleArrayInputAdd}
                            >
                                Add Input
                            </button>
                        </div>
                    </div>
                )}

                {isDictNode && (
                    <div style={{ marginBottom: "16px" }}>
                        <h6 style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
                            Dict Entries ({inputs.length})
                        </h6>
                        <div className="d-flex flex-column gap-2">
                            {(inputs ?? []).map((input, idx) => (
                                <div key={input.id || `dict-input-${idx}`} className="d-flex gap-2 align-items-center">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={input.name || ""}
                                        onChange={(e) => handleArrayInputNameChange(input.id, e.target.value)}
                                        placeholder={`Key ${idx + 1}`}
                                    />
                                    <select
                                        className="form-select form-select-sm"
                                        value={input.type || DataType.ANY}
                                        onChange={(e) => handleArrayInputTypeChange(input.id, e.target.value)}
                                    >
                                        <option value={DataType.ANY}>any</option>
                                        <option value={DataType.FLOAT}>float</option>
                                        <option value={DataType.STRING}>string</option>
                                        <option value={DataType.BOOLEAN}>boolean</option>
                                        <option value={DataType.ARRAY}>array</option>
                                        <option value={DataType.ENUM}>enum</option>
                                        <option value={DataType.OBJECT}>object</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleArrayInputRemove(input.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm align-self-start"
                                onClick={handleArrayInputAdd}
                            >
                                Add Entry
                            </button>
                        </div>
                    </div>
                )}

                {isEnumNode && (
                    <div style={{ marginBottom: "16px" }}>
                        <h6 style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
                            Enum Options ({enumOptions.length})
                        </h6>

                        <div className="d-flex gap-2 mb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="New option"
                                value={enumOptionDraft}
                                onChange={(e) => setEnumOptionDraft(e.target.value)}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleEnumAddOption}
                            >
                                Add Option
                            </button>
                        </div>

                        {enumOptions.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                                <select
                                    className="form-select form-select-sm"
                                    value={enumValue || enumOptions[0]}
                                    onChange={(e) => handleEnumValueChange(e.target.value)}
                                >
                                    {enumOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                {enumOptions.map((opt) => (
                                    <div key={`enum-opt-${opt}`} className="d-flex align-items-center gap-2">
                                        <span className="small">{opt}</span>
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleEnumRemoveOption(opt)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted small">No options yet</div>
                        )}
                    </div>
                )}

            </div>

            {/* --- LAUNCH BUTTON - fixed height --- */}
            <div
                style={{
                    flexShrink: 0,
                    padding: "12px",
                    borderTop: "1px solid #eee",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <button
                    className="btn btn-success btn-sm"
                    onClick={handleLaunch}
                    style={{ width: "100%" }}
                >
                    Launch
                </button>
            </div>
        </div>
    );
}
