import React, { useState, useEffect } from "react";
import NodeInput from "../NodeInputs.jsx";
import NodeOutput from "../NodeOutputs.jsx";
import { useFlow } from '../../providers/FlowContextDefinition.jsx';

export default function NodeParameters() {
    const { currentNode, nodes } = useFlow();
    const node = nodes.find(n => n.id === currentNode);
    // Data d'exemple pour le modele static
    const [inputs, setInputs] = useState(node ? node.data.inputs : [])
    const [outputs, setOutputs] = useState(node ? node.data.outputs : [])

    const [isChanged, setIsChanged] = useState(false); // Bouton "lancer" Réactif

    useEffect(() => {
        setInputs(node?.data.inputs ?? []);
        setOutputs(node?.data.outputs ?? []);
        setIsChanged(false); // reset du bouton
}, [node]);


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
    if (!node) {
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
