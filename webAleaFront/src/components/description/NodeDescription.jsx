import React from "react";

export default function NodeDescription() {
     // Exemple statique
    const nodeInfo = {
    name: "Example Node",
    inputs: [
        { name: "Threshold", type: "float" },
        { name: "EnableFeature", type: "boolean" },
    ],
    outputs: [
        { name: "Result", type: "float" },
    ],
    status: "Active",
    };

    return (
    <div className="p-3 bg-white rounded shadow-sm">
        <h5 className="mb-3">Node Details</h5>

        {/* Nom */}
        <div className="mb-2">
        <strong>Nom :</strong> {nodeInfo.name}
        </div>

        {/* Entrées */}
        <div className="mb-2">
        <strong>Entrées ({nodeInfo.inputs.length}) :</strong>
        <ul className="list-group list-group-flush mt-1">
            {nodeInfo.inputs.map((input) => (
            <li key={input.name} className="list-group-item p-1">
                {input.name} <span className="text-muted">({input.type})</span>
            </li>
            ))}
        </ul>
        </div>

        {/* Sorties */}
        <div className="mb-2">
        <strong>Sorties ({nodeInfo.outputs.length}) :</strong>
        <ul className="list-group list-group-flush mt-1">
            {nodeInfo.outputs.map((output) => (
            <li key={output.name} className="list-group-item p-1">
                {output.name} <span className="text-muted">({output.type})</span>
            </li>
            ))}
        </ul>
        </div>

        {/* Status */}
        <div className="mt-3">
        <strong>Status :</strong>{" "}
        <span className={`badge ${nodeInfo.status === "Active" ? "bg-success" : "bg-secondary"}`}>
            {nodeInfo.status}
        </span>
        </div>
    </div>
    );
}
