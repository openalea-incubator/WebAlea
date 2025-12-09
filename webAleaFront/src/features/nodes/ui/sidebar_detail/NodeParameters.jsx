import React, { useState, useEffect } from "react";
import NodeInput from "../NodeInputs.jsx";
import NodeOutput from "../NodeOutputs.jsx";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

export default function NodeParameters() {
    const { currentNode, nodes, onNodeExecute, engine } = useFlow();
    const node = nodes.find(n => n.id === currentNode);

    const [inputs, setInputs] = useState(node ? node.data.inputs : []);
    const [outputs, setOutputs] = useState(node ? node.data.outputs : []);
    const [isChanged, setIsChanged] = useState(false);

    // Vérifie si tous les inputs sont remplis
    const checkAllInputsFilled = (arr) =>
        arr.every(input =>
            input.value !== null &&
            input.value !== undefined &&
            input.value !== ""
        );

    // Reset quand le node sélectionné change
    useEffect(() => {
        const newInputs = node?.data?.inputs ?? [];
        const newOutputs = node?.data?.outputs ?? [];

        setInputs(newInputs);
        setOutputs(newOutputs);

        // Vérifie dès le début si les inputs sont déjà remplis
        setIsChanged(checkAllInputsFilled(newInputs));
    }, [node]);

    // Quand un input change
    const handleInputChange = (name, value) => {

        setInputs(prev => {
            const updated = prev.map(input =>
                input.name === name ? { ...input, value } : input
            );

            setIsChanged(checkAllInputsFilled(updated));
            return updated;
        });

        console.log("Input changed:", name, value);
    };

    // Quand un output change
    const handleOutputChange = (name, value) => {
        setOutputs(prev => {
            const updated = prev.map(output =>
                output.name === name ? { ...output, value } : output
            );

            setIsChanged(false); // changer output annule la validation
            return updated;
        });
    };

    // Lancer l’exécution du node
    const handleLaunch = () => {
        console.log("Inputs :", inputs);
        onNodeExecute(node.id);
        setIsChanged(false);
    };

    // Aucun node sélectionné
    if (!node) {
        return <div className="p-3 bg-white rounded shadow-sm">No node selected.</div>;
    }

    return (
        <div className="d-flex flex-column justify-content-between" style={{ height: "100%" }}>
            <h3 className="mb-3">Parameters for {node.data.label}</h3>

            {/* --- PARAMÈTRES --- */}
            <div>
                {inputs.length > 0 && (
                    <>
                        <h6>Inputs:</h6>
                        <NodeInput inputs={inputs} />
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
                    disabled={!isChanged}
                    onClick={handleLaunch}
                >
                    Lancer
                </button>
            </div>
        </div>
    );
}
