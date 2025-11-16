import React, { useState } from "react";
import NodeInput from "./NodeInputs";
import NodeOutput from "./NodeOutputs";

export default function NodeParameters() {
    // Data d'exemple pour le modele static
    const [inputs, setInputs] = useState([
    { name: "Threshold", type: "float", value: "" },
    { name: "EnableFeature", type: "boolean", value: false },
    { name: "Label", type: "string", value: "" },
    ]);

    const [outputs, setOutputs] = useState([
    { name: "Result", value: "" },
    ]);

    const [isChanged, setIsChanged] = useState(false); // Bouton "lancer" Réactif

    // Fonction passer aux inputs enfants pour leurs permettre de mettre à jour leur valeur dans la liste au dessus
    const handleInputChange = (name, value) => {
    setInputs((prev) =>
        // On se place sur notre input ayant déclenché l'event, et on modifie la value tout en gardant les autres propriétés
        prev.map((input) => (input.name === name ? { ...input, value } : input)) 
    );
    setIsChanged(true); // active le bouton Lancer
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
