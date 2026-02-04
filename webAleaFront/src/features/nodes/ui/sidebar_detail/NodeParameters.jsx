import React, { useCallback, useMemo } from "react";
import NodeInput from "../NodeInputs.jsx";
import NodeOutput from "../NodeOutputs.jsx";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

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
    const isArrayNode = node?.type === "array";
    const arrayOutput = useMemo(() => {
        if (!isArrayNode) return null;
        return outputs?.[0] ?? null;
    }, [isArrayNode, outputs]);
    const arrayValue = Array.isArray(arrayOutput?.value) ? arrayOutput.value : [];

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

    const updateArrayValue = (nextArray) => {
        if (!node) return;
        const updatedOutputs = (outputs ?? []).map((out, idx) => {
            if (idx !== 0) return out;
            return { ...out, value: nextArray, type: out.type || "array" };
        });
        updateNode(node.id, { outputs: updatedOutputs });
    };

    const handleArrayItemChange = (index, newValue) => {
        const next = [...arrayValue];
        next[index] = newValue;
        updateArrayValue(next);
    };

    const handleArrayItemRemove = (index) => {
        const next = arrayValue.filter((_, i) => i !== index);
        updateArrayValue(next);
    };

    const handleArrayItemAdd = () => {
        const next = [...arrayValue, ""];
        updateArrayValue(next);
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
                {inputs.length > 0 && (
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
                            Array Items ({arrayValue.length})
                        </h6>
                        <div className="d-flex flex-column gap-2">
                            {arrayValue.map((item, idx) => (
                                <div key={`array-item-${idx}`} className="d-flex gap-2 align-items-center">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={item}
                                        onChange={(e) => handleArrayItemChange(idx, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleArrayItemRemove(idx)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm align-self-start"
                                onClick={handleArrayItemAdd}
                            >
                                Add Item
                            </button>
                        </div>
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
