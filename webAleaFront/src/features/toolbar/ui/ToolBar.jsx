import { useState } from "react";
import ButtonToolBar from "./ButtonToolBar";
import ImportModal from "../model/ImportModal";
import { FaUpload, FaDownload, FaInfoCircle, FaPlay, FaStop } from "react-icons/fa";
import { useFlow } from "../../providers/FlowContextDefinition";
import { useLog } from "../../providers/LogContextDefinition";

export default function ToolBar() {
    const [showImportModal, setShowImportModal] = useState(false);
    const { setNodesAndEdges, nodes, edges } = useFlow();

    const handleImportClick = () => setShowImportModal(true);
    const handleImportClose = () => setShowImportModal(false);

    const { addLog } = useLog();

    const handleImportData = (data) => {
        try {
            if (!data.nodes || !data.edges) {
                throw new Error("Données invalides : noeuds ou connexions manquants.");
            }
            else {
                console.log("Importing workflow...", data);
                setNodesAndEdges(data.nodes || [], data.edges || []);
                setShowImportModal(false);
                console.log("Workflow importé :", data); // ou traitement du workflow
                addLog("Workflow imported", { nodes: data.nodes.length, edges: data.edges.length });
            }
        }
        catch(error) {
            alert("Erreur lors de l'importation du workflow : " + error.message);
        }
    };

    const handleExport = () => {
        const data = {
            nodes: nodes,
            edges: edges  
        };
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "workflow_export.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            addLog("Workflow exported", { nodes: nodes.length, edges: edges.length });
        } catch (error) {
            alert("Erreur lors de l'exportation du workflow : " + error.message);
        }
    };

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
