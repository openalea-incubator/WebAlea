/**
 * ToolBar.jsx
 *
 * Barre d'outils améliorée avec support du WorkflowEngine.
 *
 * Fonctionnalités:
 * - Exécution asynchrone du workflow complet
 * - Barre de progression
 * - Indicateur d'état
 * - Validation avant exécution
 */

import { useState } from "react";
import ButtonToolBar from "./ButtonToolBar.jsx";
import ImportModal from "../model/ImportModal.jsx";
import {
    FaUpload,
    FaDownload,
    FaInfoCircle,
    FaPlay,
    FaStop,
    FaSpinner,
    FaCheckCircle,
    FaExclamationTriangle
} from "react-icons/fa";
import { useFlow } from "../../workspace/providers/FlowContextDefinition.jsx";
import { useLog } from "../../logger/providers/LogContextDefinition.jsx";

/**
 * Composant de barre de progression
 */
function ProgressBar({ progress, status }) {
    const getBarColor = () => {
        switch (status) {
            case 'running': return '#007bff';
            case 'completed': return '#28a745';
            case 'failed': return '#dc3545';
            case 'stopped': return '#6c757d';
            default: return '#007bff';
        }
    };

    if (status === 'idle') return null;

    return (
        <div className="d-flex align-items-center gap-2 mx-3" style={{ minWidth: '200px' }}>
            <div
                className="progress flex-grow-1"
                style={{ height: '8px', backgroundColor: '#e9ecef' }}
            >
                <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                        width: `${progress.percent}%`,
                        backgroundColor: getBarColor(),
                        transition: 'width 0.3s ease'
                    }}
                />
            </div>
            <small className="text-muted" style={{ minWidth: '80px' }}>
                {progress.completed}/{progress.total}
                {progress.failed > 0 && (
                    <span className="text-danger ms-1">({progress.failed} err)</span>
                )}
            </small>
        </div>
    );
}

/**
 * Indicateur d'état
 */
function StatusIndicator({ status }) {
    const getIcon = () => {
        switch (status) {
            case 'running':
                return <FaSpinner className="fa-spin text-primary" />;
            case 'completed':
                return <FaCheckCircle className="text-success" />;
            case 'failed':
            case 'validation-error':
                return <FaExclamationTriangle className="text-danger" />;
            case 'stopped':
                return <FaStop className="text-secondary" />;
            default:
                return null;
        }
    };

    const getText = () => {
        switch (status) {
            case 'running': return 'Exécution...';
            case 'completed': return 'Terminé';
            case 'failed': return 'Erreur';
            case 'validation-error': return 'Validation échouée';
            case 'stopped': return 'Arrêté';
            default: return '';
        }
    };

    if (status === 'idle') return null;

    return (
        <div className="d-flex align-items-center gap-1 mx-2">
            {getIcon()}
            <small className="text-muted">{getText()}</small>
        </div>
    );
}

export default function ToolBar() {
    const [showImportModal, setShowImportModal] = useState(false);
    const {
        setNodesAndEdges,
        nodes,
        edges,
        executeWorkflow,
        stopWorkflow,
        executionStatus,
        executionProgress
    } = useFlow();

    const { addLog } = useLog();

    const isRunning = executionStatus === 'running';

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleImportClick = () => setShowImportModal(true);
    const handleImportClose = () => setShowImportModal(false);

    const handleImportData = (data) => {
        try {
            if (!data.nodes || !data.edges) {
                throw new Error("Données invalides : noeuds ou connexions manquants.");
            }
            setNodesAndEdges(data.nodes || [], data.edges || []);
            setShowImportModal(false);
            addLog("Workflow imported", {
                nodes: data.nodes.length,
                edges: data.edges.length
            });
        } catch (error) {
            alert("Erreur lors de l'importation du workflow : " + error.message);
        }
    };

    const handleExport = () => {
        const data = { nodes, edges };
        try {
            const dataStr = "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(data, null, 2));
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

    const handleInfo = () => {
        const customNodes = nodes.filter(n => n.type === 'custom');
        const primitiveNodes = nodes.filter(n => n.type !== 'custom');

        alert(
            `Workflow Info:\n` +
            `- ${customNodes.length} nodes OpenAlea\n` +
            `- ${primitiveNodes.length} nodes primitifs\n` +
            `- ${edges.length} connexions\n\n` +
            `Status: ${executionStatus}`
        );
    };

    const handleRun = async () => {
        if (isRunning) {
            console.warn("Workflow already running");
            return;
        }

        if (nodes.length === 0) {
            alert("Le workflow est vide. Ajoutez des nodes avant d'exécuter.");
            return;
        }

        addLog("Starting workflow execution...", {
            nodes: nodes.length,
            edges: edges.length
        });

        try {
            const result = await executeWorkflow();

            if (result.success) {
                addLog("Workflow execution completed successfully", {
                    resultCount: Object.keys(result.results || {}).length
                });
            } else {
                addLog("Workflow execution failed", {
                    error: result.error,
                    errors: result.errors
                });
            }
        } catch (error) {
            console.error("Workflow execution error:", error);
            addLog("Workflow execution error: " + error.message, { error });
        }
    };

    const handleStop = () => {
        if (!isRunning) {
            console.warn("Workflow not running");
            return;
        }

        addLog("Stopping workflow...");
        stopWorkflow();
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <>
            <div className="row mb-4 px-4 align-items-center">
                {/* Boutons gauche: Export/Import/Info */}
                <div className="col-md-4 d-flex gap-2 mb-2 mb-md-0">
                    <ButtonToolBar
                        icon={FaUpload}
                        onClick={handleExport}
                        disabled={isRunning}
                        title="Exporter le workflow"
                    />
                    <ButtonToolBar
                        icon={FaDownload}
                        onClick={handleImportClick}
                        disabled={isRunning}
                        title="Importer un workflow"
                    />
                    <ButtonToolBar
                        icon={FaInfoCircle}
                        onClick={handleInfo}
                        title="Informations"
                    />
                </div>

                {/* Centre: Progression et état */}
                <div className="col-md-4 d-flex justify-content-center align-items-center">
                    <ProgressBar
                        progress={executionProgress}
                        status={executionStatus}
                    />
                    <StatusIndicator status={executionStatus} />
                </div>

                {/* Boutons droite: Run/Stop */}
                <div className="col-md-4 d-flex gap-2 justify-content-md-end">
                    <ButtonToolBar
                        icon={isRunning ? FaSpinner : FaPlay}
                        onClick={handleRun}
                        disabled={isRunning || nodes.length === 0}
                        title={isRunning ? "Exécution en cours..." : "Exécuter le workflow"}
                        className={isRunning ? "fa-spin" : ""}
                        variant={isRunning ? "secondary" : "primary"}
                    />
                    <ButtonToolBar
                        icon={FaStop}
                        onClick={handleStop}
                        disabled={!isRunning}
                        title="Arrêter l'exécution"
                        variant="danger"
                    />
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
