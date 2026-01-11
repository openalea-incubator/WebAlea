/**
 * ToolBar.jsx
 *
 * Enhanced toolbar with WorkflowEngine support.
 *
 * Features:
 *  - Asynchronous execution of the full workflow
 *  - Progress bar with counts and error indicator
 *  - Status indicator (running, completed, failed, stopped)
 *  - Validation before execution
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
 * Progress Bar Component
 * Displays the progress of workflow execution.
 *
 * @param {object} progress - Progress object with percent, completed, total, failed
 * @param {string} status - Current execution status
 * @returns {React.ReactNode} - Progress bar element
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
 * Status Indicator Component
 * Displays the current status of workflow execution.
 *
 * @param {string} status - Current execution status
 * @returns {React.ReactNode} - Status indicator element
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

/**
 * ToolBar Component
 * Main toolbar with enhanced workflow execution features.
 *
 * @returns {React.ReactNode} - The ToolBar component.
 */
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
                throw new Error("Invalid workflow data: missing nodes or edges");
            }
            setNodesAndEdges(data.nodes || [], data.edges || []);
            setShowImportModal(false);
            addLog("Workflow imported", {
                nodes: data.nodes.length,
                edges: data.edges.length
            });
        } catch (error) {
            alert("Error importing workflow: " + error.message);
        }
    };

    /**
     * Handle Export. Exports the current workflow as a JSON file.
     */
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

    /**
     * Handle Info. Displays information about the current workflow.
     */
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

    /**
     * Handle Run. Validates and executes the workflow asynchronously.
     */
    const handleRun = async () => {
        if (isRunning) {
            console.warn("Workflow already running");
            return;
        }

        if (nodes.length === 0) {
            alert("Cannot run an empty workflow");
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

    /**
     * Handle Stop. Stops the currently running workflow.
     */
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
                {/* Left Button : Export/Import/Info */}
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

                {/* Center: Progress Bar & Status */}
                <div className="col-md-4 d-flex justify-content-center align-items-center">
                    <ProgressBar
                        progress={executionProgress}
                        status={executionStatus}
                    />
                    <StatusIndicator status={executionStatus} />
                </div>

                {/* Right Button : Run/Stop */}
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
