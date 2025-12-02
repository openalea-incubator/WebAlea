import React, { useState, useEffect } from "react";
import NodeInput from "../NodeInputs.jsx";
import NodeOutput from "../NodeOutputs.jsx";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";
import { WorkflowEngine } from "../../../workspace/engine/WorkflowEngine.jsx";

export default function NodeParameters() {
    const { currentNode, nodes, onNodeExecute, bindEngine, addLog } = useFlow();
    const node = nodes.find(n => n.id === currentNode);
    
    const [inputs, setInputs] = useState(node ? node.data.inputs : [])
    const [outputs, setOutputs] = useState(node ? node.data.outputs : [])

    const [isChanged, setIsChanged] = useState(false); // Bouton "lancer" Réactif
    const checkAllInputsFilled = () => {
            return inputs.every(input => input.value !== null && input.value !== undefined && input.value !== '');
        }

    // Partie Engine
    const engine = new WorkflowEngine(node);
    bindEngine(engine);
    engine.onUpdate((event, payload) => {
    console.log(`Engine event: ${event}`, { payload });
    });


    useEffect(() => {
        setInputs(node?.data.inputs ?? []);
        setOutputs(node?.data.outputs ?? []);
        setIsChanged(checkAllInputsFilled()); // reset du bouton
}, [node]);

    // Fonction passer aux inputs enfants pour leurs permettre de mettre à jour leur valeur dans la liste au dessus
    const handleInputChange = (name, value) => {
    setInputs((prev) =>
        // On se place sur notre input ayant déclenché l'event, et on modifie la value tout en gardant les autres propriétés
        prev.map((input) => (input.name === name ? { ...input, value } : input)) 
    );
    setIsChanged(checkAllInputsFilled()); // active le bouton Lancer
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
    onNodeExecute(node.id, engine);
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
            <div className="mt-3">
                <strong>Result : </strong>
                <span>{node.data.result !== undefined ? node.data.result.toString() : "N/A"}</span>
            </div>
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
