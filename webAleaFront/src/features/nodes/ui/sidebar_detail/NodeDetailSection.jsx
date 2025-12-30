import React, { useState } from "react";
import NodeParameters from "./NodeParameters";
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
                    <div style={{ padding: "12px" }}>
                        <p>Vue / preview ici...</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {/* Onglets - hauteur fixe */}
            <div
                style={{
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    borderBottom: "1px solid #e0e0e0",
                }}
            >
                <button
                    className={`btn btn-sm ${activeTab === "parameters" ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setActiveTab("parameters")}
                >
                    Parameters
                </button>
                <button
                    className={`btn btn-sm ${activeTab === "desc" ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setActiveTab("desc")}
                >
                    Description
                </button>
                <button
                    className={`btn btn-sm ${activeTab === "view" ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setActiveTab("view")}
                >
                    View
                </button>
            </div>

            {/* Contenu de l'onglet actif - prend tout l'espace restant */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                {renderTabContent()}
            </div>
        </div>
    );
}
