import React, { useState } from "react";

export default function NodeDetailSection() {
    const [activeTab, setActiveTab] = useState("parameters");

    return(
        <div className="container-fluid">
            <div className="container-fluid d-flex justify-content-center align-items-center">
                <div onClick={() => setActiveTab("parameters")} className="container justify-content-center align-items-center">
                    <h6 className="text-center">Parameters</h6>
                </div>
                <div  onClick={() => setActiveTab("desc")} className="container justify-content-center align-items-center">
                    <h6 className="text-center">Description</h6>
                </div>
                <div onClick={() => setActiveTab("view")} className="container justify-content-center align-items-center">
                    <h6 className="text-center">View</h6>
                </div>
            </div>
        </div>
    );
}

