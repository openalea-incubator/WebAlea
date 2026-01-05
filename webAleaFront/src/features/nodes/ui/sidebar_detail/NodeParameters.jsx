import React, { useState, useCallback } from "react";
import NodeInput from "../NodeInputs.jsx";
import NodeOutput from "../NodeOutputs.jsx";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

export default function NodeParameters() {

    const { currentNode, nodes, updateNode, onNodeExecute } = useFlow();
    const node = nodes.find(n => n.id === currentNode);
    const inputs = node ? node.data.inputs : [];
    const outputs = node ? node.data.outputs : [];
    const [isChanged, setIsChanged] = useState(false);

    // Handle input value changes
    const handleInputChange = useCallback((inputId, newValue) => {
        if (!node) return;

        const updatedInputs = inputs.map(input =>
            input.id === inputId ? { ...input, value: newValue } : input
        );

        updateNode(node.id, { inputs: updatedInputs });
        setIsChanged(true);
    }, [node, inputs, updateNode]);

    // Lancer l'exécution du node
    const handleLaunch = () => {
        if (node) {
            console.log("Executing node with inputs:", inputs);
            onNodeExecute(node.id);
            setIsChanged(false);
        }
    };

    // Aucun node sélectionné
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
            {/* Header - hauteur fixe */}
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

            {/* --- PARAMÈTRES avec scrollbox --- */}
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
            </div>

            {/* --- BOUTON LANCER - hauteur fixe --- */}
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
                    Lancer
                </button>
            </div>
        </div>
    );
}
