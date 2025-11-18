import { useState } from "react";
import ButtonToolBar from "./ButtonToolBar";
import ImportModal from "../visualizer/ImportModal";
import { FaUpload, FaDownload, FaInfoCircle, FaPlay, FaStop } from "react-icons/fa";

export default function ToolBar() {
    const [showImportModal, setShowImportModal] = useState(false);
    const [importedData, setImportedData] = useState(null);

    const handleImportClick = () => setShowImportModal(true);
    const handleImportClose = () => setShowImportModal(false);

    const handleImportData = (data) => {
    setImportedData(data); // stocke les données importées
    setShowImportModal(false);
    console.log("Workflow importé :", data); // ou traitement du workflow
    };

    const handleExport = () => alert("Export workflow");
    const handleInfo = () => alert("Afficher les informations");
    const handleRun = () => alert("Exécution du workflow");
    const handleStop = () => alert("Arrêt du workflow");

    return (
    <>
        <div className="row mb-4 px-4">
        <div className="col-md-6 d-flex gap-2 mb-2 mb-md-0">
            <ButtonToolBar icon={FaUpload} onClick={handleExport} />
            <ButtonToolBar icon={FaDownload} onClick={handleImportClick} />
            <ButtonToolBar icon={FaInfoCircle} onClick={handleInfo} />
        </div>

        <div className="col-md-6 d-flex gap-2 justify-content-md-end">
            <ButtonToolBar icon={FaPlay} onClick={handleRun} />
            <ButtonToolBar icon={FaStop} onClick={handleStop} />
        </div>
        </div>

        <ImportModal
        show={showImportModal}
        onClose={handleImportClose}
        onImport={handleImportData}
        />
    </>
    );
}
