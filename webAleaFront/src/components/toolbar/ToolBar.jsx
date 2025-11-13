import React, { useState } from "react";
import ButtonToolBar from "./ButtonToolBar";
import { FaUpload, FaDownload, FaInfoCircle, FaPlay, FaStop } from "react-icons/fa";

export default function ToolBar() {

    const handleImport = () => alert("Import workflow");
    const handleExport = () => alert("Export workflow");
    const handleInfo = () => alert("Afficher les informations");
    const handleRun = () => alert("Exécution du workflow");
    const handleStop = () => alert("Arrêt du workflow");
    
    return (
    <div className="row mb-4 px-4">
        <div className="col-md-6 d-flex gap-2 mb-2 mb-md-0">
        <ButtonToolBar
            title="Import"
            icon={FaUpload}
            onClick={handleImport}
        />
        <ButtonToolBar
            title="Export"
            icon={FaDownload}
            onClick={handleExport}
        />
        <ButtonToolBar
            title="Info"
            icon={FaInfoCircle}
            onClick={handleInfo}
        />
        </div>

        <div className="col-md-6 d-flex gap-2 justify-content-md-end">
        <ButtonToolBar
            title="Run"
            icon={FaPlay}
            onClick={handleRun}
        />
        <ButtonToolBar
            title="Stop"
            icon={FaStop}
            onClick={handleStop}
        />
        </div>
    </div>
    );
}