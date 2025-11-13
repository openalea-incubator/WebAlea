import React, { useState } from "react";
import NodeParameters from "./NodeParameters"; // ton composant existant
import NodeDescription from "./NodeDescription";

export default function NodeDetailSection() {
    const [activeTab, setActiveTab] = useState("parameters");

    const renderTabContent = () => {
    switch (activeTab) {
        case "parameters":
        return <NodeParameters />;
        case "desc":
            return <NodeDescription />;
        case "view":
        return (
            <div>
            <p>Vue / preview ici...</p>
            </div>
        );
        default:    
        return null;
    }
    };

    return (
    <div className="container-fluid">
        {/* Onglets */}
        <div className="d-flex justify-content-center mb-3 gap-2">
        <button
            className={`btn ${activeTab === "parameters" ? "btn-dark" : ""}`}
            onClick={() => setActiveTab("parameters")}
        >
            Parameters
        </button>
        <button
            className={`btn ${activeTab === "desc" ? "btn-dark" : ""}`}
            onClick={() => setActiveTab("desc")}
        >
            Description
        </button>
        <button
            className={`btn ${activeTab === "view" ? "btn-dark" : ""}`}
            onClick={() => setActiveTab("view")}
        >
            View
        </button>
        </div>

        {/* Contenu de l’onglet actif */}
        <div className="p-2">
        {renderTabContent()}
        </div>
    </div>
    );
}
