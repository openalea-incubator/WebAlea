import React, { useState } from "react";
import NodeParameters from "./NodeParameters";
import NodeDescription from "./NodeDescription";
import NodeResultRender from "./NodeResultRender";

/**
 * NodeDetailSection component.
 * This component is used to display the detail section of the current node in the sidebar.
 * It contains the parameters, description and view tabs.
 * @returns {React.ReactNode} - The NodeDetailSection component.
 */
export default function NodeDetailSection() {
    /**
     * State to store the active tab.
     * @type {string}
     */
    const [activeTab, setActiveTab] = useState("parameters");

    /**
     * Function to render the content of the active tab.
     * @returns {React.ReactNode} - The content of the active tab.
     */
    const renderTabContent = () => {
        switch (activeTab) {
            case "parameters":
                return <NodeParameters />;
            case "desc":
                return <NodeDescription />;
            case "view":
                return <NodeResultRender />;
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
            {/* Tabs - fixed height */}
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

            {/* Content of the active tab - takes the remaining space */}
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
