import React, { useState, useEffect } from "react";
import NodeInput from "./NodeInputs";
import NodeOutput from "./NodeOutputs";
import { useFlow } from '../../providers/FlowContextDefinition.jsx';

export default function NodeParameters() {
    const { currentNode } = useFlow();
    // Data d'exemple pour le modele static
    const [inputs, setInputs] = useState(currentNode ? currentNode.inputs : [])
    const [outputs, setOutputs] = useState(currentNode ? currentNode.outputs : [])

    const [isChanged, setIsChanged] = useState(false); // Bouton "lancer" Réactif

    useEffect(() => {
    setInputs(currentNode?.inputs ?? []);
    setOutputs(currentNode?.outputs ?? []);
    setIsChanged(false); // reset du bouton
}, [currentNode]);


    // Fonction passer aux inputs enfants pour leurs permettre de mettre à jour leur valeur dans la liste au dessus
    const handleInputChange = (name, value) => {
    setInputs((prev) =>
        // On se place sur notre input ayant déclenché l'event, et on modifie la value tout en gardant les autres propriétés
        prev.map((input) => (input.name === name ? { ...input, value } : input)) 
    );
    setIsChanged(true); // active le bouton Lancer
    console.log("Input changed:", name, value);
    };

    const handleOutputChange = (name, value) => {
    setOutputs((prev) =>
        // On se place sur notre output ayant déclenché l'event, et on modifie la value tout en gardant les autres propriétés
        prev.map((output) => (output.name === name ? { ...output, value } : output)) 
    );
    setIsChanged(false);
}

    const handleLaunch = () => {
    console.log("Inputs :", inputs);
    // Traitements... TODO
    setIsChanged(false); // désactive le bouton
    };
    if (!currentNode) {
        return <div className="p-3 bg-white rounded shadow-sm">No node selected.</div>;
    }
    else {
        return (
        <div className="d-flex flex-column justify-content-between" style={{ height: "100%" }}>
        {/* Contenu en haut */}
        <div>
            <NodeInput inputs={inputs} onValueChange={handleInputChange} />
            <NodeOutput outputs={outputs} onValueChange={handleOutputChange} />
        </div>

        {/* Bouton centré en bas */}
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
}
