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
        <div key={currentNode} className="d-flex flex-column justify-content-between" style={{ height: "100%" }}>
            <h3 className="mb-3">Parameters for {node.data.label}</h3>

            {/* --- PARAMÈTRES --- */}
            <div>
                {inputs.length > 0 && (
                    <>
                        <h6>Inputs:</h6>
                        <NodeInput
                            inputs={inputs}
                            onInputChange={handleInputChange}
                        />
                    </>
                )}

                {outputs.length > 0 && (
                    <>
                        <h6>Outputs:</h6>
                        <NodeOutput outputs={outputs} />
                    </>
                )}
            </div>

            {/* --- BOUTON LANCER --- */}
            <div className="d-flex justify-content-center mt-3">
                <button
                    className="btn btn-success"
                    onClick={handleLaunch}
                >
                    Lancer
                </button>
            </div>
        </div>
    );
}
