import React from "react";
import { useFlow } from '../../providers/FlowContextDefinition.jsx';

export default function NodeDescription() {
    const { currentNode } = useFlow();
    if (!currentNode) {
        return <div className="p-3 bg-white rounded shadow-sm">No node selected.</div>;
    }
    else {
        return (
        <div className="p-3 bg-white rounded shadow-sm">
            <h5 className="mb-3">Node Details</h5>

            {/* Nom */}
            <div className="mb-2">
            <strong>Nom :</strong> {currentNode.data.label}
            </div>

            {/* Entrées */}
            <div className="mb-2">
            <strong>Entrées ({currentNode.inputs.length}) :</strong>
            <ul className="list-group list-group-flush mt-1">
                {currentNode.inputs.map((input) => (
                <li key={input.name} className="list-group-item p-1">
                    {input.name} <span className="text-muted">({input.type})</span>
                </li>
                ))}
            </ul>
            </div>

            {/* Sorties */}
            <div className="mb-2">
            <strong>Sorties ({currentNode.outputs.length}) :</strong>
            <ul className="list-group list-group-flush mt-1">
                {currentNode.outputs.map((output) => (
                <li key={output.name} className="list-group-item p-1">
                    {output.name} <span className="text-muted">({output.type})</span>
                </li>
                ))}
            </ul>
            </div>

            {/* Status */}
            <div className="mt-3">
            <strong>Status :</strong>{" "}
            <span className={`badge ${currentNode.data.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                {currentNode.data.status}
            </span>
            </div>
        </div>
        );
    }
}